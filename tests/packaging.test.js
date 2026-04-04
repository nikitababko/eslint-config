import { execFileSync } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readdir, rm, symlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';

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

  run('tar', ['-xzf', tarballPath, '-C', extractDir]);

  await symlink(
    extractedPackageDir,
    join(consumerDir, 'node_modules', '@nikitababko', 'eslint-config'),
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
    const files = run('tar', ['-tf', tarballPath]).split('\n').filter(Boolean);

    expect(files).toEqual(
      expect.arrayContaining([
        'package/package.json',
        'package/README.md',
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
        hasVanillaConfig: typeof root.vanillaConfig === 'function',
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
      hasVanillaConfig: true,
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
