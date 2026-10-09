import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ESLint } from 'eslint';

const consumerDir = process.cwd();
const manifest = JSON.parse(await readFile('package.json', 'utf8'));

// Check what was actually installed, including optional framework peers.
for (const [name, version] of Object.entries(manifest.dependencies)) {
  if (version.startsWith('file:')) {
    continue;
  }
  const installed = JSON.parse(
    await readFile(join(consumerDir, 'node_modules', name, 'package.json'), 'utf8'),
  );
  assert.equal(installed.version, version, `${name} must use its exact minimum version`);
}

await writeFile(
  'tsconfig.json',
  JSON.stringify({
    compilerOptions: { target: 'ES2022', module: 'ESNext', strict: true, jsx: 'preserve' },
    include: ['*.ts', '*.tsx'],
  }),
);
await writeFile('sample.js', 'export const value = 1;\n');
await writeFile('sample.ts', 'export const ready: boolean = true;\n');
await writeFile('component.tsx', 'export const ready: boolean = true;\n');

const presets = [
  ['', 'sample.ts'],
  ['/base', 'sample.js'],
  ['/stylistic', 'sample.js'],
  ['/typescript', 'sample.ts'],
  ['/vanilla', 'sample.ts'],
  ['/react', 'component.tsx'],
  ['/solid', 'component.tsx'],
];

for (const [subpath, file] of presets) {
  const name = `@nikitababko/eslint-config${subpath}`;
  const { default: config } = await import(name);
  assert.ok(Array.isArray(config) && config.length > 0, `${name} must export a preset`);

  const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config });
  const [result] = await eslint.lintFiles([file]);
  assert.equal(result.fatalErrorCount, 0, `${name}: ${JSON.stringify(result.messages)}`);
  if (subpath === '/base' || subpath === '/stylistic') {
    assert.equal(result.errorCount, 0, `${name} must lint JavaScript`);
  } else {
    assert.ok(
      result.messages.some((message) => message.ruleId === '@typescript-eslint/naming-convention'),
      `${name} must execute type-aware rules`,
    );
  }
  console.log(`Passed ${name} on Node.js ${process.versions.node}, ESLint ${ESLint.version}`);
}
