import type { Linter } from 'eslint';
import type { ParserOptions } from '@typescript-eslint/parser';

export declare const commonTsRules: Record<string, Linter.RuleEntry>;
export declare const DEFAULT_TS_FILES: string[];

export interface TypescriptConfigOptions {
  files?: string[];
  isTypeAware?: boolean;
  projectService?: ParserOptions['projectService'];
  tsconfigPath?: string;
  tsconfigRootDir?: string;
}

export declare function typescriptConfig(options?: TypescriptConfigOptions): Linter.Config[];

declare const typescript: Linter.Config[];

export default typescript;
