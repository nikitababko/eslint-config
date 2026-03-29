import { vanillaConfig } from './vanilla.js';
import { reactLayer } from './react-layer.js';

/**
 * @typedef {import('./vanilla.js').VanillaConfigOptions & import('./react-layer.js').ReactLayerOptions} ReactConfigOptions
 */

/**
 * React preset: vanilla + React layer.
 *
 * @param {ReactConfigOptions} [options]
 * @returns {import('eslint').Linter.Config[]}
 */
export const reactConfig = (options = {}) => {
  const {
    ignores,
    environment,
    globalsPreset,
    tsFiles,
    tsconfigPath,
    tsconfigRootDir,
    files,
    ecmaVersion,
  } = options;

  return [
    ...vanillaConfig({
      ignores,
      environment,
      globalsPreset,
      tsFiles,
      tsconfigPath,
      tsconfigRootDir,
    }),
    ...reactLayer({ files, tsconfigPath, tsconfigRootDir, ecmaVersion }),
  ];
};

export default reactConfig();
