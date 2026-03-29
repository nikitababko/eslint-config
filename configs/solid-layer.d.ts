import type { Linter } from 'eslint';

export declare const DEFAULT_SOLID_FILES: string[];

export interface SolidLayerOptions {
  files?: string[];
  tsconfigPath?: string;
  tsconfigRootDir?: string;
}

export declare function solidLayer(options?: SolidLayerOptions): Linter.Config[];

declare const solidLayerConfig: Linter.Config[];

export default solidLayerConfig;
