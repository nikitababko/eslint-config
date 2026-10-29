import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { solidConfig, solidLayer } from '../configs/solid.js';
import { typescriptConfig } from '../configs/typescript.js';

const fixturesDir = fileURLToPath(new URL('./fixtures/', import.meta.url));
const fixtureFiles = [
  'naming-bool-good.ts',
  'prettier-compatibility.tsx',
  'module-extensions.mts',
  'module-extensions.cts',
];
const factories = [
  ['solidConfig', solidConfig],
  ['solidLayer', solidLayer],
];
const brokenCode = `
import { createEffect, createSignal } from 'solid-js';
export function createCounter() {
  const [count, setCount] = createSignal(0);
  const doubled = count() * 2;
  createEffect(async () => {
    await Promise.resolve();
    console.warn(count());
  });
  return { count, setCount, doubled };
}
`;
const validCode = `
import { createEffect, createSignal } from 'solid-js';
export function createCounter() {
  const [count, setCount] = createSignal(0);
  const doubled = () => count() * 2;
  createEffect(() => { console.warn(count()); });
  return { count, setCount, doubled };
}
`;

function createESLint(config) {
  return new ESLint({ overrideConfigFile: true, overrideConfig: config });
}

describe.each(factories)('%s reactivity coverage', (_name, createConfig) => {
  describe.each([true, false])('isTypeAware: %s', (isTypeAware) => {
    it.each(fixtureFiles)('checks reactivity in %s', async (file) => {
      const eslint = createESLint(
        createConfig({
          isTypeAware,
          tsconfigPath: './tsconfig.json',
          tsconfigRootDir: fixturesDir,
        }),
      );
      const filePath = path.join(fixturesDir, file);
      const [broken] = await eslint.lintText(brokenCode, { filePath });
      const [valid] = await eslint.lintText(validCode, { filePath });

      expect(broken.fatalErrorCount).toBe(0);
      expect(broken.messages.filter((message) => message.ruleId === 'solid/reactivity')).toEqual([
        expect.objectContaining({
          severity: 2,
          message: expect.stringContaining("The reactive variable 'count'"),
        }),
        expect.objectContaining({
          severity: 2,
          message: expect.stringContaining('This tracked scope should not be async'),
        }),
      ]);
      expect(valid.messages).toEqual([]);
    });
  });

  it('respects custom file patterns for reactivity checks', async () => {
    const eslint = createESLint([
      ...typescriptConfig({ isTypeAware: false }),
      ...createConfig({ isTypeAware: false, files: ['src/stores/**/*.ts'] }),
    ]);
    const [included] = await eslint.lintText(brokenCode, {
      filePath: 'src/stores/create-counter.ts',
    });

    expect(included.fatalErrorCount).toBe(0);
    expect(included.messages.map((message) => message.ruleId)).toContain('solid/reactivity');

    for (const filePath of [
      'src/other/create-counter.ts',
      'src/stores/create-counter.tsx',
      'src/stores/create-counter.mts',
      'src/stores/create-counter.cts',
    ]) {
      const [excluded] = await eslint.lintText(brokenCode, { filePath });

      expect(excluded.fatalErrorCount).toBe(0);
      expect(excluded.messages.some((message) => message.ruleId?.startsWith('solid/'))).toBe(false);
    }
  });
});
