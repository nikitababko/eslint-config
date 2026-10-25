import { createTypescriptLayer } from './typescript-layer.js';

export { commonTsRules, DEFAULT_TS_FILES } from './typescript-layer.js';

/**
 * @typedef {Object} TypescriptConfigOptions
 * @property {string[]} [files] - File patterns to lint with this layer. Default: `['**\/*.ts', '**\/*.tsx', '**\/*.mts', '**\/*.cts']`.
 * @property {boolean} [isTypeAware] - Enable type-aware linting. Default: `true`.
 * @property {import('@typescript-eslint/parser').ParserOptions['projectService']} [projectService] - Use the nearest tsconfig.json instead of tsconfigPath. Default: `false`.
 * @property {string} [tsconfigPath] - Path to tsconfig.json. Default: `'./tsconfig.json'`.
 * @property {string} [tsconfigRootDir] - Root dir for tsconfig resolution. Default: `process.cwd()`.
 */

/**
 * TypeScript layer: TS parser + type-aware rules + unicorn + import rules.
 *
 * @param {TypescriptConfigOptions} [options]
 */
export const typescriptConfig = (options = {}) => createTypescriptLayer(options);

export default typescriptConfig();
