import { execFileSync } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { gunzipSync } from 'node:zlib';

// Check archive contents without installing dependencies. Runtime imports and
// public API types are checked by test:minimum in an installed external consumer.

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
  const packDirName = 'pack';
  const extractDirName = 'extract';

  tempRoot = await mkdtemp(join(tmpdir(), 'packaging-smoke-'));

  const packDir = join(tempRoot, packDirName);
  const extractDir = join(tempRoot, extractDirName);

  await Promise.all([mkdir(packDir, { recursive: true }), mkdir(extractDir, { recursive: true })]);

  run(PNPM_COMMAND, ['pack', '--pack-destination', packDir]);

  const tarballs = (await readdir(packDir)).filter((file) => file.endsWith('.tgz'));
  const [firstTarball] = tarballs;

  if (!firstTarball) {
    throw new Error('pnpm pack did not produce a tarball.');
  }

  tarballPath = join(packDir, firstTarball);
  packagedFiles = await extractTarball(tarballPath, extractDir);
}, 30_000);

afterAll(async () => {
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

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
        'package/configs/typescript-layer.js',
        'package/configs/typescript.d.ts',
        'package/configs/stylistic.js',
        'package/configs/stylistic.d.ts',
        'package/configs/strict.js',
        'package/configs/strict.d.ts',
        'package/configs/vanilla.js',
        'package/configs/vanilla.d.ts',
        'package/configs/react.js',
        'package/configs/react.d.ts',
        'package/configs/solid.js',
        'package/configs/solid.d.ts',
      ]),
    );
  });
});
