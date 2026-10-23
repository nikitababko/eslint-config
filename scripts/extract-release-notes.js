import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @param {string} changelog
 * @param {string} [tag]
 * @returns {string}
 */
export const extractReleaseNotes = (changelog, tag) => {
  const version = tag?.replace(/^v/u, '');

  if (!version) {
    throw new Error('Provide a release version or set GITHUB_REF_NAME.');
  }

  const headings = [
    ...changelog.matchAll(/^##[\t ]+(?:\[([^\]\r\n]+)\]|(\S+))[^\r\n]*(?:\r?\n|$)/gmu),
  ];
  const sectionIndex = headings.findIndex(
    (heading) => (heading[1] ?? heading[2]).replace(/^v/u, '') === version,
  );

  if (sectionIndex === -1) {
    throw new Error(`Could not find section for version ${version} in CHANGELOG.md.`);
  }

  const start = headings[sectionIndex].index;
  const end = headings[sectionIndex + 1]?.index ?? changelog.length;

  return `${changelog.slice(start, end).trimEnd()}\n`;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME;
    const changelog = readFileSync('CHANGELOG.md', 'utf8');
    const notes = extractReleaseNotes(changelog, tag);

    writeFileSync('release-notes.md', notes);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
