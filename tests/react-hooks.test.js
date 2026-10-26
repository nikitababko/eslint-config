import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { reactConfig, reactLayer } from '../configs/react.js';
import { typescriptConfig } from '../configs/typescript.js';

const fixturesDir = fileURLToPath(new URL('./fixtures/', import.meta.url));
const fixtureFiles = [
  'naming-bool-good.ts',
  'prettier-compatibility.tsx',
  'module-extensions.mts',
  'module-extensions.cts',
];
const factories = [
  ['reactConfig', reactConfig],
  ['reactLayer', reactLayer],
];
const brokenCode = `
import { useState, useEffect } from 'react';
export function useBroken(isEnabled: boolean, value: number) {
  if (isEnabled) useState(0);
  useEffect(() => { console.warn(value); }, []);
}
`;
const validCode = `
import { useState, useEffect } from 'react';
export function useCounter(value: number) {
  useEffect(() => { console.warn(value); }, [value]);
  return useState(value);
}
`;

function createESLint(config) {
  return new ESLint({ overrideConfigFile: true, overrideConfig: config });
}

describe.each(factories)('%s hooks coverage', (_name, createConfig) => {
  describe.each([true, false])('isTypeAware: %s', (isTypeAware) => {
    it.each(fixtureFiles)('checks hooks in %s', async (file) => {
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
      expect(broken.messages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ ruleId: 'react-hooks/rules-of-hooks', severity: 2 }),
          expect.objectContaining({ ruleId: 'react-hooks/exhaustive-deps', severity: 1 }),
        ]),
      );
      expect(valid.messages).toEqual([]);
    });
  });

  it('respects custom file patterns for hooks checks', async () => {
    const eslint = createESLint([
      ...typescriptConfig({ isTypeAware: false }),
      ...createConfig({ isTypeAware: false, files: ['src/hooks/**/*.ts'] }),
    ]);
    const [included] = await eslint.lintText(brokenCode, {
      filePath: 'src/hooks/use-broken.ts',
    });

    expect(included.fatalErrorCount).toBe(0);
    expect(included.messages.map((message) => message.ruleId)).toContain(
      'react-hooks/rules-of-hooks',
    );

    for (const filePath of ['src/other/use-broken.ts', 'src/hooks/use-broken.tsx']) {
      const [excluded] = await eslint.lintText(brokenCode, { filePath });

      expect(excluded.fatalErrorCount).toBe(0);
      expect(excluded.messages.some((message) => message.ruleId?.startsWith('react-hooks/'))).toBe(
        false,
      );
    }
  });
});
