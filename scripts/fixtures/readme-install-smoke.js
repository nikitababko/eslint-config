import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { ESLint } from 'eslint';

const name = `@nikitababko/eslint-config${process.argv[2]}`;
const { default: config } = await import(name);
await writeFile(
  'tsconfig.json',
  JSON.stringify({
    compilerOptions: { target: 'ES2022', module: 'ESNext', strict: true, jsx: 'preserve' },
    include: ['*.ts', '*.tsx'],
  }),
);
const file = process.argv[2] ? 'component.tsx' : 'sample.ts';
await writeFile(file, 'export const ready: boolean = true;\n');

const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config });
const [result] = await eslint.lintFiles([file]);
assert.equal(result.fatalErrorCount, 0, `${name}: ${JSON.stringify(result.messages)}`);
assert.ok(
  result.messages.some((message) => message.ruleId === '@typescript-eslint/naming-convention'),
  `${name} must execute type-aware rules with the dependencies installed from README`,
);
console.log(`Passed README installation for ${name} with ESLint ${ESLint.version}`);
