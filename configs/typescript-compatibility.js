import tsPlugin from '@typescript-eslint/eslint-plugin';

/** @typedef {import('eslint').Linter.RulesRecord} RulesRecord */

// The plugin's declarations still describe these flat configs as legacy configs.
const eslintRecommended = /** @type {{ files: string[], rules: RulesRecord, name: string }} */ (
  tsPlugin.configs['flat/eslint-recommended']
);

/**
 * Scope compiler-backed compatibility rules to TypeScript files within the layer.
 *
 * @param {string[]} files
 */
export const typescriptCompatibilityConfig = (files) => ({
  ...eslintRecommended,
  files: files.flatMap((pattern) =>
    eslintRecommended.files.map((typescriptPattern) => [pattern, typescriptPattern]),
  ),
});
