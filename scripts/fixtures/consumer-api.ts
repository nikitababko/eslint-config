import { ESLint, type Linter } from 'eslint';
import config from '@nikitababko/eslint-config';
import base, {
  baseConfig,
  type BaseEnvironment,
  type BaseConfigOptions,
} from '@nikitababko/eslint-config/base';
import typescript, {
  typescriptConfig,
  commonTsRules,
  DEFAULT_TS_FILES,
  type TypescriptConfigOptions,
} from '@nikitababko/eslint-config/typescript';
import stylistic, {
  stylisticConfig,
  stylisticRules,
  DEFAULT_STYLISTIC_FILES,
  type StylisticConfigOptions,
} from '@nikitababko/eslint-config/stylistic';
import vanilla, {
  vanillaConfig,
  type VanillaConfigOptions,
} from '@nikitababko/eslint-config/vanilla';
import react, {
  reactConfig,
  reactLayer,
  DEFAULT_REACT_FILES,
  type ReactConfigOptions,
} from '@nikitababko/eslint-config/react';
import solid, {
  solidConfig,
  solidLayer,
  DEFAULT_SOLID_FILES,
  type SolidConfigOptions,
} from '@nikitababko/eslint-config/solid';

const environment: BaseEnvironment = 'node';
const baseOptions: BaseConfigOptions = { environment, ignores: ['dist/**'] };
const typescriptOptions: TypescriptConfigOptions = {
  files: DEFAULT_TS_FILES,
  tsconfigPath: './tsconfig.json',
  tsconfigRootDir: '.',
};
const stylisticOptions: StylisticConfigOptions = { files: DEFAULT_STYLISTIC_FILES };
const vanillaOptions: VanillaConfigOptions = {
  ...baseOptions,
  tsFiles: typescriptOptions.files,
  tsconfigPath: typescriptOptions.tsconfigPath,
  tsconfigRootDir: typescriptOptions.tsconfigRootDir,
};
const reactOptions: ReactConfigOptions = {
  ...vanillaOptions,
  files: DEFAULT_REACT_FILES,
  ecmaVersion: 'latest',
};
const solidOptions: SolidConfigOptions = {
  ...vanillaOptions,
  files: DEFAULT_SOLID_FILES,
};

const presets: Linter.Config[][] = [
  config,
  base,
  baseConfig(baseOptions),
  typescript,
  typescriptConfig(typescriptOptions),
  typescriptConfig({ isTypeAware: false }),
  stylistic,
  stylisticConfig(stylisticOptions),
  vanilla,
  vanillaConfig(vanillaOptions),
  vanillaConfig({ isTypeAware: false }),
  react,
  reactConfig(reactOptions),
  reactConfig({ isTypeAware: false }),
  reactLayer(reactOptions),
  reactLayer({ isTypeAware: false }),
  solid,
  solidConfig(solidOptions),
  solidConfig({ isTypeAware: false }),
  solidLayer(solidOptions),
  solidLayer({ isTypeAware: false }),
];
const rules: Record<string, Linter.RuleEntry>[] = [commonTsRules, stylisticRules];

for (const files of [
  DEFAULT_TS_FILES,
  DEFAULT_STYLISTIC_FILES,
  DEFAULT_REACT_FILES,
  DEFAULT_SOLID_FILES,
]) {
  if (!Array.isArray(files)) {
    throw new Error('Public file patterns must be arrays');
  }
}
for (const preset of presets) {
  if (!Array.isArray(preset) || preset.length === 0) {
    throw new Error('Public presets and factories must return non-empty config arrays');
  }
  new ESLint({ overrideConfigFile: true, overrideConfig: preset });
}
for (const ruleSet of rules) {
  if (Object.keys(ruleSet).length === 0) {
    throw new Error('Public rule sets must contain rules');
  }
}

console.log('Passed packed public API types and runtime exports');
