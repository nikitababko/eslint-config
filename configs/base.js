import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

import { DEFAULT_IGNORES, RULE_STATUSES } from './constants.js';

/**
 * @typedef {Object} BaseConfigOptions
 * @property {string[]} [ignores] - Glob patterns to ignore. Default: `DEFAULT_IGNORES`.
 * @property {Record<string, boolean>} [globalsPreset] - Global variables. Default: browser + node.
 */

/**
 * @param {BaseConfigOptions} [options]
 * @returns {import('eslint').Linter.Config[]}
 */
export const baseConfig = (options = {}) => {
  const {
    ignores = DEFAULT_IGNORES,
    globalsPreset = { ...globals.browser, ...globals.node },
  } = options;

  return [
    js.configs.recommended,
    prettier,
    { ignores },
    {
      languageOptions: {
        globals: globalsPreset,
      },
      rules: {
        'no-multi-spaces': [
          RULE_STATUSES.ERROR,
          {
            ignoreEOLComments: true,
          },
        ],
      },
    },
  ];
};

export default baseConfig();
