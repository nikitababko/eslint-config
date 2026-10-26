import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

import { createTypescriptLayer, DEFAULT_TS_FILES } from './typescript-layer.js';
import { RULE_STATUSES } from './constants.js';

export const DEFAULT_REACT_FILES = [...DEFAULT_TS_FILES];

/**
 * @typedef {Object} ReactLayerOptions
 * @property {string[]} [files] - File patterns to lint. Default: `['**\/*.ts', '**\/*.tsx', '**\/*.mts', '**\/*.cts']`.
 * @property {boolean} [isTypeAware] - Enable type-aware linting. Default: `true`.
 * @property {import('@typescript-eslint/parser').ParserOptions['projectService']} [projectService] - Use the nearest tsconfig.json instead of tsconfigPath. Default: `false`.
 * @property {string} [tsconfigPath] - Path to tsconfig.json. Default: `'./tsconfig.json'`.
 * @property {string} [tsconfigRootDir] - Root dir for tsconfig resolution. Default: `process.cwd()`.
 * @property {number | 'latest'} [ecmaVersion] - ECMAScript version. Default: `'latest'`.
 */

/**
 * @param {ReactLayerOptions} [options]
 */
export const reactLayer = (options = {}) => {
  const { files = DEFAULT_REACT_FILES, ecmaVersion = 'latest' } = options;

  return createTypescriptLayer(
    { ...options, files },
    {
      ecmaVersion,
      settings: {
        react: {
          version: 'detect',
        },
      },
      plugins: {
        // React ecosystem
        react,
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
      },
      rules: {
        // React Hooks recommended (flat-compatible)
        ...(reactHooks.configs?.flat?.recommended?.rules ??
          reactHooks.configs?.recommended?.rules ??
          {}),

        // React core rules (your original picks)
        'react/jsx-no-useless-fragment': [RULE_STATUSES.ERROR, { allowExpressions: true }],
        'react/react-in-jsx-scope': RULE_STATUSES.OFF,
        'react/no-multi-comp': [RULE_STATUSES.ERROR],
        'react/self-closing-comp': RULE_STATUSES.ERROR,
        'react/no-array-index-key': RULE_STATUSES.ERROR,
        'react/jsx-boolean-value': RULE_STATUSES.ERROR,
        'react/display-name': RULE_STATUSES.OFF,
        'react/jsx-curly-brace-presence': RULE_STATUSES.ERROR,
        'react/jsx-key': [RULE_STATUSES.ERROR],

        // Vite React Refresh rule
        'react-refresh/only-export-components': [RULE_STATUSES.WARN, { allowConstantExport: true }],
      },
    },
  );
};

export default reactLayer();
