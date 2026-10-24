import type { Linter } from 'eslint';

import type { TypescriptConfigOptions } from './typescript.js';

export declare const DEFAULT_SOLID_FILES: string[];

export interface SolidLayerOptions {
  files?: string[];
  isTypeAware?: boolean;
  projectService?: TypescriptConfigOptions['projectService'];
  tsconfigPath?: string;
  tsconfigRootDir?: string;
}

export declare function solidLayer(options?: SolidLayerOptions): Linter.Config[];

declare const solidLayerConfig: Linter.Config[];

export default solidLayerConfig;
