import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import { fileURLToPath } from 'node:url';

import strict, { strictConfig } from '../configs/strict.js';
import { typescriptConfig } from '../configs/typescript.js';
import { vanillaConfig } from '../configs/vanilla.js';
import { reactConfig } from '../configs/react.js';
import { solidConfig } from '../configs/solid.js';

const fixturesDir = fileURLToPath(new URL('./fixtures/', import.meta.url));
const fixturePath = fileURLToPath(new URL('./fixtures/strict.ts', import.meta.url));
const projectOptions = { tsconfigRootDir: fixturesDir };

function createESLint(config = [...typescriptConfig(projectOptions), ...strict]) {
  return new ESLint({ overrideConfigFile: true, overrideConfig: config });
}

async function lintText(code, config) {
  const [result] = await createESLint(config).lintText(code, { filePath: fixturePath });
  expect(result.fatalErrorCount).toBe(0);
  return result.messages;
}

describe('Optional strict layer', () => {
  it.each([
    ['no-unsafe-assignment', 'export const value = JSON.parse("{}");'],
    ['no-unsafe-call', 'declare const value: any; value();'],
    [
      'no-unsafe-argument',
      'declare const value: any; export const text = ((text: string) => text)(value);',
    ],
    ['no-unsafe-member-access', 'declare const value: any; export const text = value.text;'],
    ['no-unsafe-return', 'export function read(value: any): string { return value; }'],
    ['no-explicit-any', 'export let value: any;'],
    ['no-floating-promises', 'Promise.resolve("text");'],
  ])('reports %s as an error', async (rule, code) => {
    const messages = await lintText(code);

    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: `@typescript-eslint/${rule}`, severity: 2 }),
      ]),
    );
  });

  it.each(['', 'default: return "fallback";'])(
    'requires every union case even with a default branch (%s)',
    async (defaultBranch) => {
      const messages = await lintText(`
        export function describeState(state: 'loading' | 'ready') {
          switch (state) {
            case 'loading': return 'Loading';
            ${defaultBranch}
          }
        }
      `);

      expect(messages).toContainEqual(
        expect.objectContaining({
          ruleId: '@typescript-eslint/switch-exhaustiveness-check',
          severity: 2,
          message: expect.stringContaining('"ready"'),
        }),
      );
    },
  );

  it('requires every enum case', async () => {
    const messages = await lintText(`
      enum State { Loading, Ready }
      export function describeState(state: State) {
        switch (state) {
          case State.Loading: return 'Loading';
        }
      }
    `);

    expect(messages).toContainEqual(
      expect.objectContaining({ ruleId: '@typescript-eslint/switch-exhaustiveness-check' }),
    );
  });

  it('accepts narrowed unknown values, exhaustive switches, and awaited promises', async () => {
    const [result] = await createESLint().lintFiles([fixturePath]);

    expect(result.messages).toEqual([]);
  });

  it.each([
    ['typescript', typescriptConfig],
    ['vanilla', vanillaConfig],
    ['react', reactConfig],
    ['solid', solidConfig],
  ])('only changes the %s preset when explicitly appended', async (_name, createConfig) => {
    const config = createConfig(projectOptions);
    const code = 'export const value = JSON.parse("{}"); export let other: any; Promise.resolve();';
    const normalMessages = await lintText(code, config);
    const strictMessages = await lintText(code, [...config, ...strict]);

    expect(normalMessages.filter((message) => message.severity === 2)).toEqual([]);
    expect(normalMessages.map((message) => message.ruleId)).not.toContain(
      '@typescript-eslint/no-unsafe-assignment',
    );
    expect(strictMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: '@typescript-eslint/no-unsafe-assignment', severity: 2 }),
        expect.objectContaining({ ruleId: '@typescript-eslint/no-explicit-any', severity: 2 }),
        expect.objectContaining({ ruleId: '@typescript-eslint/no-floating-promises', severity: 2 }),
      ]),
    );
  });

  it.each(['prettier-compatibility.tsx', 'module-extensions.mts', 'module-extensions.cts'])(
    'applies to %s by default',
    async (filename) => {
      const filePath = fileURLToPath(new URL(`./fixtures/${filename}`, import.meta.url));
      const [result] = await createESLint().lintText('export const value = JSON.parse("{}");', {
        filePath,
      });

      expect(result.fatalErrorCount).toBe(0);
      expect(result.messages).toContainEqual(
        expect.objectContaining({ ruleId: '@typescript-eslint/no-unsafe-assignment', severity: 2 }),
      );
    },
  );

  it('preserves projectService settings from the preceding preset', async () => {
    const messages = await lintText('export const value = JSON.parse("{}");', [
      ...vanillaConfig({ ...projectOptions, projectService: true, tsconfigPath: './missing.json' }),
      ...strict,
    ]);

    expect(messages).toContainEqual(
      expect.objectContaining({ ruleId: '@typescript-eslint/no-unsafe-assignment' }),
    );
  });

  it('limits stricter checks to the selected files', async () => {
    const messages = await lintText('export let value: any;', [
      ...typescriptConfig(projectOptions),
      ...strictConfig({ files: ['src/**/*.ts'] }),
    ]);

    expect(messages).toEqual([
      expect.objectContaining({ ruleId: '@typescript-eslint/no-explicit-any', severity: 1 }),
    ]);
  });

  it('leaves JavaScript files outside the strict layer by default', async () => {
    const [result] = await createESLint([...vanillaConfig(projectOptions), ...strict]).lintText(
      'export const value = JSON.parse("{}");',
      { filePath: 'script.js' },
    );

    expect(result.messages).toEqual([]);
  });

  it('supports untyped files while keeping explicit any an error', async () => {
    const [result] = await createESLint([
      ...typescriptConfig({ ...projectOptions, tsconfigPath: './missing.json' }),
      ...strictConfig({ isTypeAware: false }),
    ]).lintText('export let value: any; Promise.resolve();', { filePath: 'tools/script.ts' });

    expect(result.messages).toEqual([
      expect.objectContaining({ ruleId: '@typescript-eslint/no-explicit-any', severity: 2 }),
    ]);
  });

  it('disables type-aware checks only for files selected by the untyped override', async () => {
    const eslint = createESLint([
      ...typescriptConfig(projectOptions),
      ...strict,
      ...strictConfig({ files: ['tools/**/*.ts'], isTypeAware: false }),
    ]);
    const [script] = await eslint.lintText('Promise.resolve();', { filePath: 'tools/script.ts' });
    const [source] = await eslint.lintText('Promise.resolve();', { filePath: fixturePath });

    expect(script.messages).toEqual([]);
    expect(source.fatalErrorCount).toBe(0);
    expect(source.messages).toContainEqual(
      expect.objectContaining({ ruleId: '@typescript-eslint/no-floating-promises', severity: 2 }),
    );
  });
});
