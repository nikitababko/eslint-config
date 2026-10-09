import type { Linter } from 'eslint';

export declare const stylisticRules: Record<string, Linter.RuleEntry>;
export declare const DEFAULT_STYLISTIC_FILES: string[];

export interface StylisticConfigOptions {
  files?: string[];
}

export declare function stylisticConfig(options?: StylisticConfigOptions): Linter.Config[];

declare const stylistic: Linter.Config[];

export default stylistic;
