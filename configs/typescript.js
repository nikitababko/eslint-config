import * as tsParser from '@typescript-eslint/parser';
import unicorn from 'eslint-plugin-unicorn';
import stylistic from '@stylistic/eslint-plugin';
import importX from 'eslint-plugin-import-x';
import tsPlugin from '@typescript-eslint/eslint-plugin';

import { BOOLEAN_PREFIXES, CONSOLE_METHODS, RULE_STATUSES } from './constants.js';
import { typescriptCompatibilityConfig } from './typescript-compatibility.js';

export const commonTsRules = {
  // Base
  'no-console': [RULE_STATUSES.WARN, { allow: [CONSOLE_METHODS.WARN, CONSOLE_METHODS.ERROR] }],
  'no-unused-vars': RULE_STATUSES.OFF,
  'import-x/order': [
    RULE_STATUSES.ERROR,
    {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
      'newlines-between': 'always',
    },
  ],

  // TS
  '@typescript-eslint/consistent-type-imports': RULE_STATUSES.ERROR,
  '@typescript-eslint/consistent-type-definitions': [RULE_STATUSES.ERROR, 'interface'],
  '@typescript-eslint/no-unused-vars': [
    RULE_STATUSES.ERROR,
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    },
  ],
  '@typescript-eslint/no-namespace': RULE_STATUSES.OFF,
  '@typescript-eslint/no-magic-numbers': RULE_STATUSES.OFF,
  '@typescript-eslint/no-explicit-any': RULE_STATUSES.WARN,
  '@typescript-eslint/no-floating-promises': RULE_STATUSES.WARN,
  '@typescript-eslint/no-misused-promises': RULE_STATUSES.ERROR,
  '@typescript-eslint/no-require-imports': RULE_STATUSES.ERROR,
  '@typescript-eslint/naming-convention': [
    RULE_STATUSES.ERROR,
    {
      selector: 'variable',
      types: ['boolean'],
      format: ['camelCase', 'PascalCase'],
      prefix: BOOLEAN_PREFIXES,
    },
    {
      selector: 'parameter',
      types: ['boolean'],
      format: ['camelCase', 'PascalCase'],
      prefix: BOOLEAN_PREFIXES,
    },
  ],

  // Unicorn (naming consistency & readability)
  'unicorn/filename-case': [RULE_STATUSES.ERROR, { cases: { kebabCase: true } }],
  'unicorn/prevent-abbreviations': [
    RULE_STATUSES.ERROR,
    {
      allowList: {
        Props: true,
        props: true,
        Prev: true,
        prev: true,
        ref: true,
        refs: true,
        ctx: true,
      },
      ignore: [/^tsconfigRootDirs?$/u],
    },
  ],
  'unicorn/no-null': RULE_STATUSES.OFF,
  'unicorn/consistent-function-scoping': RULE_STATUSES.OFF,
};

export const DEFAULT_TS_FILES = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'];

/**
 * @typedef {Object} TypescriptConfigOptions
 * @property {string[]} [files] - File patterns to lint with this layer. Default: `['**\/*.ts', '**\/*.tsx', '**\/*.mts', '**\/*.cts']`.
 * @property {string} [tsconfigPath] - Path to tsconfig.json. Default: `'./tsconfig.json'`.
 * @property {string} [tsconfigRootDir] - Root dir for tsconfig resolution. Default: `process.cwd()`.
 */

/**
 * TypeScript layer: TS parser + type-aware rules + unicorn + import rules.
 *
 * @param {TypescriptConfigOptions} [options]
 */
export const typescriptConfig = (options = {}) => {
  const {
    files = DEFAULT_TS_FILES,
    tsconfigPath = './tsconfig.json',
    tsconfigRootDir = process.cwd(),
  } = options;

  return [
    {
      files,
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          sourceType: 'module',
          project: tsconfigPath,
          tsconfigRootDir,
          ecmaFeatures: { jsx: true },
        },
      },
      plugins: {
        '@typescript-eslint': tsPlugin,
        '@stylistic': stylistic,
        'import-x': importX,
        unicorn,
      },
      rules: {
        ...commonTsRules,
      },
    },
    typescriptCompatibilityConfig(files),
  ];
};

export default typescriptConfig();
