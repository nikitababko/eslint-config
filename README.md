# @nikitababko/eslint-config

[![npm version](https://img.shields.io/npm/v/@nikitababko/eslint-config?style=flat-square)](https://www.npmjs.com/package/@nikitababko/eslint-config)
[![npm downloads](https://img.shields.io/npm/dm/@nikitababko/eslint-config?style=flat-square)](https://www.npmjs.com/package/@nikitababko/eslint-config)
[![license](https://img.shields.io/npm/l/@nikitababko/eslint-config?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/node/v/@nikitababko/eslint-config?style=flat-square)](https://nodejs.org)
[![ESLint](https://img.shields.io/badge/ESLint-9.38%2B%20%28%3C10%29-4B32C3?style=flat-square&logo=eslint)](https://eslint.org)

Shareable **ESLint Flat Config** presets for modern TypeScript projects — with support for vanilla TS, React, and SolidJS.

Built on top of:
[`@typescript-eslint`](https://typescript-eslint.io) ·
[`@stylistic`](https://eslint.style) ·
[`eslint-plugin-unicorn`](https://github.com/sindresorhus/eslint-plugin-unicorn) ·
[`eslint-plugin-import-x`](https://github.com/un-ts/eslint-plugin-import-x) ·
[`eslint-config-prettier`](https://github.com/prettier/eslint-config-prettier)

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Presets](#presets)
  - [Vanilla (recommended default)](#vanilla)
  - [React](#react)
  - [SolidJS](#solidjs)
  - [Base (JS only)](#base)
  - [TypeScript layer](#typescript-layer)
  - [Stylistic layer (optional)](#stylistic-layer)
- [Configuration Options](#configuration-options)
- [Key Rules](#key-rules)
- [Overriding Rules](#overriding-rules)
- [Monorepo Setup](#monorepo-setup)
- [Available Exports](#available-exports)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **ESLint v9 Flat Config** — no legacy `.eslintrc` format
- **Prettier-compatible** — default presets leave formatting to Prettier;
  stricter formatting checks are available in an optional stylistic layer
- **Type-aware linting** — powered by `@typescript-eslint` with full project-aware rules
- **Opinionated but escapable** — sensible defaults, easy to override per rule
- **Modular layered architecture** — compose presets from smaller building blocks
- **Monorepo-ready** — custom `tsconfigPath` and `tsconfigRootDir` per layer
- **Zero runtime dependencies** — all dependencies are `peerDependencies`

---

## Requirements

| Dependency | Version                                |
| ---------- | -------------------------------------- |
| Node.js    | `^20.19.0 \|\| ^22.13.0 \|\| >=24.0.0` |
| ESLint     | `^9.38.0`                              |

These requirements include the plugins and their transitive dependencies.
Unicorn 63 requires ESLint 9.38.0+, and fresh installs can resolve
`eslint-visitor-keys` 5 through typescript-eslint, which requires Node.js
`^20.19.0 || ^22.13.0 || >=24`.

---

## Installation

Install the package and the shared peer dependencies used by the default presets
(`@nikitababko/eslint-config`, `vanilla`, `typescript`, `react`, `solid`):

```bash
# npm
npm install -D @nikitababko/eslint-config eslint@^9.38.0 @eslint/js@^9.38.0 @typescript-eslint/eslint-plugin @typescript-eslint/parser @stylistic/eslint-plugin eslint-config-prettier eslint-plugin-unicorn eslint-plugin-import-x globals

# pnpm
pnpm add -D @nikitababko/eslint-config eslint@^9.38.0 @eslint/js@^9.38.0 @typescript-eslint/eslint-plugin @typescript-eslint/parser @stylistic/eslint-plugin eslint-config-prettier eslint-plugin-unicorn eslint-plugin-import-x globals

# yarn
yarn add -D @nikitababko/eslint-config eslint@^9.38.0 @eslint/js@^9.38.0 @typescript-eslint/eslint-plugin @typescript-eslint/parser @stylistic/eslint-plugin eslint-config-prettier eslint-plugin-unicorn eslint-plugin-import-x globals
```

For **React** projects, also install:

```bash
# npm
npm install -D eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh

# pnpm
pnpm add -D eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh

# yarn
yarn add -D eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh
```

For **SolidJS** projects:

```bash
# npm
npm install -D eslint-plugin-solid

# pnpm
pnpm add -D eslint-plugin-solid

# yarn
yarn add -D eslint-plugin-solid
```

> Only the framework-specific packages are optional peer dependencies — install
> the React or Solid plugins only when you use those presets.

---

## Quick Start

**1.** Install the package (see above).

**2.** Create `eslint.config.js` in your project root:

```js
import config from '@nikitababko/eslint-config';

export default config;
```

**3.** Run ESLint:

```bash
npx eslint .
```

---

## Presets

### Vanilla

**Default preset** — TypeScript + unicorn + import rules. Best for framework-agnostic TypeScript projects.

```js
// eslint.config.js
import vanilla from '@nikitababko/eslint-config/vanilla';
// or: import vanilla from '@nikitababko/eslint-config';

export default vanilla;
```

**With custom options:**

```js
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { vanillaConfig } from '@nikitababko/eslint-config/vanilla';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default vanillaConfig({
  tsconfigPath: './tsconfig.json',
  tsconfigRootDir: __dirname,
  ignores: ['dist', 'node_modules', 'coverage'],
});
```

---

### React

**Vanilla + React** — all vanilla rules plus React, React Hooks, and React Refresh rules for `.tsx` files by default.

```js
// eslint.config.js
import react from '@nikitababko/eslint-config/react';

export default react;
```

**With custom options:**

```js
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { reactConfig } from '@nikitababko/eslint-config/react';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default reactConfig({
  tsconfigPath: './tsconfig.app.json',
  tsconfigRootDir: __dirname,
});
```

**React layer only** (if you already have a base config):

```js
import vanilla from '@nikitababko/eslint-config/vanilla';
import { reactLayer } from '@nikitababko/eslint-config/react';

export default [
  ...vanilla,
  ...reactLayer({
    tsconfigPath: './tsconfig.app.json',
  }),
];
```

To lint `*.jsx` too, opt in explicitly and make sure those files are included by
your TypeScript config via `allowJs: true` or a dedicated `tsconfig.eslint.json`:

```js
import vanilla from '@nikitababko/eslint-config/vanilla';
import { reactLayer } from '@nikitababko/eslint-config/react';

export default [
  ...vanilla,
  ...reactLayer({
    files: ['**/*.tsx', '**/*.jsx'],
    tsconfigPath: './tsconfig.eslint.json',
  }),
];
```

---

### SolidJS

**Vanilla + SolidJS** — all vanilla rules plus SolidJS-specific reactivity and JSX rules for `.tsx` files by default.

```js
// eslint.config.js
import solid from '@nikitababko/eslint-config/solid';

export default solid;
```

**With custom options:**

```js
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { solidConfig } from '@nikitababko/eslint-config/solid';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default solidConfig({
  tsconfigPath: './tsconfig.app.json',
  tsconfigRootDir: __dirname,
});
```

**Solid layer only:**

```js
import vanilla from '@nikitababko/eslint-config/vanilla';
import { solidLayer } from '@nikitababko/eslint-config/solid';

export default [
  ...vanilla,
  ...solidLayer({
    tsconfigPath: './tsconfig.app.json',
  }),
];
```

To lint `*.jsx` too, opt in explicitly and make sure those files are included by
your TypeScript config via `allowJs: true` or a dedicated `tsconfig.eslint.json`:

```js
import vanilla from '@nikitababko/eslint-config/vanilla';
import { solidLayer } from '@nikitababko/eslint-config/solid';

export default [
  ...vanilla,
  ...solidLayer({
    files: ['**/*.tsx', '**/*.jsx'],
    tsconfigPath: './tsconfig.eslint.json',
  }),
];
```

---

### Base

Minimal config — `@eslint/js` recommended rules + `eslint-config-prettier`
compatibility layer. Neutral by default, so pick an environment explicitly for
browser or Node projects. No TypeScript parser and no curated stylistic rules.

```js
import { baseConfig } from '@nikitababko/eslint-config/base';

export default baseConfig({
  environment: 'browser',
});
```

---

### TypeScript layer

TypeScript parser + type-aware rules + import ordering + unicorn.
Intended to be composed on top of `base`.

Includes typescript-eslint's [`eslint-recommended` compatibility rules](https://typescript-eslint.io/users/configs/#eslint-recommended)
for TypeScript files selected by the layer. Checks such as `no-undef`,
`no-redeclare`, and `no-dupe-class-members` are delegated to the TypeScript
compiler, allowing function overloads, declaration merging, and ambient types.
Run `tsc --noEmit` alongside ESLint to catch compiler errors.

```js
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import base from '@nikitababko/eslint-config/base';
import { typescriptConfig } from '@nikitababko/eslint-config/typescript';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  ...base,
  ...typescriptConfig({
    tsconfigPath: './tsconfig.json',
    tsconfigRootDir: __dirname,
  }),
];
```

---

### Stylistic layer

Optional formatting checks for projects that want ESLint to enforce the package's
chosen style. Append this layer **after** your language or framework preset:

```js
import vanilla from '@nikitababko/eslint-config/vanilla';
import stylistic from '@nikitababko/eslint-config/stylistic';

export default [...vanilla, ...stylistic];
```

To limit checks to specific files, use `stylisticConfig({ files: ['src/**/*.ts'] })`.
The layer supplies formatting rules and the Stylistic plugin; the preceding preset
supplies the parser and language rules.

Default presets no longer enable these formatting rules, including
`no-multiple-empty-lines`, and `commonTsRules` contains only the shared language
and code-quality rules. To keep formatting checks from earlier versions, append
this layer. React's `react/jsx-newline` is no longer enabled; Prettier controls JSX
line breaks.

If you use Prettier, keep this optional layer disabled to allow any Prettier options
and avoid duplicate formatting checks. This follows
[eslint-config-prettier's guidance](https://github.com/prettier/eslint-config-prettier#installation).

---

## Configuration Options

All factory functions accept an options object. All options are optional.

### `baseConfig(options)`

| Option          | Type                                              | Default                       | Description                          |
| --------------- | ------------------------------------------------- | ----------------------------- | ------------------------------------ |
| `ignores`       | `string[]`                                        | `['node_modules', 'dist', …]` | Glob patterns to ignore globally     |
| `environment`   | `'neutral' \| 'browser' \| 'node' \| 'universal'` | `'neutral'`                   | Runtime globals preset               |
| `globalsPreset` | `Record<string, boolean>`                         | from `environment`            | Custom globals overriding the preset |

### `typescriptConfig(options)`

| Option            | Type       | Default                   | Description                           |
| ----------------- | ---------- | ------------------------- | ------------------------------------- |
| `files`           | `string[]` | `['**/*.ts', '**/*.tsx']` | File patterns to lint with this layer |
| `tsconfigPath`    | `string`   | `'./tsconfig.json'`       | Path to `tsconfig.json`               |
| `tsconfigRootDir` | `string`   | `process.cwd()`           | Root dir for tsconfig resolution      |

### `stylisticConfig(options)`

| Option  | Type       | Default                            | Description                                  |
| ------- | ---------- | ---------------------------------- | -------------------------------------------- |
| `files` | `string[]` | `['**/*.{js,jsx,mjs,cjs,ts,tsx}']` | File patterns for optional formatting checks |

### `vanillaConfig(options)`

Accepts all `baseConfig` options and all `typescriptConfig` options, with `files` renamed to `tsFiles`.

| Option            | Type                                              | Default                   | Description                             |
| ----------------- | ------------------------------------------------- | ------------------------- | --------------------------------------- |
| `ignores`         | `string[]`                                        | See `baseConfig`          | Passed to `baseConfig`                  |
| `environment`     | `'neutral' \| 'browser' \| 'node' \| 'universal'` | `'browser'`               | Passed to `baseConfig`                  |
| `globalsPreset`   | `object`                                          | See `baseConfig`          | Passed to `baseConfig`                  |
| `tsFiles`         | `string[]`                                        | `['**/*.ts', '**/*.tsx']` | Passed as `files` to `typescriptConfig` |
| `tsconfigPath`    | `string`                                          | `'./tsconfig.json'`       | Passed to `typescriptConfig`            |
| `tsconfigRootDir` | `string`                                          | `process.cwd()`           | Passed to `typescriptConfig`            |

### `reactConfig(options)` / `solidConfig(options)`

Accepts all `vanillaConfig` options plus:

| Option            | Type                 | Default                   | Description                             |
| ----------------- | -------------------- | ------------------------- | --------------------------------------- |
| `files`           | `string[]`           | `['**/*.tsx']`            | File patterns for the React/Solid layer |
| `tsconfigPath`    | `string`             | `'./tsconfig.json'`       | Passed to both vanilla and the layer    |
| `tsconfigRootDir` | `string`             | `process.cwd()`           | Passed to both vanilla and the layer    |
| `ecmaVersion`     | `number \| 'latest'` | `'latest'` _(React only)_ | ECMAScript version for the parser       |

---

## Key Rules

### TypeScript

| Rule                                             | Severity | Notes                                               |
| ------------------------------------------------ | -------- | --------------------------------------------------- |
| `@typescript-eslint/consistent-type-imports`     | error    | Enforces `import type` for type-only imports        |
| `@typescript-eslint/consistent-type-definitions` | error    | Prefers `interface` over `type` for object shapes   |
| `@typescript-eslint/no-unused-vars`              | error    | Variables prefixed with `_` are ignored             |
| `@typescript-eslint/no-explicit-any`             | warn     | Discourages `any` usage                             |
| `@typescript-eslint/no-floating-promises`        | warn     | Unhandled promises must be handled                  |
| `@typescript-eslint/no-misused-promises`         | error    | Prevents async functions in sync callback positions |
| `@typescript-eslint/naming-convention`           | error    | Boolean variables must be prefixed (see below)      |

**Boolean naming prefixes:** `is`, `has`, `can`, `should`, `will`, `did`, `was`, `were`, `allow`, `enable`, `supports`, `needs`, `requires`

```ts
// ✗ bad
const loading = true;
const open = false;

// ✓ good
const isLoading = true;
const isOpen = false;
```

### Stylistic

These rules are enabled **only** by the optional `stylistic` layer. Default
presets leave formatting to Prettier.

Settings closest to this optional layer's style:

```json
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "printWidth": 100
}
```

| Rule                              | Config                                                   |
| --------------------------------- | -------------------------------------------------------- |
| `@stylistic/indent`               | 2 spaces                                                 |
| `@stylistic/quotes`               | single quotes, double quotes allowed to avoid escaping   |
| `@stylistic/semi`                 | always                                                   |
| `@stylistic/max-len`              | 100 chars (strings, comments, template literals ignored) |
| `@stylistic/comma-dangle`         | always-multiline                                         |
| `@stylistic/arrow-parens`         | always — `(x) => x`                                      |
| `@stylistic/brace-style`          | 1tbs                                                     |
| `@stylistic/object-curly-spacing` | always — `{ a: 1 }`                                      |
| `@stylistic/block-spacing`        | always — `{ return value; }`                             |
| `no-multiple-empty-lines`         | at most one blank line, none at start/end of file        |

The optional layer can still disagree with Prettier on indentation and lines
that Prettier cannot shorten. Its quotes rule uses `avoidEscape: true`, so
`"don't"` is accepted without forcing an escaped apostrophe.

### Unicorn

| Rule                            | Config                                               |
| ------------------------------- | ---------------------------------------------------- |
| `unicorn/filename-case`         | kebab-case only                                      |
| `unicorn/prevent-abbreviations` | error (exceptions: `Props`, `props`, `Prev`, `prev`) |

### Imports

Imports are ordered and separated by blank lines between groups:

```ts
// 1. built-in
import path from 'path';

// 2. external
import React from 'react';

// 3. internal / parent / sibling / index
import { MyComponent } from './my-component';

// 4. type imports
import type { MyType } from './types';
```

### React (`.tsx` by default)

| Rule                                   | Severity    | Notes                                       |
| -------------------------------------- | ----------- | ------------------------------------------- |
| `react/jsx-no-useless-fragment`        | error       | Fragments with a single child are forbidden |
| `react/no-multi-comp`                  | error       | One component per file                      |
| `react/self-closing-comp`              | error       | `<div />` instead of `<div></div>`          |
| `react/no-array-index-key`             | error       | Array index must not be used as `key`       |
| `react/jsx-boolean-value`              | error       | Implicit `true` — `<input disabled />`      |
| `react/jsx-curly-brace-presence`       | error       | No unnecessary curly braces in JSX          |
| `react/jsx-key`                        | error       | All list elements must have a `key` prop    |
| `react/react-in-jsx-scope`             | off         | Not needed in React 17+                     |
| `react-refresh/only-export-components` | warn        | For Vite HMR compatibility                  |
| `react-hooks/*`                        | recommended | Standard hooks rules                        |

### SolidJS (`.tsx` by default)

| Rule                           | Severity | Notes                                                  |
| ------------------------------ | -------- | ------------------------------------------------------ |
| `solid/reactivity`             | error    | Reactive values must be accessed correctly             |
| `solid/no-destructure`         | warn     | Destructuring props breaks reactivity                  |
| `solid/components-return-once` | error    | Components must have a single return                   |
| `solid/no-array-handlers`      | error    | Array handlers break fine-grained reactivity           |
| `solid/event-handlers`         | error    | Event handler naming conventions                       |
| `solid/no-proxy-apis`          | error    | Proxy APIs not compatible with Solid's reactive model  |
| `solid/no-innerhtml`           | warn     | Prefer JSX over `innerHTML`                            |
| `solid/jsx-no-duplicate-props` | error    | Duplicate JSX props are forbidden                      |
| `solid/no-unknown-namespaces`  | error    | Only known Solid JSX namespaces allowed                |
| `solid/prefer-show`            | warn     | Prefer `<Show>` over ternary for conditional rendering |

---

## Overriding Rules

Flat Config is order-based — the last matching rule wins. Add your overrides after spreading the preset:

```js
import vanilla from '@nikitababko/eslint-config/vanilla';

export default [
  ...vanilla,
  {
    rules: {
      // turn off a rule
      'no-console': 'off',
      // downgrade from error to warn
      '@typescript-eslint/no-explicit-any': 'warn',
      // add custom boolean prefix
      '@typescript-eslint/naming-convention': 'off',
    },
  },
];
```

You can also apply overrides to specific file patterns only:

```js
import vanilla from '@nikitababko/eslint-config/vanilla';

export default [
  ...vanilla,
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
```

---

## Monorepo Setup

In a monorepo, each package typically has its own `tsconfig.json`. Pass the correct path to avoid cross-package resolution issues:

```js
// packages/ui/eslint.config.js
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { reactConfig } from '@nikitababko/eslint-config/react';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default reactConfig({
  tsconfigPath: './tsconfig.json',
  tsconfigRootDir: __dirname,
});
```

```js
// packages/server/eslint.config.js
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { vanillaConfig } from '@nikitababko/eslint-config/vanilla';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default vanillaConfig({
  environment: 'node',
  tsconfigPath: './tsconfig.json',
  tsconfigRootDir: __dirname,
});
```

---

## Available Exports

| Import path                             | Default export               | Named exports                                                  |
| --------------------------------------- | ---------------------------- | -------------------------------------------------------------- |
| `@nikitababko/eslint-config`            | `vanillaConfig()` (array)    | —                                                              |
| `@nikitababko/eslint-config/base`       | `baseConfig()` (array)       | `baseConfig`                                                   |
| `@nikitababko/eslint-config/typescript` | `typescriptConfig()` (array) | `typescriptConfig`, `commonTsRules`, `DEFAULT_TS_FILES`        |
| `@nikitababko/eslint-config/stylistic`  | `stylisticConfig()` (array)  | `stylisticConfig`, `stylisticRules`, `DEFAULT_STYLISTIC_FILES` |
| `@nikitababko/eslint-config/vanilla`    | `vanillaConfig()` (array)    | `vanillaConfig`                                                |
| `@nikitababko/eslint-config/react`      | `reactConfig()` (array)      | `reactConfig`, `reactLayer`, `DEFAULT_REACT_FILES`             |
| `@nikitababko/eslint-config/solid`      | `solidConfig()` (array)      | `solidConfig`, `solidLayer`, `DEFAULT_SOLID_FILES`             |

---

## Troubleshooting

### Parsing error: project was not found

```
The file does not match your project config: some-file.ts.
The file must be included in at least one of the projects provided.
```

**Cause:** The file being linted is not covered by your `tsconfig.json` `include` patterns.

**Fix:** Pass the correct `tsconfigPath` and make sure all linted files are included:

```js
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { vanillaConfig } from '@nikitababko/eslint-config/vanilla';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default vanillaConfig({
  tsconfigPath: './tsconfig.json',
  tsconfigRootDir: __dirname,
});
```

Or use a separate `tsconfig.eslint.json` that includes all files:

```json
{
  "extends": "./tsconfig.json",
  "include": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
}
```

---

### ESLint is very slow

**Cause:** Type-aware rules (e.g. `no-floating-promises`) require full TypeScript project compilation on every run.

**Fix:** Limit the files that use type-aware rules:

```js
import { typescriptConfig } from '@nikitababko/eslint-config/typescript';

export default typescriptConfig({
  files: ['src/**/*.ts'], // only lint source, not tests/scripts
});
```

---

### `window` or `process` is not defined

**Cause:** The selected preset is using the wrong runtime globals for your project.

**Fix:** Pick the right `environment` explicitly:

```js
import { vanillaConfig } from '@nikitababko/eslint-config/vanilla';

export default vanillaConfig({
  environment: 'node',
  tsconfigPath: './tsconfig.json',
});
```

Available values: `'browser'`, `'node'`, `'neutral'`, `'universal'`.

---

### Missing peer dependency warnings

Install only the packages relevant to your preset. For vanilla TypeScript:

```bash
# npm
npm install -D eslint@^9.38.0 @eslint/js@^9.38.0 @typescript-eslint/eslint-plugin @typescript-eslint/parser @stylistic/eslint-plugin eslint-config-prettier eslint-plugin-unicorn eslint-plugin-import-x globals

# pnpm
pnpm add -D eslint@^9.38.0 @eslint/js@^9.38.0 @typescript-eslint/eslint-plugin @typescript-eslint/parser @stylistic/eslint-plugin eslint-config-prettier eslint-plugin-unicorn eslint-plugin-import-x globals

# yarn
yarn add -D eslint@^9.38.0 @eslint/js@^9.38.0 @typescript-eslint/eslint-plugin @typescript-eslint/parser @stylistic/eslint-plugin eslint-config-prettier eslint-plugin-unicorn eslint-plugin-import-x globals
```

---

### `*.jsx` files are not covered by default

**Cause:** The React and Solid presets are project-aware and default to `*.tsx`
only, so `*.jsx` must be opted into explicitly.

**Fix:** Pass `files: ['**/*.tsx', '**/*.jsx']` and make sure your TypeScript
config includes those files via `allowJs: true` or a dedicated
`tsconfig.eslint.json`.

---

### ESM `__dirname` helper

Use this ESM-compatible helper when you need `tsconfigRootDir`:

```js
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
```

---

## Contributing

Use a supported Node.js version listed above for development.

Contributions, bug reports, and feature requests are welcome.

1. Fork the repository
2. Create a branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run the full verification flow:
   - `pnpm test` - unit tests plus example build smoke
   - `pnpm lint:check`
   - `pnpm typecheck`
   - `pnpm format:check`
5. Helpful individual commands:
   - `pnpm test:unit` - run Vitest only
   - `pnpm examples:build` - build all example consumer projects only
   - `pnpm test:minimum` - pack and test every preset in an isolated consumer with
     exact minimum peer versions, without the workspace lockfile. CI runs this
     on Node.js 20.19.0, 22.13.0, and 24.0.0 with strict engine and peer checks.
6. Commit using [Conventional Commits](https://www.conventionalcommits.org): `pnpm commit`
7. Open a Pull Request

Please open an issue first for significant changes to discuss the approach.

[Open an issue →](https://github.com/nikitababko/eslint-config/issues)

---

## License

[MIT](LICENSE) © [Nikita Babko](https://github.com/nikitababko)
