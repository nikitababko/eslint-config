import tsPlugin from '@typescript-eslint/eslint-plugin';

import { RULE_STATUSES } from './constants.js';
import { DEFAULT_TS_FILES } from './typescript.js';
import { disableTypeCheckingConfig } from './typescript-type-checking.js';

export const strictRules = {
  '@typescript-eslint/no-explicit-any': RULE_STATUSES.ERROR,
  '@typescript-eslint/no-floating-promises': RULE_STATUSES.ERROR,
  '@typescript-eslint/no-unsafe-argument': RULE_STATUSES.ERROR,
  '@typescript-eslint/no-unsafe-assignment': RULE_STATUSES.ERROR,
  '@typescript-eslint/no-unsafe-call': RULE_STATUSES.ERROR,
  '@typescript-eslint/no-unsafe-member-access': RULE_STATUSES.ERROR,
  '@typescript-eslint/no-unsafe-return': RULE_STATUSES.ERROR,
  '@typescript-eslint/switch-exhaustiveness-check': [
    RULE_STATUSES.ERROR,
    { considerDefaultExhaustiveForUnions: false },
  ],
};

export const DEFAULT_STRICT_FILES = [...DEFAULT_TS_FILES];

/**
 * @typedef {Object} StrictConfigOptions
 * @property {string[]} [files] - File patterns to lint. Default: TypeScript files, including `.mts` and `.cts`.
 * @property {boolean} [isTypeAware] - Enable type-aware checks and retain inherited parser services. Default: `true`.
 */

/**
 * Optional safety checks. Append after a TypeScript or framework preset that
 * supplies the parser and project settings. Untyped mode disables inherited
 * type-aware rules and parser services for the selected files.
 *
 * @param {StrictConfigOptions} [options]
 */
export const strictConfig = (options = {}) => {
  const { files = DEFAULT_STRICT_FILES, isTypeAware = true } = options;

  return [
    {
      files,
      plugins: { '@typescript-eslint': tsPlugin },
      rules: { ...strictRules },
    },
    ...(isTypeAware ? [] : [disableTypeCheckingConfig(files)]),
  ];
};

export default strictConfig();
