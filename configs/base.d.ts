import type { Linter } from 'eslint';

export interface BaseConfigOptions {
  ignores?: string[];
  globalsPreset?: Record<string, boolean>;
}

export declare function baseConfig(options?: BaseConfigOptions): Linter.Config[];

declare const base: Linter.Config[];

export default base;
