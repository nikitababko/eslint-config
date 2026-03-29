import type { Linter } from 'eslint';

export type BaseEnvironment = 'neutral' | 'browser' | 'node' | 'universal';

export interface BaseConfigOptions {
  ignores?: string[];
  environment?: BaseEnvironment;
  globalsPreset?: Record<string, boolean>;
}

export declare function baseConfig(options?: BaseConfigOptions): Linter.Config[];

declare const base: Linter.Config[];

export default base;
