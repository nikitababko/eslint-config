import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { validateRelease } from '../scripts/validate-release.js';

const scriptPath = fileURLToPath(new URL('../scripts/validate-release.js', import.meta.url));
const releaseChangelog = readFileSync(
  new URL('./fixtures/release-changelog.md', import.meta.url),
  'utf8',
);

describe('Release validation', () => {
  it('accepts a tag matching package.json and returns its release notes', () => {
    const notes = validateRelease('0.1.0', 'v0.1.0', releaseChangelog);

    expect(notes).toContain('## [0.1.0]');
    expect(notes).toContain('- Exports map entrypoints for presets');
    expect(notes).not.toContain('## [Unreleased]');
  });

  it('accepts an exact prerelease tag', () => {
    const notes = '## [1.0.0-beta.1]\n\n- Prerelease\n';

    expect(validateRelease('1.0.0-beta.1', 'v1.0.0-beta.1', notes)).toBe(notes);
  });

  it('rejects a different tag even when its changelog section exists', () => {
    expect(() => validateRelease('0.2.0', 'v0.1.0', releaseChangelog)).toThrow(
      'Release tag v0.1.0 does not match package.json version 0.2.0; expected v0.2.0.',
    );
  });

  it.each(['0.1.0', 'v0.1.0-extra', 'v0.1.00'])(
    'rejects a tag that does not match the exact v<version> format: %s',
    (tag) => {
      expect(() => validateRelease('0.1.0', tag, releaseChangelog)).toThrow('expected v0.1.0.');
    },
  );

  it.each([undefined, ''])('rejects a missing release tag: %j', (tag) => {
    expect(() => validateRelease('0.1.0', tag, releaseChangelog)).toThrow(
      'Provide a release tag or set GITHUB_REF_NAME.',
    );
  });

  it('rejects a release with no matching notes', () => {
    expect(() => validateRelease('0.2.0', 'v0.2.0', releaseChangelog)).toThrow(
      'Could not find section for version 0.2.0 in CHANGELOG.md.',
    );
  });

  it.each(['', '\n\n', '\n\n### Added\n\n---\n'])(
    'rejects an empty release section with content %j',
    (content) => {
      const changelog = `## [Unreleased]\n\n- Future change\n\n## [0.1.0]${content}`;

      expect(() => validateRelease('0.1.0', 'v0.1.0', changelog)).toThrow(
        'Release notes for version 0.1.0 in CHANGELOG.md are empty.',
      );
    },
  );
});

describe('Release validation CLI', () => {
  let directory;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'eslint-config-release-validation-'));
    writeFileSync(join(directory, 'package.json'), JSON.stringify({ version: '0.1.0' }));
    writeFileSync(join(directory, 'CHANGELOG.md'), releaseChangelog);
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  const run = (args = [], tag = 'v0.1.0', outputPath = join(directory, 'github-output')) =>
    spawnSync(process.execPath, [scriptPath, ...args], {
      cwd: directory,
      encoding: 'utf8',
      env: { ...process.env, GITHUB_REF_NAME: tag, GITHUB_OUTPUT: outputPath },
    });

  it('validates GITHUB_REF_NAME against package.json as in the workflow', () => {
    const result = run();

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Validated release metadata for v0.1.0.');
    expect(result.stderr).toBe('');
  });

  it('uses an explicit tag argument instead of GITHUB_REF_NAME', () => {
    const result = run(['v0.1.0'], 'v9.9.9');

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it.each([
    ['0.1.0', 'latest', false],
    ['1.0.0+build.2', 'latest', false],
    ['1.0.0+build-2', 'latest', false],
    ['1.0.0-alpha.1', 'next', true],
    ['1.0.0-beta.1', 'next', true],
    ['1.0.0-rc.1', 'next', true],
    ['1.0.0-0', 'next', true],
    ['1.0.0-beta.1+build-2', 'next', true],
  ])('exports the publication channel for %s', (version, npmTag, isPrerelease) => {
    writeFileSync(join(directory, 'package.json'), JSON.stringify({ version }));
    writeFileSync(join(directory, 'CHANGELOG.md'), `## [${version}]\n\n- Release notes\n`);

    const result = run([], `v${version}`);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(readFileSync(join(directory, 'github-output'), 'utf8')).toBe(
      `npm_tag=${npmTag}\nis_prerelease=${isPrerelease}\n`,
    );
  });

  it('appends publication metadata without replacing existing step outputs', () => {
    writeFileSync(join(directory, 'github-output'), 'existing=value\n');

    const result = run();

    expect(result.status).toBe(0);
    expect(readFileSync(join(directory, 'github-output'), 'utf8')).toBe(
      'existing=value\nnpm_tag=latest\nis_prerelease=false\n',
    );
  });

  it('validates locally without GITHUB_OUTPUT', () => {
    const result = run([], 'v0.1.0', '');

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(existsSync(join(directory, 'github-output'))).toBe(false);
  });

  it('fails when the tag does not match package.json', () => {
    const result = run([], 'v0.2.0');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('expected v0.1.0.');
    expect(existsSync(join(directory, 'github-output'))).toBe(false);
  });

  it('fails when GITHUB_REF_NAME is missing', () => {
    const result = run([], '');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Provide a release tag or set GITHUB_REF_NAME.');
  });

  it('fails when release notes are missing', () => {
    writeFileSync(join(directory, 'CHANGELOG.md'), '## [Unreleased]\n\n- Future change\n');

    const result = run();

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Could not find section for version 0.1.0');
    expect(existsSync(join(directory, 'github-output'))).toBe(false);
  });

  it('fails when release notes contain only headings', () => {
    writeFileSync(join(directory, 'CHANGELOG.md'), '## [0.1.0]\n\n### Added\n');

    const result = run();

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Release notes for version 0.1.0 in CHANGELOG.md are empty.');
    expect(existsSync(join(directory, 'github-output'))).toBe(false);
  });
});
