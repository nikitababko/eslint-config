import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import { format, resolveConfig } from 'prettier';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { baseConfig } from '../configs/base.js';
import { typescriptConfig } from '../configs/typescript.js';
import { vanillaConfig } from '../configs/vanilla.js';
import { reactConfig, reactLayer } from '../configs/react.js';
import { solidConfig, solidLayer } from '../configs/solid.js';
import stylistic, { stylisticConfig } from '../configs/stylistic.js';

const fixturesDir = fileURLToPath(new URL('./fixtures/', import.meta.url));
const fixturePath = path.join(fixturesDir, 'typescript-compatibility.ts');
const jsxFixturePath = path.join(fixturesDir, 'prettier-compatibility.tsx');
const options = {
  tsconfigPath: path.join(fixturesDir, 'tsconfig.json'),
  tsconfigRootDir: fixturesDir,
};
const configs = [
  ['typescript', typescriptConfig(options)],
  ['vanilla', vanillaConfig(options)],
  ['react', reactConfig(options)],
  ['solid', solidConfig(options)],
  ['reactLayer', reactLayer(options)],
  ['solidLayer', solidLayer(options)],
];
const prettierOptions = await resolveConfig(
  fileURLToPath(new URL('../.prettierrc', import.meta.url)),
);

function createESLint(config) {
  return new ESLint({
    overrideConfigFile: true,
    overrideConfig: [...config, { settings: { react: { version: '19' } } }],
  });
}

describe('Prettier compatibility', () => {
  it.each(configs)('%s accepts Prettier output with apostrophes and TSX', async (_name, config) => {
    const code = `export const App = () => <div title="don't"><span>hello</span><span>world</span></div>;`;
    const formatted = await format(code, { ...prettierOptions, parser: 'typescript' });
    const [result] = await createESLint(config).lintText(formatted, { filePath: jsxFixturePath });

    expect(result.messages).toEqual([]);
  });

  it.each(configs.slice(0, 4))('%s accepts custom Prettier options', async (_name, config) => {
    const formatted = await format('export const labels = { first: "hello", second: "world" };', {
      parser: 'typescript',
      singleQuote: false,
      semi: false,
      useTabs: true,
      bracketSpacing: false,
      trailingComma: 'none',
      printWidth: 20,
    });
    const [result] = await createESLint(config).lintText(formatted, { filePath: fixturePath });

    expect(result.messages).toEqual([]);
  });

  it.each(configs.slice(0, 4))(
    '%s leaves unbreakable line length to Prettier',
    async (_name, config) => {
      const code = `export const ${'a'.repeat(110)} = 1;`;
      const formatted = await format(code, { ...prettierOptions, parser: 'typescript' });
      const [result] = await createESLint(config).lintText(formatted, { filePath: fixturePath });

      expect(result.messages).toEqual([]);
    },
  );
});

describe('Optional stylistic layer', () => {
  it('enforces quotes and semicolons when appended to a preset', async () => {
    const eslint = createESLint([...vanillaConfig(options), ...stylistic]);
    const [result] = await eslint.lintText('export const text = "hello"', {
      filePath: fixturePath,
    });

    expect(result.messages.map((message) => message.ruleId)).toEqual([
      '@stylistic/quotes',
      '@stylistic/semi',
    ]);
  });

  it('accepts Prettier quotes around a string containing an apostrophe', async () => {
    const formatted = await format('export const text = "don\'t";', {
      ...prettierOptions,
      parser: 'typescript',
    });
    const [result] = await createESLint([...vanillaConfig(options), ...stylistic]).lintText(
      formatted,
      {
        filePath: fixturePath,
      },
    );

    expect(result.messages).toEqual([]);
  });

  it('limits formatting checks to configured files', async () => {
    const eslint = createESLint([
      ...vanillaConfig(options),
      ...stylisticConfig({ files: ['tests/fixtures/naming-bool-good.ts'] }),
    ]);
    const code = 'export const text = "hello"';
    const [included] = await eslint.lintText(code, {
      filePath: path.join(fixturesDir, 'naming-bool-good.ts'),
    });
    const [excluded] = await eslint.lintText(code, { filePath: fixturePath });

    expect(included.messages.map((message) => message.ruleId)).toContain('@stylistic/quotes');
    expect(excluded.messages).toEqual([]);
  });

  it('works with the base JavaScript preset without a TypeScript layer', async () => {
    const [result] = await createESLint([...baseConfig(), ...stylistic]).lintText(
      'export const text = "hello"',
      { filePath: 'file.js' },
    );

    expect(result.messages.map((message) => message.ruleId)).toEqual([
      '@stylistic/quotes',
      '@stylistic/semi',
    ]);
  });
});
