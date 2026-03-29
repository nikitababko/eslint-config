import type { Linter } from 'eslint';

import type { ReactLayerOptions } from './react-layer.js';
import type { VanillaConfigOptions } from './vanilla.js';

export { reactLayer, DEFAULT_REACT_FILES } from './react-layer.js';

export interface ReactConfigOptions extends VanillaConfigOptions, ReactLayerOptions {}

export declare function reactConfig(options?: ReactConfigOptions): Linter.Config[];

declare const react: Linter.Config[];

export default react;
