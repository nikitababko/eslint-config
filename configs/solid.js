import { vanillaConfig } from './vanilla.js';
import { solidLayer } from './solid-layer.js';

export { solidLayer, DEFAULT_SOLID_FILES } from './solid-layer.js';

/**
 * @typedef {import('./vanilla.js').VanillaConfigOptions & import('./solid-layer.js').SolidLayerOptions} SolidConfigOptions
 */

/**
 * SolidJS preset: vanilla + Solid layer.
 *
 * @param {SolidConfigOptions} [options]
 */
export const solidConfig = (options = {}) => {
  const {
    ignores,
    environment,
    globalsPreset,
    tsFiles,
    isTypeAware,
    tsconfigPath,
    tsconfigRootDir,
    files,
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
    ...solidLayer({ files, isTypeAware, tsconfigPath, tsconfigRootDir }),
  ];
};

export default solidConfig();
