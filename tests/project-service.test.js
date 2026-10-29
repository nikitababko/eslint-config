import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import { clearCaches } from '@typescript-eslint/parser';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { typescriptConfig } from '../configs/typescript.js';
import { vanillaConfig } from '../configs/vanilla.js';
import { reactConfig, reactLayer } from '../configs/react.js';
import { solidConfig, solidLayer } from '../configs/solid.js';

const factories = [
  ['typescript', typescriptConfig, ['ts', 'tsx', 'mts', 'cts']],
  ['vanilla', vanillaConfig, ['ts', 'tsx', 'mts', 'cts']],
  ['react', reactConfig, ['ts', 'tsx', 'mts', 'cts']],
  ['solid', solidConfig, ['ts', 'tsx', 'mts', 'cts']],
  ['reactLayer', reactLayer, ['ts', 'tsx', 'mts', 'cts']],
  ['solidLayer', solidLayer, ['ts', 'tsx', 'mts', 'cts']],
];
const typeAwareCode = 'export const ready: boolean = true;\nPromise.resolve();\n';
const packageNames = ['first', 'second'];
let projectRoot;

beforeAll(async () => {
  projectRoot = await realpath(await mkdtemp(join(tmpdir(), 'eslint-config-project-service-')));
  await writeFile(
    join(projectRoot, 'tsconfig.json'),
    JSON.stringify({
      files: [],
      references: packageNames.map((name) => ({ path: `./packages/${name}` })),
    }),
  );
  for (const name of packageNames) {
    const packageDir = join(projectRoot, 'packages', name);
    await mkdir(join(packageDir, 'src'), { recursive: true });
    await writeFile(
      join(packageDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          strict: true,
          jsx: 'preserve',
          composite: true,
        },
        include: ['src/**/*'],
      }),
    );
    for (const extension of ['ts', 'tsx', 'mts', 'cts']) {
      await writeFile(join(packageDir, 'src', `sample-${extension}.${extension}`), typeAwareCode);
    }
  }
  await writeFile(join(projectRoot, 'tool.tsx'), typeAwareCode);
});

// Each case represents an independent parser invocation with its own service options.
beforeEach(() => clearCaches());

afterAll(async () => {
  if (projectRoot) {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

function createESLint(config) {
  return new ESLint({ cwd: projectRoot, overrideConfigFile: true, overrideConfig: config });
}

function expectTypeAwareChecks(result) {
  expect(result.fatalErrorCount, JSON.stringify(result.messages)).toBe(0);
  expect(result.messages.map((message) => message.ruleId)).toEqual(
    expect.arrayContaining([
      '@typescript-eslint/naming-convention',
      '@typescript-eslint/no-floating-promises',
    ]),
  );
}

describe.each(factories)('%s project service', (_name, createConfig, extensions) => {
  it.each([undefined, false])('retains explicit tsconfig paths when set to %s', async (value) => {
    const eslint = createESLint(
      createConfig({
        projectService: value,
        tsconfigPath: './packages/first/tsconfig.json',
        tsconfigRootDir: projectRoot,
      }),
    );
    const [result] = await eslint.lintFiles(['packages/first/src/sample-tsx.tsx']);

    expectTypeAwareChecks(result);
  });

  it.each(extensions)('finds each referenced package for .%s files', async (extension) => {
    const eslint = createESLint(
      createConfig({
        projectService: true,
        tsconfigPath: './missing-tsconfig.json',
        tsconfigRootDir: projectRoot,
      }),
    );
    const results = await eslint.lintFiles(
      packageNames.map((name) => `packages/${name}/src/sample-${extension}.${extension}`),
    );

    expect(results).toHaveLength(2);
    results.forEach(expectTypeAwareChecks);
  });

  it('passes object options through for a file outside the projects', async () => {
    const eslint = createESLint(
      createConfig({
        projectService: {
          allowDefaultProject: ['tool.tsx'],
          defaultProject: './packages/first/tsconfig.json',
        },
        tsconfigRootDir: projectRoot,
      }),
    );
    const [result] = await eslint.lintFiles(['tool.tsx']);

    expectTypeAwareChecks(result);
  });

  it('disables project services when type-aware linting is disabled', async () => {
    const eslint = createESLint(
      createConfig({
        isTypeAware: false,
        projectService: { allowDefaultProject: ['**/*.tsx'] },
        tsconfigPath: './missing-tsconfig.json',
        tsconfigRootDir: projectRoot,
      }),
    );
    const [result] = await eslint.lintText(typeAwareCode, { filePath: 'scripts/outside.tsx' });

    expect(result.messages).toEqual([]);
  });

  it.each([true, false])('can override an earlier layer with projectService: %s', async (value) => {
    const options = {
      tsconfigPath: './packages/first/tsconfig.json',
      tsconfigRootDir: projectRoot,
    };
    const eslint = createESLint([
      ...createConfig({ ...options, projectService: !value }),
      ...createConfig({ ...options, projectService: value }),
    ]);
    const [result] = await eslint.lintFiles(['packages/first/src/sample-tsx.tsx']);

    expectTypeAwareChecks(result);
  });
});
