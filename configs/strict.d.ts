import type { Linter } from 'eslint';

export declare const strictRules: Record<string, Linter.RuleEntry>;
export declare const DEFAULT_STRICT_FILES: string[];

export interface StrictConfigOptions {
  files?: string[];
  isTypeAware?: boolean;
}

export declare function strictConfig(options?: StrictConfigOptions): Linter.Config[];

declare const strict: Linter.Config[];

export default strict;
