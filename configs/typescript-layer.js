import * as tsParser from '@typescript-eslint/parser';
import unicorn from 'eslint-plugin-unicorn';
import stylistic from '@stylistic/eslint-plugin';
import importX from 'eslint-plugin-import-x';
import tsPlugin from '@typescript-eslint/eslint-plugin';

import { BOOLEAN_PREFIXES, CONSOLE_METHODS, RULE_STATUSES } from './constants.js';
import { typescriptCompatibilityConfig } from './typescript-compatibility.js';
import { disableTypeCheckingConfig } from './typescript-type-checking.js';

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
 * @typedef {Object} TypescriptLayerExtensions
 * @property {Record<string, object>} [plugins] - Plugin implementations registered as-is; their bundled configs are not consumed here.
 * @property {import('eslint').Linter.RulesRecord} [rules]
 * @property {import('eslint').Linter.Config['settings']} [settings]
 * @property {number | 'latest'} [ecmaVersion]
 */

/**
 * Build the shared TypeScript layer with optional framework additions.
 *
 * @param {import('./typescript.js').TypescriptConfigOptions} [options]
 * @param {TypescriptLayerExtensions} [extensions]
 */
export const createTypescriptLayer = (options = {}, extensions = {}) => {
  const {
    files = DEFAULT_TS_FILES,
    isTypeAware = true,
    projectService = false,
    tsconfigPath = './tsconfig.json',
    tsconfigRootDir = process.cwd(),
  } = options;
  const { ecmaVersion, plugins, rules, settings } = extensions;

  return [
    {
      files,
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          ...(ecmaVersion === undefined ? {} : { ecmaVersion }),
          sourceType: 'module',
          project: projectService ? false : tsconfigPath,
          projectService,
          tsconfigRootDir,
          ecmaFeatures: { jsx: true },
        },
      },
      plugins: {
        '@typescript-eslint': tsPlugin,
        '@stylistic': stylistic,
        'import-x': importX,
        unicorn,
        ...plugins,
      },
      ...(settings === undefined ? {} : { settings }),
      rules: {
        ...commonTsRules,
        ...rules,
      },
    },
    typescriptCompatibilityConfig(files),
    ...(isTypeAware ? [] : [disableTypeCheckingConfig(files)]),
  ];
};
