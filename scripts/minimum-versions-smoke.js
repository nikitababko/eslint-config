import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ESLint } from 'eslint';

const consumerDir = process.cwd();
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const rootExports = await import('@nikitababko/eslint-config');
assert.deepEqual(Object.keys(rootExports), ['default'], 'The root must only export a preset');

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

for (const [subpath, factory, file] of [
  ['/typescript', 'typescriptConfig', 'sample.ts'],
  ['/vanilla', 'vanillaConfig', 'sample.ts'],
  ['/react', 'reactConfig', 'component.tsx'],
  ['/react', 'reactLayer', 'component.tsx'],
  ['/solid', 'solidConfig', 'component.tsx'],
  ['/solid', 'solidLayer', 'component.tsx'],
]) {
  const { [factory]: createConfig } = await import(`@nikitababko/eslint-config${subpath}`);
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: createConfig({ projectService: true, tsconfigRootDir: consumerDir }),
  });
  const [result] = await eslint.lintFiles([file]);
  assert.equal(result.fatalErrorCount, 0, `${factory}: ${JSON.stringify(result.messages)}`);
  assert.ok(
    result.messages.some((message) => message.ruleId === '@typescript-eslint/naming-convention'),
    `${factory} must execute type-aware rules with projectService`,
  );
  console.log(`Passed ${factory} with projectService`);
}

const { default: strict } = await import('@nikitababko/eslint-config/strict');
const { vanillaConfig } = await import('@nikitababko/eslint-config/vanilla');
const strictESLint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [...vanillaConfig({ projectService: true }), ...strict],
});
const [strictResult] = await strictESLint.lintText(
  `export const value = JSON.parse('{}');
  export function describeState(state: 'loading' | 'ready') {
    switch (state) { case 'loading': return 'Loading'; }
  }`,
  { filePath: join(consumerDir, 'sample.ts') },
);
assert.equal(strictResult.fatalErrorCount, 0, JSON.stringify(strictResult.messages));
for (const ruleId of [
  '@typescript-eslint/no-unsafe-assignment',
  '@typescript-eslint/switch-exhaustiveness-check',
]) {
  assert.ok(
    strictResult.messages.some((message) => message.ruleId === ruleId && message.severity === 2),
    `The strict layer must execute ${ruleId}`,
  );
}
console.log('Passed @nikitababko/eslint-config/strict with type-aware safety checks');
