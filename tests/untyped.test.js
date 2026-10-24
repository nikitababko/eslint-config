import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { typescriptConfig } from '../configs/typescript.js';
import { vanillaConfig } from '../configs/vanilla.js';
import { reactConfig, reactLayer } from '../configs/react.js';
import { solidConfig, solidLayer } from '../configs/solid.js';

const fixturesDir = fileURLToPath(new URL('./fixtures/', import.meta.url));
const factories = [
  ['typescript', typescriptConfig, ['ts', 'tsx', 'mts', 'cts']],
  ['vanilla', vanillaConfig, ['ts', 'tsx', 'mts', 'cts']],
  ['react', reactConfig, ['ts', 'tsx', 'mts', 'cts']],
  ['solid', solidConfig, ['ts', 'tsx', 'mts', 'cts']],
  ['reactLayer', reactLayer, ['tsx']],
  ['solidLayer', solidLayer, ['tsx']],
];
const untypedOptions = {
  isTypeAware: false,
  tsconfigPath: './missing-tsconfig.json',
  tsconfigRootDir: fixturesDir,
};
const typeAwareCode = `
export const ready: boolean = true;
Promise.resolve();
export function acceptsCallback(callback: () => void) { callback(); }
acceptsCallback(async () => {});
`;

function createESLint(config) {
  return new ESLint({ overrideConfigFile: true, overrideConfig: config });
}

describe.each(factories)('%s without type information', (_name, createConfig, extensions) => {
  it.each(extensions)('lints .%s files without reading a tsconfig', async (extension) => {
    const [result] = await createESLint(createConfig(untypedOptions)).lintText(typeAwareCode, {
      filePath: `tools/script.${extension}`,
    });

    expect(result.messages).toEqual([]);
  });

  it('retains syntax-based TypeScript checks', async () => {
    const [result] = await createESLint(createConfig(untypedOptions)).lintText(
      'const unused: number = 1; export let value: any;',
      { filePath: 'tools/script.tsx' },
    );

    expect(result.fatalErrorCount).toBe(0);
    expect(result.messages.map((message) => message.ruleId)).toEqual(
      expect.arrayContaining([
        '@typescript-eslint/no-unused-vars',
        '@typescript-eslint/no-explicit-any',
      ]),
    );
  });

  it('disables inherited type information only for its selected files', async () => {
    const eslint = createESLint([
      ...typescriptConfig({ tsconfigRootDir: fixturesDir }),
      ...createConfig({
        ...untypedOptions,
        files: ['tools/**/*.tsx'],
        tsFiles: ['tools/**/*.tsx'],
      }),
    ]);
    const [script] = await eslint.lintText(typeAwareCode, { filePath: 'tools/script.tsx' });
    const [source] = await eslint.lintText(typeAwareCode, {
      filePath: path.join(fixturesDir, 'naming-bool-bad.ts'),
    });

    expect(script.messages).toEqual([]);
    expect(source.fatalErrorCount).toBe(0);
    expect(source.messages.map((message) => message.ruleId)).toEqual(
      expect.arrayContaining([
        '@typescript-eslint/naming-convention',
        '@typescript-eslint/no-floating-promises',
        '@typescript-eslint/no-misused-promises',
      ]),
    );
  });
});

describe('Framework rules without type information', () => {
  it.each([
    ['react', reactConfig],
    ['reactLayer', reactLayer],
  ])('%s retains React JSX checks', async (_name, createConfig) => {
    const [result] = await createESLint(createConfig(untypedOptions)).lintText(
      'export const List = () => [<div />];',
      { filePath: 'tools/component.tsx' },
    );

    expect(result.fatalErrorCount).toBe(0);
    expect(result.messages.map((message) => message.ruleId)).toContain('react/jsx-key');
  });

  it.each([
    ['solid', solidConfig],
    ['solidLayer', solidLayer],
  ])('%s retains Solid JSX checks', async (_name, createConfig) => {
    const [result] = await createESLint(createConfig(untypedOptions)).lintText(
      'export const View = () => <div id="first" id="second" />;',
      { filePath: 'tools/component.tsx' },
    );

    expect(result.fatalErrorCount).toBe(0);
    expect(result.messages.map((message) => message.ruleId)).toContain(
      'solid/jsx-no-duplicate-props',
    );
  });
});
