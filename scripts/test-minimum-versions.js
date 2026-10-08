import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8'));
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

// All current peer ranges are caret ranges. Fail if that changes so a new
// range cannot silently select a version above its declared minimum.
const minimumVersion = (name, range) => {
  const match = /^\^(\d+\.\d+\.\d+)$/u.exec(range);
  assert.ok(match, `Unsupported minimum-version range for ${name}: ${range}`);
  return match[1];
};

const dependencies = Object.fromEntries(
  Object.entries(manifest.peerDependencies).map(([name, range]) => [
    name,
    minimumVersion(name, range),
  ]),
);
dependencies.typescript = minimumVersion('typescript', manifest.devDependencies.typescript);

// Use the same Node.js for pnpm and the consumer, including local runs with
// an explicit path to an older Node.js binary.
const run = (command, args, cwd) =>
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH}`,
    },
  });

// A system temporary directory prevents imports from finding workspace peers.
const consumerDir = await mkdtemp(join(tmpdir(), 'eslint-config-minimum-'));

try {
  run(pnpmCommand, ['pack', '--pack-destination', consumerDir], repoRoot);
  const tarballs = (await readdir(consumerDir)).filter((file) => file.endsWith('.tgz'));
  assert.equal(tarballs.length, 1, 'Expected exactly one packed tarball');

  await writeFile(
    join(consumerDir, 'package.json'),
    JSON.stringify(
      {
        name: 'eslint-config-minimum-consumer',
        private: true,
        type: 'module',
        engines: manifest.engines,
        dependencies: {
          ...dependencies,
          [manifest.name]: `file:${join(consumerDir, tarballs[0])}`,
        },
      },
      null,
      2,
    ),
  );
  await copyFile(
    join(repoRoot, 'scripts/minimum-versions-smoke.js'),
    join(consumerDir, 'smoke.js'),
  );

  run(
    pnpmCommand,
    [
      'install',
      '--ignore-scripts',
      '--no-lockfile',
      '--config.engine-strict=true',
      '--strict-peer-dependencies',
    ],
    consumerDir,
  );
  run(process.execPath, ['smoke.js'], consumerDir);
} finally {
  await rm(consumerDir, { recursive: true, force: true });
}
