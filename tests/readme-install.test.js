import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const peers = Object.entries(manifest.peerDependencies);
const sharedPeers = peers
  .filter(([name]) => !manifest.peerDependenciesMeta[name]?.optional)
  .map(([name, range]) => `${name}@${range}`);
const reactPeers = peers
  .filter(([name]) => name.startsWith('eslint-plugin-react'))
  .map(([name, range]) => `${name}@${range}`);
const solidPeers = [`eslint-plugin-solid@${manifest.peerDependencies['eslint-plugin-solid']}`];

describe('README installation commands', () => {
  it.each(['npm install', 'pnpm add', 'yarn add'])(
    '%s declares the supported peer ranges for every preset and troubleshooting',
    (command) => {
      const commands = readme
        .split(/\r?\n/u)
        .filter((line) => line.startsWith(`${command} -D `))
        .map((line) => line.slice(`${command} -D `.length).split(/\s+/u).sort());

      expect(commands).toEqual([
        [manifest.name, ...sharedPeers].sort(),
        reactPeers.sort(),
        solidPeers.sort(),
        [...sharedPeers].sort(),
      ]);
    },
  );
});
