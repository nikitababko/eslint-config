import type { Linter } from 'eslint';

import type { TypescriptConfigOptions } from './typescript.js';

export declare const DEFAULT_REACT_FILES: string[];

export interface ReactLayerOptions {
  files?: string[];
  isTypeAware?: boolean;
  projectService?: TypescriptConfigOptions['projectService'];
  tsconfigPath?: string;
  tsconfigRootDir?: string;
  ecmaVersion?: number | 'latest';
}

export declare function reactLayer(options?: ReactLayerOptions): Linter.Config[];

declare const reactLayerConfig: Linter.Config[];

export default reactLayerConfig;
