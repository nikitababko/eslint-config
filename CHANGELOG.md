# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased](https://github.com/nikitababko/eslint-config/compare/v0.1.0...HEAD)

## [0.1.0](https://github.com/nikitababko/eslint-config/releases/tag/v0.1.0) - 2026-10-25

### Added

- Flat ESLint presets:
  - `base` – ESLint recommended rules + Prettier compatibility.
  - `typescript` – TypeScript preset with type-aware linting.
  - `vanilla` – `base` + `typescript`.
  - `react` – `vanilla` + React / Hooks / Refresh rules.
  - `solid` – `vanilla` + SolidJS rules.
- Shared rule set (`commonTsRules`) used across presets.
- Exports map entrypoints for presets (e.g. `@pkg/react`, `@pkg/solid`).
- Optional `strict` layer for TypeScript, vanilla, React, and Solid presets.
  Reject unsafe operations involving `any`, require exhaustive union and enum
  switches, and treat explicit `any` and floating promises as errors. Scope the
  checks with `strictConfig`; use `isTypeAware: false` for untyped files.
- Optional `projectService` support in TypeScript, vanilla, React, and Solid
  factories and framework layers. Use the nearest `tsconfig.json` for each file,
  including project references, or pass the parser's project service options.
  Enabling it overrides `tsconfigPath`; `isTypeAware: false` disables both modes.
- Optional `isTypeAware: false` mode in TypeScript, vanilla, React, and Solid
  factories and framework layers. Lint files without a `tsconfig.json` or outside
  its project while retaining syntax-based and framework rules.
- Default `.mts` and `.cts` support in the TypeScript layer, the vanilla, React,
  and Solid presets, and the optional stylistic layer.
- React Hooks checks in `.ts`, `.tsx`, `.mts`, and `.cts` files by default in the
  React preset and standalone layer.
- Solid reactivity checks in `.ts`, `.tsx`, `.mts`, and `.cts` files by default in
  the Solid preset and standalone layer, including stores and reactive utilities
  without JSX.
- Optional `stylistic` entrypoint with `stylisticConfig`, `stylisticRules`, and
  file-scoped formatting checks. Append it after a preset to enable the package's
  chosen style. Default presets leave formatting to Prettier.
- TypeScript compatibility rules for function overloads, declaration merging,
  and ambient types such as `NodeJS.Process`.
- Support for Node.js `^20.19.0 || ^22.13.0 || >=24.0.0` and ESLint `^9.38.0`.
  Verify exact minimum peer versions in an isolated packed consumer on each
  minimum Node.js version in CI.
- Installation commands with compatible peer dependency ranges for npm, pnpm,
  and Yarn, verified in isolated Vanilla, React, and Solid consumers in CI.
- Release workflow for npm and GitHub Packages with CI checks, example lint,
  minimum supported version checks, tag/version matching, and non-empty release
  notes required before publishing.
- GitHub release notes generated from the matching changelog section, including
  its heading and subsections.
