import solid from 'eslint-plugin-solid';

import { createTypescriptLayer, DEFAULT_TS_FILES } from './typescript-layer.js';
import { RULE_STATUSES } from './constants.js';

export const DEFAULT_SOLID_FILES = [...DEFAULT_TS_FILES];

/**
 * @typedef {Object} SolidLayerOptions
 * @property {string[]} [files] - File patterns to lint. Default: `['**\/*.ts', '**\/*.tsx', '**\/*.mts', '**\/*.cts']`.
 * @property {boolean} [isTypeAware] - Enable type-aware linting. Default: `true`.
 * @property {import('@typescript-eslint/parser').ParserOptions['projectService']} [projectService] - Use the nearest tsconfig.json instead of tsconfigPath. Default: `false`.
 * @property {string} [tsconfigPath] - Path to tsconfig.json. Default: `'./tsconfig.json'`.
 * @property {string} [tsconfigRootDir] - Root dir for tsconfig resolution. Default: `process.cwd()`.
 */

/**
 * @param {SolidLayerOptions} [options]
 */
export const solidLayer = (options = {}) => {
  const { files = DEFAULT_SOLID_FILES } = options;

  return createTypescriptLayer(
    { ...options, files },
    {
      plugins: {
        solid,
      },
      rules: {
        // recommended from solid plugin
        ...(solid.configs?.recommended?.rules ?? {}),

        'solid/reactivity': RULE_STATUSES.ERROR,
        'solid/no-destructure': RULE_STATUSES.WARN,
        'solid/components-return-once': RULE_STATUSES.ERROR,
        'solid/prefer-show': RULE_STATUSES.WARN,
        'solid/no-array-handlers': RULE_STATUSES.ERROR,
        'solid/event-handlers': RULE_STATUSES.ERROR,
        'solid/no-innerhtml': RULE_STATUSES.WARN,
        'solid/jsx-no-duplicate-props': RULE_STATUSES.ERROR,
        'solid/no-unknown-namespaces': RULE_STATUSES.ERROR,
        'solid/no-proxy-apis': RULE_STATUSES.ERROR,
        'solid/prefer-for': RULE_STATUSES.OFF,
      },
    },
  );
};

export default solidLayer();
