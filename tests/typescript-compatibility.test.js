import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

import { baseConfig } from '../configs/base.js';
import { typescriptConfig } from '../configs/typescript.js';
import { vanillaConfig } from '../configs/vanilla.js';
import { reactConfig, reactLayer } from '../configs/react.js';
import { solidConfig, solidLayer } from '../configs/solid.js';

const fixturesDir = fileURLToPath(new URL('./fixtures/', import.meta.url));
const fixturePath = path.join(fixturesDir, 'typescript-compatibility.ts');
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
  ['reactLayer', [...baseConfig(options), ...reactLayer({ ...options, files: ['**/*.ts'] })]],
  ['solidLayer', [...baseConfig(options), ...solidLayer({ ...options, files: ['**/*.ts'] })]],
];
const layers = [
  ['typescriptConfig', typescriptConfig],
  ['reactLayer', reactLayer],
  ['solidLayer', solidLayer],
];

function createESLint(config) {
  return new ESLint({ overrideConfigFile: true, overrideConfig: config });
}

describe('TypeScript compatibility with ESLint recommended rules', () => {
  it('accepts the regression fixture in the TypeScript compiler', () => {
    const configFile = ts.readConfigFile(options.tsconfigPath, ts.sys.readFile);
    const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, fixturesDir);
    const program = ts.createProgram([fixturePath], parsedConfig.options);

    expect(configFile.error).toBeUndefined();
    expect(parsedConfig.errors).toEqual([]);
    expect(ts.getPreEmitDiagnostics(program)).toEqual([]);
  });

  it.each(configs)(
    '%s allows overloads, declaration merging and NodeJS types',
    async (_name, config) => {
      const [result] = await createESLint(config).lintFiles([fixturePath]);

      expect(result.messages).toEqual([]);
    },
  );

  it.each(configs.slice(0, 4))(
    '%s preserves recommended checks for JavaScript',
    async (_name, config) => {
      const [result] = await createESLint(config).lintText('var value; var value; missing;', {
        filePath: 'file.js',
      });
      const ruleIds = result.messages.map((message) => message.ruleId);

      expect(ruleIds).toContain('no-redeclare');
      expect(ruleIds).toContain('no-undef');
    },
  );

  it.each(layers)(
    '%s preserves core checks when JavaScript is explicitly selected',
    async (_name, createLayer) => {
      const config = [
        ...baseConfig({ environment: 'node' }),
        ...createLayer({ files: ['eslint.config.js'] }),
      ];
      const [result] = await createESLint(config).lintText('var value; var value; missing;', {
        filePath: 'eslint.config.js',
      });
      const ruleIds = result.messages.map((message) => message.ruleId);

      expect(result.fatalErrorCount).toBe(0);
      expect(ruleIds).toContain('no-redeclare');
      expect(ruleIds).toContain('no-undef');
    },
  );

  it.each(layers)(
    '%s limits compatibility rules to its configured files',
    async (_name, createLayer) => {
      const eslint = createESLint([
        ...baseConfig(),
        ...createLayer({ ...options, files: ['tests/fixtures/**/*.ts'] }),
        { files: ['**/*.ts'] },
      ]);
      const includedConfig = await eslint.calculateConfigForFile(fixturePath);
      const excludedConfig = await eslint.calculateConfigForFile('other/file.ts');

      expect(includedConfig.rules['no-undef'][0]).toBe(0);
      expect(includedConfig.rules['no-redeclare'][0]).toBe(0);
      expect(excludedConfig.rules['no-undef'][0]).toBe(2);
      expect(excludedConfig.rules['no-redeclare'][0]).toBe(2);
    },
  );

  it('uses the TypeScript extension to report unused variables only once', async () => {
    const [result] = await createESLint(configs[0][1]).lintText('const unused = 1;', {
      filePath: fixturePath,
    });

    expect(result.messages.map((message) => message.ruleId)).toEqual([
      '@typescript-eslint/no-unused-vars',
    ]);
  });

  it('preserves the supported core precision check', async () => {
    const [result] = await createESLint(configs[0][1]).lintText(
      'export const amount = 9_007_199_254_740_993;',
      { filePath: fixturePath },
    );

    expect(result.messages.map((message) => message.ruleId)).toEqual(['no-loss-of-precision']);
  });
});
