import { vanillaConfig } from './vanilla.js';
import { solidLayer } from './solid-layer.js';

/**
 * @typedef {import('./vanilla.js').VanillaConfigOptions & import('./solid-layer.js').SolidLayerOptions} SolidConfigOptions
 */

/**
 * SolidJS preset: vanilla + Solid layer.
 *
 * @param {SolidConfigOptions} [options]
 * @returns {import('eslint').Linter.Config[]}
 */
export const solidConfig = (options = {}) => {
  const { ignores, environment, globalsPreset, tsFiles, tsconfigPath, tsconfigRootDir, files } =
    options;

  return [
    ...vanillaConfig({
      ignores,
      environment,
      globalsPreset,
      tsFiles,
      tsconfigPath,
      tsconfigRootDir,
    }),
    ...solidLayer({ files, tsconfigPath, tsconfigRootDir }),
  ];
};

export default solidConfig();
