import { execFileSync } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cp, mkdtemp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

// These tests validate the packed consumer-facing package shape rather than
// the workspace source files. They catch broken exports and missing packaged
// files that regular smoke tests can miss.

const PNPM_COMMAND = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const repoRoot = process.cwd();

/**
 * @param {string} command
 * @param {string[]} args
 * @param {import('node:child_process').ExecFileSyncOptionsWithStringEncoding} [options]
 */
const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
    ...options,
  });

let tempRoot;
let tarballPath;
let consumerDir;
let packagedFiles;

/**
 * @param {string} octalValue
 */
const parseTarOctal = (octalValue) => {
  const normalized = octalValue.replaceAll('\0', '').trim();

  return normalized ? Number.parseInt(normalized, 8) : 0;
};

/**
 * @param {string} tarball
 * @param {string} destinationDir
 */
const extractTarball = async (tarball, destinationDir) => {
  const tarBuffer = gunzipSync(await readFile(tarball));
  const extractedFiles = [];

  let offset = 0;

  while (offset < tarBuffer.length) {
    const header = tarBuffer.subarray(offset, offset + 512);

    if (header.every((byte) => byte === 0)) {
      break;
    }

    const name = header.toString('utf8', 0, 100).replace(/\0.*$/u, '');
    const prefix = header.toString('utf8', 345, 500).replace(/\0.*$/u, '');
    const entryPath = prefix ? `${prefix}/${name}` : name;
    const size = parseTarOctal(header.toString('utf8', 124, 136));
    const typeFlag = header.toString('utf8', 156, 157) || '0';
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    const outputPath = join(destinationDir, entryPath);

    if (typeFlag === '5') {
      await mkdir(outputPath, { recursive: true });
    } else if (typeFlag === '0' || typeFlag === '\0') {
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, tarBuffer.subarray(dataStart, dataEnd));
      extractedFiles.push(entryPath);
    }

    offset = dataStart + Math.ceil(size / 512) * 512;
  }

  return extractedFiles;
};

beforeAll(async () => {
  const cacheRoot = resolve(repoRoot, '.cache');
  const packDirName = 'pack';
  const extractDirName = 'extract';
  const packageDirName = 'package';
  const consumerDirName = 'consumer';

  await mkdir(cacheRoot, { recursive: true });
  tempRoot = await mkdtemp(join(cacheRoot, 'packaging-smoke-'));

  const packDir = join(tempRoot, packDirName);
  const extractDir = join(tempRoot, extractDirName);
  const extractedPackageDir = join(extractDir, packageDirName);

  consumerDir = join(tempRoot, consumerDirName);

  await Promise.all([
    mkdir(packDir, { recursive: true }),
    mkdir(extractDir, { recursive: true }),
    mkdir(join(consumerDir, 'node_modules', '@nikitababko'), { recursive: true }),
  ]);

  run(PNPM_COMMAND, ['pack', '--pack-destination', packDir]);

  const tarballs = (await readdir(packDir)).filter((file) => file.endsWith('.tgz'));
  const [firstTarball] = tarballs;

  if (!firstTarball) {
    throw new Error('pnpm pack did not produce a tarball.');
  }

  tarballPath = join(packDir, firstTarball);
  packagedFiles = await extractTarball(tarballPath, extractDir);

  await cp(
    extractedPackageDir,
    join(consumerDir, 'node_modules', '@nikitababko', 'eslint-config'),
    { recursive: true },
  );
}, 30_000);

afterAll(async () => {
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

/**
 * @param {string} script
 */
const runConsumerScript = (script) =>
  execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: consumerDir,
    encoding: 'utf8',
    stdio: 'pipe',
  }).trim();

describe('Packaging smoke', () => {
  it('packed tarball contains exported runtime and type files', () => {
    expect(packagedFiles).toEqual(
      expect.arrayContaining([
        'package/package.json',
        'package/README.md',
        'package/configs/index.js',
        'package/configs/index.d.ts',
        'package/configs/base.js',
        'package/configs/base.d.ts',
        'package/configs/typescript.js',
        'package/configs/typescript.d.ts',
        'package/configs/vanilla.js',
        'package/configs/vanilla.d.ts',
        'package/configs/react.js',
        'package/configs/react.d.ts',
        'package/configs/solid.js',
        'package/configs/solid.d.ts',
      ]),
    );
  });

  it('consumer can import packed package root and public subpaths', () => {
    const output = runConsumerScript(`
      const root = await import('@nikitababko/eslint-config');
      const base = await import('@nikitababko/eslint-config/base');
      const typescript = await import('@nikitababko/eslint-config/typescript');
      const vanilla = await import('@nikitababko/eslint-config/vanilla');
      const react = await import('@nikitababko/eslint-config/react');
      const solid = await import('@nikitababko/eslint-config/solid');

      console.log(JSON.stringify({
        rootDefaultIsArray: Array.isArray(root.default),
        rootHasNamedExports: Object.keys(root).some((key) => key !== 'default'),
        baseDefaultIsArray: Array.isArray(base.default),
        hasBaseConfig: typeof base.baseConfig === 'function',
        typescriptDefaultIsArray: Array.isArray(typescript.default),
        hasTypescriptConfig: typeof typescript.typescriptConfig === 'function',
        vanillaDefaultIsArray: Array.isArray(vanilla.default),
        hasVanillaSubpathConfig: typeof vanilla.vanillaConfig === 'function',
        hasReactLayer: typeof react.reactLayer === 'function',
        hasReactFiles: Array.isArray(react.DEFAULT_REACT_FILES),
        hasSolidLayer: typeof solid.solidLayer === 'function',
        hasSolidFiles: Array.isArray(solid.DEFAULT_SOLID_FILES),
      }));
    `);

    expect(JSON.parse(output)).toEqual({
      rootDefaultIsArray: true,
      rootHasNamedExports: false,
      baseDefaultIsArray: true,
      hasBaseConfig: true,
      typescriptDefaultIsArray: true,
      hasTypescriptConfig: true,
      vanillaDefaultIsArray: true,
      hasVanillaSubpathConfig: true,
      hasReactLayer: true,
      hasReactFiles: true,
      hasSolidLayer: true,
      hasSolidFiles: true,
    });
  });
});
