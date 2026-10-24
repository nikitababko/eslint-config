import { vanillaConfig } from './vanilla.js';
import { reactLayer } from './react-layer.js';

export { reactLayer, DEFAULT_REACT_FILES } from './react-layer.js';

/**
 * @typedef {import('./vanilla.js').VanillaConfigOptions & import('./react-layer.js').ReactLayerOptions} ReactConfigOptions
 */

/**
 * React preset: vanilla + React layer.
 *
 * @param {ReactConfigOptions} [options]
 */
export const reactConfig = (options = {}) => {
  const {
    ignores,
    environment,
    globalsPreset,
    tsFiles,
    isTypeAware,
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
      isTypeAware,
      tsconfigPath,
      tsconfigRootDir,
    }),
    ...reactLayer({ files, isTypeAware, tsconfigPath, tsconfigRootDir, ecmaVersion }),
  ];
};

export default reactConfig();
