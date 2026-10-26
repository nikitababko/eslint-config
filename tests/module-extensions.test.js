import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { baseConfig } from '../configs/base.js';
import { typescriptConfig } from '../configs/typescript.js';
import { vanillaConfig } from '../configs/vanilla.js';
import { reactConfig } from '../configs/react.js';
import { solidConfig } from '../configs/solid.js';
import stylistic from '../configs/stylistic.js';

const fixturesDir = fileURLToPath(new URL('./fixtures/', import.meta.url));
const options = {
  environment: 'node',
  tsconfigPath: path.join(fixturesDir, 'tsconfig.json'),
  tsconfigRootDir: fixturesDir,
};
const configs = [
  ['typescript', [...baseConfig(options), ...typescriptConfig(options)]],
  ['vanilla', vanillaConfig(options)],
  ['react', reactConfig(options)],
  ['solid', solidConfig(options)],
];
const extensions = ['mts', 'cts'];

function fixturePath(extension) {
  return path.join(fixturesDir, `module-extensions.${extension}`);
}

function createESLint(config) {
  return new ESLint({ overrideConfigFile: true, overrideConfig: config });
}

describe.each(configs)('%s module extensions', (_name, config) => {
  it.each(extensions)('lints valid .%s files with the default file patterns', async (extension) => {
    const [result] = await createESLint(config).lintFiles([fixturePath(extension)]);

    expect(result.messages).toEqual([]);
  });

  it.each(extensions)('runs type-aware rules on .%s files', async (extension) => {
    const [result] = await createESLint(config).lintText(
      'export const ready: boolean = true;\nPromise.resolve();\n',
      { filePath: fixturePath(extension) },
    );

    expect(result.fatalErrorCount).toBe(0);
    expect(result.messages.map((message) => message.ruleId)).toEqual(
      expect.arrayContaining([
        '@typescript-eslint/naming-convention',
        '@typescript-eslint/no-floating-promises',
      ]),
    );
  });
});

describe('Module extensions with optional and custom file patterns', () => {
  it.each(extensions)('applies the optional stylistic layer to .%s files', async (extension) => {
    const [result] = await createESLint([...vanillaConfig(options), ...stylistic]).lintText(
      'export const text = "hello"',
      { filePath: fixturePath(extension) },
    );

    expect(result.messages.map((message) => message.ruleId)).toEqual([
      '@stylistic/quotes',
      '@stylistic/semi',
    ]);
  });

  it.each(extensions)('respects explicit file patterns for .%s files', async (extension) => {
    const configs = [
      typescriptConfig({ ...options, files: ['**/*.ts'] }),
      vanillaConfig({ ...options, tsFiles: ['**/*.ts'] }),
      reactConfig({ ...options, tsFiles: ['**/*.ts'], files: ['**/*.ts'] }),
      solidConfig({ ...options, tsFiles: ['**/*.ts'] }),
    ];

    for (const config of configs) {
      expect(await createESLint(config).isPathIgnored(fixturePath(extension))).toBe(true);
    }
  });
});
