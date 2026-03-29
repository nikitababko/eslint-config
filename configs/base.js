import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

import { DEFAULT_IGNORES, RULE_STATUSES } from './constants.js';

const BASE_ENVIRONMENTS = {
  NEUTRAL: 'neutral',
  BROWSER: 'browser',
  NODE: 'node',
  UNIVERSAL: 'universal',
};

const ENVIRONMENT_GLOBALS = {
  [BASE_ENVIRONMENTS.NEUTRAL]: {},
  [BASE_ENVIRONMENTS.BROWSER]: globals.browser,
  [BASE_ENVIRONMENTS.NODE]: globals.node,
  [BASE_ENVIRONMENTS.UNIVERSAL]: { ...globals.browser, ...globals.node },
};

/**
 * @typedef {'neutral' | 'browser' | 'node' | 'universal'} BaseEnvironment
 */

/**
 * @typedef {Object} BaseConfigOptions
 * @property {string[]} [ignores] - Glob patterns to ignore. Default: `DEFAULT_IGNORES`.
 * @property {BaseEnvironment} [environment] - Runtime environment. Default: `'neutral'`.
 * @property {Record<string, boolean>} [globalsPreset] - Global variables. Overrides `environment`.
 */

/**
 * @param {BaseConfigOptions} [options]
 */
export const baseConfig = (options = {}) => {
  const {
    ignores = DEFAULT_IGNORES,
    environment = BASE_ENVIRONMENTS.NEUTRAL,
    globalsPreset,
  } = options;
  const resolvedGlobalsPreset =
    globalsPreset ??
    ENVIRONMENT_GLOBALS[environment] ??
    ENVIRONMENT_GLOBALS[BASE_ENVIRONMENTS.NEUTRAL];

  return [
    js.configs.recommended,
    prettier,
    { ignores },
    {
      languageOptions: {
        globals: resolvedGlobalsPreset,
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
