import { describe, expect, it } from 'vitest';

import base, { baseConfig } from '../configs/base.js';
import { DEFAULT_IGNORES } from '../configs/constants.js';
import typescript, { typescriptConfig } from '../configs/typescript.js';
import vanilla, { vanillaConfig } from '../configs/vanilla.js';
import react, {
  DEFAULT_REACT_FILES,
  reactConfig,
  reactLayer as reactLayerFromPreset,
} from '../configs/react.js';
import solid, {
  DEFAULT_SOLID_FILES,
  solidConfig,
  solidLayer as solidLayerFromPreset,
} from '../configs/solid.js';
import {
  DEFAULT_REACT_FILES as DEFAULT_REACT_LAYER_FILES,
  reactLayer,
} from '../configs/react-layer.js';
import {
  DEFAULT_SOLID_FILES as DEFAULT_SOLID_LAYER_FILES,
  solidLayer,
} from '../configs/solid-layer.js';

const CONFIGS = [
  ['base', base],
  ['typescript', typescript],
  ['vanilla', vanilla],
  ['react', react],
  ['solid', solid],
  ['reactLayer()', reactLayer()],
  ['solidLayer()', solidLayer()],
];

describe('Smoke: all configs load and have valid shape', () => {
  it.each(CONFIGS)('%s is a non-empty array', (_name, config) => {
    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });

  it.each(CONFIGS)('%s contains only plain objects', (_name, config) => {
    for (const entry of config) {
      expect(typeof entry).toBe('object');
      expect(entry).not.toBeNull();
      expect(Array.isArray(entry)).toBe(false);
    }
  });
});

