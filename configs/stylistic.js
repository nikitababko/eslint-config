import stylistic from '@stylistic/eslint-plugin';

import { MAX_STRING_LENGTH, OPTIONS, RULE_STATUSES } from './constants.js';

export const stylisticRules = {
  'no-multiple-empty-lines': [RULE_STATUSES.ERROR, { max: 1, maxEOF: 0, maxBOF: 0 }],
  '@stylistic/arrow-parens': [RULE_STATUSES.ERROR, OPTIONS.ALWAYS],
  '@stylistic/brace-style': [RULE_STATUSES.ERROR, '1tbs'],
  '@stylistic/block-spacing': [RULE_STATUSES.ERROR, OPTIONS.ALWAYS],
  '@stylistic/max-len': [
    RULE_STATUSES.ERROR,
    {
      code: MAX_STRING_LENGTH,
      ignoreComments: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
    },
  ],
  '@stylistic/object-curly-spacing': [RULE_STATUSES.ERROR, OPTIONS.ALWAYS],
  '@stylistic/semi': [RULE_STATUSES.ERROR, OPTIONS.ALWAYS],
  '@stylistic/quotes': [RULE_STATUSES.ERROR, 'single', { avoidEscape: true }],
  '@stylistic/comma-dangle': [RULE_STATUSES.ERROR, 'always-multiline'],
  '@stylistic/indent': [RULE_STATUSES.ERROR, 2],
};

export const DEFAULT_STYLISTIC_FILES = ['**/*.{js,jsx,mjs,cjs,ts,tsx}'];

/**
 * @typedef {Object} StylisticConfigOptions
 * @property {string[]} [files] - File patterns to lint. Default: JavaScript and TypeScript files.
 */

/**
 * Optional formatting rules. Append after the language or framework preset.
 *
 * @param {StylisticConfigOptions} [options]
 */
export const stylisticConfig = (options = {}) => {
  const { files = DEFAULT_STYLISTIC_FILES } = options;

  return [
    {
      files,
      plugins: { '@stylistic': stylistic },
      rules: { ...stylisticRules },
    },
  ];
};

export default stylisticConfig();
