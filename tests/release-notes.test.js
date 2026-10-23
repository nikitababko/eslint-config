import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { extractReleaseNotes } from '../scripts/extract-release-notes.js';

const scriptPath = fileURLToPath(new URL('../scripts/extract-release-notes.js', import.meta.url));
const repositoryChangelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');

describe('Release notes extraction', () => {
  it.each(['[0.1.0]', '[v0.1.0]', '0.1.0', 'v0.1.0'])(
    'accepts a %s version heading with a date',
    (heading) => {
      const section = `## ${heading} – 2026-02-15\n\n- Change\n`;

      expect(extractReleaseNotes(`# Changelog\n\n${section}`, 'v0.1.0')).toBe(section);
    },
  );

  it.each(['', '\n'])('extracts the last section with trailing newline %j', (ending) => {
    const section = '## [0.1.0]\n\n- Change';

    expect(extractReleaseNotes(`${section}${ending}`, '0.1.0')).toBe(`${section}\n`);
  });

  it('keeps all subsections and stops before the next release', () => {
    const section = '## [0.2.0]\n\n### Added\n\n- Feature\n\n### Fixed\n\n- Fix\n';
    const changelog = [
      '# Changelog',
      '## [Unreleased]\n\n- Future change',
      section.trimEnd(),
      '## [0.1.0]\n\n### Added\n\n- Older change',
    ].join('\n\n');

    expect(extractReleaseNotes(changelog, 'v0.2.0')).toBe(section);
    expect(extractReleaseNotes(changelog, 'v0.1.0')).toBe(
      '## [0.1.0]\n\n### Added\n\n- Older change\n',
    );
  });

  it('stops before a non-version level-two heading', () => {
    const changelog = '## [0.1.0]\n\n- Change\n\n## References\n\nOther content';

    expect(extractReleaseNotes(changelog, 'v0.1.0')).toBe('## [0.1.0]\n\n- Change\n');
  });

  it('supports CRLF line endings', () => {
    const changelog = '## [0.2.0]\r\n\r\n- Change\r\n\r\n## [0.1.0]\r\n- Older';

    expect(extractReleaseNotes(changelog, '0.2.0')).toBe('## [0.2.0]\r\n\r\n- Change\n');
  });

  it('extracts the current repository release including its final bullet', () => {
    const notes = extractReleaseNotes(repositoryChangelog, 'v0.1.0');

    expect(notes).toContain('## [0.1.0] – 2026-02-15');
    expect(notes).toContain('### Added');
    expect(notes).toContain('- Exports map entrypoints for presets');
    expect(notes).not.toContain('## [Unreleased]');
  });

  it.each(['0.1.01', '0.1.0-beta.1', '0x1x0'])('does not confuse 0.1.0 with %s', (otherVersion) => {
    expect(() => extractReleaseNotes(`## [${otherVersion}]\n\n- Change`, '0.1.0')).toThrow(
      'Could not find section for version 0.1.0 in CHANGELOG.md.',
    );
  });

  it('matches a prerelease version including build metadata exactly', () => {
    const section = '## [1.0.0-beta.1+build.2]\n\n- Prerelease\n';

    expect(extractReleaseNotes(section, 'v1.0.0-beta.1+build.2')).toBe(section);
  });

  it('fails when the requested release is missing', () => {
    expect(() => extractReleaseNotes('## [Unreleased]\n\n- Future change', 'v0.1.0')).toThrow(
      'Could not find section for version 0.1.0 in CHANGELOG.md.',
    );
  });

  it.each([undefined, '', 'v'])('fails when the release version is %j', (tag) => {
    expect(() => extractReleaseNotes(repositoryChangelog, tag)).toThrow(
      'Provide a release version or set GITHUB_REF_NAME.',
    );
  });
});

describe('Release notes CLI', () => {
  let directory;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'eslint-config-release-notes-'));
    writeFileSync(join(directory, 'CHANGELOG.md'), repositoryChangelog);
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  const run = (args = [], tag = 'v0.1.0') =>
    spawnSync(process.execPath, [scriptPath, ...args], {
      cwd: directory,
      encoding: 'utf8',
      env: { ...process.env, GITHUB_REF_NAME: tag },
    });

  it('writes release-notes.md using GITHUB_REF_NAME as in the workflow', () => {
    const result = run();
    const notes = readFileSync(join(directory, 'release-notes.md'), 'utf8');

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(notes).toContain('## [0.1.0] – 2026-02-15');
    expect(notes).toContain('- Exports map entrypoints for presets');
    expect(notes).not.toContain('## [Unreleased]');
  });

  it('uses an explicit version argument instead of GITHUB_REF_NAME', () => {
    const result = run(['0.1.0'], 'v9.9.9');

    expect(result.status).toBe(0);
    expect(readFileSync(join(directory, 'release-notes.md'), 'utf8')).toContain('## [0.1.0]');
  });

  it.each(['v9.9.9', ''])('fails without writing notes for tag %j', (tag) => {
    const result = run([], tag);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      tag
        ? 'Could not find section for version 9.9.9 in CHANGELOG.md.'
        : 'Provide a release version or set GITHUB_REF_NAME.',
    );
    expect(existsSync(join(directory, 'release-notes.md'))).toBe(false);
  });
});
