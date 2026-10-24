import type { Linter } from 'eslint';

import type { BaseConfigOptions } from './base.js';
import type { TypescriptConfigOptions } from './typescript.js';

export interface VanillaConfigOptions extends BaseConfigOptions {
  tsFiles?: TypescriptConfigOptions['files'];
  isTypeAware?: TypescriptConfigOptions['isTypeAware'];
  projectService?: TypescriptConfigOptions['projectService'];
  tsconfigPath?: TypescriptConfigOptions['tsconfigPath'];
  tsconfigRootDir?: TypescriptConfigOptions['tsconfigRootDir'];
}

export declare function vanillaConfig(options?: VanillaConfigOptions): Linter.Config[];

declare const vanilla: Linter.Config[];

export default vanilla;
