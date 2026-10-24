import { baseConfig } from './base.js';
import { typescriptConfig } from './typescript.js';

/**
 * @typedef {Object} VanillaConfigOptions
 * @property {string[]} [ignores] - Glob patterns to ignore. Default: `DEFAULT_IGNORES`.
 * @property {'neutral' | 'browser' | 'node' | 'universal'} [environment] - Runtime environment. Default: `'browser'`.
 * @property {Record<string, boolean>} [globalsPreset] - Global variables. Overrides `environment`.
 * @property {string[]} [tsFiles] - TypeScript layer file patterns. Default: `['**\/*.ts', '**\/*.tsx', '**\/*.mts', '**\/*.cts']`.
 * @property {boolean} [isTypeAware] - Enable type-aware linting. Default: `true`.
 * @property {import('@typescript-eslint/parser').ParserOptions['projectService']} [projectService] - Use the nearest tsconfig.json instead of tsconfigPath. Default: `false`.
 * @property {string} [tsconfigPath] - Path to tsconfig.json. Default: `'./tsconfig.json'`.
 * @property {string} [tsconfigRootDir] - Root dir for tsconfig resolution. Default: `process.cwd()`.
 */

/**
 * Vanilla preset: base ESLint rules + TypeScript + unicorn + import rules.
 *
 * @param {VanillaConfigOptions} [options]
 */
export const vanillaConfig = (options = {}) => {
  const {
    ignores,
    environment = 'browser',
    globalsPreset,
    tsFiles,
    isTypeAware,
    projectService,
    tsconfigPath,
    tsconfigRootDir,
  } = options;

  return [
    ...baseConfig({ ignores, environment, globalsPreset }),
    ...typescriptConfig({
      files: tsFiles,
      isTypeAware,
      projectService,
      tsconfigPath,
      tsconfigRootDir,
    }),
  ];
};

export default vanillaConfig();
