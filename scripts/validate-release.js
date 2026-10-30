import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractReleaseNotes } from './extract-release-notes.js';

/**
 * @param {string} version
 * @param {string | undefined} tag
 * @param {string} changelog
 * @returns {string}
 */
export const validateRelease = (version, tag, changelog) => {
  if (!tag) {
    throw new Error('Provide a release tag or set GITHUB_REF_NAME.');
  }

  const expectedTag = `v${version}`;

  if (tag !== expectedTag) {
    throw new Error(
      `Release tag ${tag} does not match package.json version ${version}; expected ${expectedTag}.`,
    );
  }

  const notes = extractReleaseNotes(changelog, tag);
  const content = notes
    .split(/\r?\n/u)
    .filter((line) => !/^#{1,6}[\t ]/u.test(line) && !/^[\t ]*[-*_]{3,}[\t ]*$/u.test(line))
    .join('\n')
    .trim();

  if (!content) {
    throw new Error(`Release notes for version ${version} in CHANGELOG.md are empty.`);
  }

  return notes;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
    const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME;
    const changelog = readFileSync('CHANGELOG.md', 'utf8');

    validateRelease(version, tag, changelog);

    const isPrerelease = version.split('+')[0].includes('-');
    const npmTag = isPrerelease ? 'next' : 'latest';

    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(
        process.env.GITHUB_OUTPUT,
        `npm_tag=${npmTag}\nis_prerelease=${isPrerelease}\n`,
      );
    }

    console.log(`Validated release metadata for ${tag}.`);
    console.log(`Publication channel: ${npmTag}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