describe('Smoke: factory functions accept options', () => {
  it('baseConfig({ environment }) returns array', () => {
    const result = baseConfig({ environment: 'node' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(base.length);
  });

  it('baseConfig() ignores nested build outputs by default', () => {
    expect(DEFAULT_IGNORES).toEqual(
      expect.arrayContaining(['**/node_modules', '**/dist', '**/build', '**/.output', '**/.cache']),
    );
  });

  it('typescriptConfig() returns array', () => {
    expect(Array.isArray(typescriptConfig())).toBe(true);
  });

  it('typescriptConfig({ files }) passes files to first config', () => {
    const result = typescriptConfig({ files: ['**/*.ts'] });
    expect(result[0].files).toContain('**/*.ts');
  });

  it('typescriptConfig({ files }) does not add a hidden js-only entry', () => {
    const result = typescriptConfig({ files: ['src/**/*.ts'] });

    expect(
      result.some((entry) => Array.isArray(entry.files) && entry.files.includes('**/*.js')),
    ).toBe(false);
  });

  it('vanillaConfig() returns array', () => {
    expect(Array.isArray(vanillaConfig())).toBe(true);
  });

  it('vanillaConfig() returns same length as vanilla default', () => {
    expect(vanillaConfig().length).toBe(vanilla.length);
  });

  it('vanillaConfig({ tsFiles }) passes files to typescript layer', () => {
    const result = vanillaConfig({ tsFiles: ['**/*.ts'] });
    const tsEntry = result.find((c) => Array.isArray(c.files) && c.files.includes('**/*.ts'));
    expect(tsEntry).toBeDefined();
  });

  it('vanillaConfig({ tsconfigPath }) passes tsconfigPath to typescript layer', () => {
    const result = vanillaConfig({ tsconfigPath: './custom/tsconfig.json' });
    const tsEntry = result.find(
      (c) => c.languageOptions?.parserOptions?.project === './custom/tsconfig.json',
    );
    expect(tsEntry).toBeDefined();
  });

  it('reactConfig({ tsconfigPath }) passes tsconfigPath to both vanilla and react layers', () => {
    const result = reactConfig({ tsconfigPath: './tsconfig.app.json' });
    const entries = result.filter(
      (c) => c.languageOptions?.parserOptions?.project === './tsconfig.app.json',
    );
    expect(entries.length).toBeGreaterThanOrEqual(2);
  });

  it('solidConfig({ tsconfigPath }) passes tsconfigPath to both vanilla and solid layers', () => {
    const result = solidConfig({ tsconfigPath: './tsconfig.app.json' });
    const entries = result.filter(
      (c) => c.languageOptions?.parserOptions?.project === './tsconfig.app.json',
    );
    expect(entries.length).toBeGreaterThanOrEqual(2);
  });

  it('reactConfig() returns array longer than vanilla', () => {
    const result = reactConfig();
    expect(result.length).toBeGreaterThan(vanilla.length);
  });

  it('solidConfig() returns array longer than vanilla', () => {
    const result = solidConfig();
    expect(result.length).toBeGreaterThan(vanilla.length);
  });

  it('reactLayer({ files }) passes files to config', () => {
    const result = reactLayer({ files: ['**/*.tsx'] });
    expect(result[0].files).toContain('**/*.tsx');
  });

  it('solidLayer({ files }) passes files to config', () => {
    const result = solidLayer({ files: ['**/*.tsx'] });
    expect(result[0].files).toContain('**/*.tsx');
  });

  it('reactLayer() defaults to all TypeScript extensions', () => {
    expect(DEFAULT_REACT_FILES).toEqual(['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts']);
  });

  it('solidLayer() defaults to TSX files only', () => {
    expect(DEFAULT_SOLID_FILES).toEqual(['**/*.tsx']);
  });
});

describe('Smoke: configs contain expected plugins', () => {
  it('typescript config registers @typescript-eslint plugin', () => {
    const tsEntry = typescript.find((c) => c.plugins?.['@typescript-eslint']);
    expect(tsEntry).toBeDefined();
  });

  it('typescript config registers @stylistic plugin', () => {
    const entry = typescript.find((c) => c.plugins?.['@stylistic']);
    expect(entry).toBeDefined();
  });

  it('typescript config registers unicorn plugin', () => {
    const entry = typescript.find((c) => c.plugins?.unicorn);
    expect(entry).toBeDefined();
  });

  it('react config registers react plugin', () => {
    const entry = react.find((c) => c.plugins?.react);
    expect(entry).toBeDefined();
  });

  it('react config registers react-hooks plugin', () => {
    const entry = react.find((c) => c.plugins?.['react-hooks']);
    expect(entry).toBeDefined();
  });

  it('solid config registers solid plugin', () => {
    const entry = solid.find((c) => c.plugins?.solid);
    expect(entry).toBeDefined();
  });
});

describe('Smoke: preset entrypoints re-export layer helpers', () => {
  it('react preset re-exports reactLayer', () => {
    expect(reactLayerFromPreset).toBe(reactLayer);
  });

  it('react preset re-exports DEFAULT_REACT_FILES', () => {
    expect(DEFAULT_REACT_FILES).toEqual(DEFAULT_REACT_LAYER_FILES);
  });

  it('solid preset re-exports solidLayer', () => {
    expect(solidLayerFromPreset).toBe(solidLayer);
  });

  it('solid preset re-exports DEFAULT_SOLID_FILES', () => {
    expect(DEFAULT_SOLID_FILES).toEqual(DEFAULT_SOLID_LAYER_FILES);
  });
});

describe('Smoke: layers are self-contained and minimal', () => {
  // Each layer contains its own rules and the scoped TypeScript compatibility entry.
  it('reactLayer() returns exactly 2 config entries', () => {
    expect(reactLayer().length).toBe(2);
  });

  it('solidLayer() returns exactly 2 config entries', () => {
    expect(solidLayer().length).toBe(2);
  });

  it('solidConfig has more entries than solidLayer alone', () => {
    // vanilla (base + ts) is prepended, so total must exceed solidLayer length
    expect(solid.length).toBeGreaterThan(solidLayer().length);
  });

  it('reactConfig has more entries than reactLayer alone', () => {
    expect(react.length).toBeGreaterThan(reactLayer().length);
  });
});
