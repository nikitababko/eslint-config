import { baseConfig } from './base.js';
import { typescriptConfig } from './typescript.js';

/**
 * @typedef {Object} VanillaConfigOptions
 * @property {string[]} [ignores] - Glob patterns to ignore. Default: `DEFAULT_IGNORES`.
 * @property {Record<string, boolean>} [globalsPreset] - Global variables. Default: browser + node.
 * @property {string[]} [tsFiles] - TypeScript layer file patterns. Default: `['**\/*.ts', '**\/*.tsx']`.
 * @property {string} [tsconfigPath] - Path to tsconfig.json. Default: `'./tsconfig.json'`.
 * @property {string} [tsconfigRootDir] - Root dir for tsconfig resolution. Default: `process.cwd()`.
 */

/**
 * Vanilla preset: base ESLint rules + TypeScript + stylistic + unicorn.
 *
 * @param {VanillaConfigOptions} [options]
 * @returns {import('eslint').Linter.Config[]}
 */
export const vanillaConfig = (options = {}) => {
  const { ignores, globalsPreset, tsFiles, tsconfigPath, tsconfigRootDir } = options;

  return [
    ...baseConfig({ ignores, globalsPreset }),
    ...typescriptConfig({ files: tsFiles, tsconfigPath, tsconfigRootDir }),
  ];
};

export default vanillaConfig();
