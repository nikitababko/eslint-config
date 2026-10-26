import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const manifest = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8'));
const readme = await readFile(join(repoRoot, 'README.md'), 'utf8');
const installation = readme.split('## Installation\n')[1]?.split('\n---')[0];
assert.ok(installation, 'README must have an Installation section');
const commands = [...installation.matchAll(/^npm install -D (.+)$/gmu)].map(([, packages]) =>
  packages.trim().split(/\s+/u),
);
assert.equal(commands.length, 3, 'Expected shared, React, and Solid npm installation commands');
const [shared, react, solid] = commands;
assert.ok(shared.includes(manifest.name), 'The shared command must install this package');

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (command, args, cwd) =>
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_PATH: '',
      PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH}`,
    },
  });

const tempRoot = await mkdtemp(join(tmpdir(), 'eslint-config-readme-'));

try {
  const relativeTempRoot = relative(repoRoot, await realpath(tempRoot));
  assert.ok(
    relativeTempRoot.startsWith(`..${sep}`) || isAbsolute(relativeTempRoot),
    'Consumers must be outside the repository; check TMPDIR',
  );
  run(pnpmCommand, ['pack', '--pack-destination', tempRoot], repoRoot);
  const tarballs = (await readdir(tempRoot)).filter((file) => file.endsWith('.tgz'));
  assert.equal(tarballs.length, 1, 'Expected exactly one packed tarball');
  // Only replace the unpublished package with its tarball; resolve peer ranges from README.
  const sharedPackages = shared.map((name) =>
    name === manifest.name ? join(tempRoot, tarballs[0]) : name,
  );

  for (const [preset, subpath, extraPackages] of [
    ['vanilla', '', []],
    ['react', '/react', react],
    ['solid', '/solid', solid],
  ]) {
    const consumerDir = join(tempRoot, preset);
    await mkdir(consumerDir);
    await writeFile(
      join(consumerDir, 'package.json'),
      JSON.stringify({ name: `readme-${preset}`, private: true, type: 'module' }),
    );
    const install = (packages) =>
      run(
        npmCommand,
        [
          'install',
          '-D',
          ...packages,
          '--ignore-scripts',
          '--no-package-lock',
          '--strict-peer-deps',
          '--legacy-peer-deps=false',
          '--force=false',
          '--engine-strict',
          '--no-audit',
          '--no-fund',
          '--cache',
          join(tempRoot, 'npm-cache'),
        ],
        consumerDir,
      );

    console.log(`Checking README installation for ${preset}`);
    install(sharedPackages);
    if (extraPackages.length > 0) {
      install(extraPackages);
    }
    await copyFile(
      join(repoRoot, 'scripts/fixtures/readme-install-smoke.js'),
      join(consumerDir, 'smoke.js'),
    );
    run(process.execPath, ['smoke.js', subpath], consumerDir);
  }
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
