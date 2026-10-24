import tsPlugin from '@typescript-eslint/eslint-plugin';

// The plugin's declarations still describe these flat configs as legacy configs.
const disableTypeChecked =
  /** @type {Pick<import('eslint').Linter.Config, 'name' | 'rules' | 'languageOptions'>} */ (
    tsPlugin.configs['flat/disable-type-checked']
  );

/**
 * Disable type-aware rules and parser services only for the selected files.
 *
 * @param {string[]} files
 */
export const disableTypeCheckingConfig = (files) => ({
  ...disableTypeChecked,
  files,
});
