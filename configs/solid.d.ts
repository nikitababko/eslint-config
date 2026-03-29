import type { Linter } from 'eslint';

import type { SolidLayerOptions } from './solid-layer.js';
import type { VanillaConfigOptions } from './vanilla.js';

export interface SolidConfigOptions extends VanillaConfigOptions, SolidLayerOptions {}

export declare function solidConfig(options?: SolidConfigOptions): Linter.Config[];

declare const solid: Linter.Config[];

export default solid;
