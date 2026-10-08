# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Fixed

- Align requirements with Unicorn 63 and fresh transitive dependencies:
  Node.js `^20.19.0 || ^22.13.0 || >=24.0.0` and ESLint `^9.38.0`. Verify exact
  minimum peer versions in an isolated packed consumer on each minimum Node.js
  version in CI, and require these checks before publishing.
- Prevent false ESLint errors on TypeScript function overloads, declaration
  merging, and ambient types such as `NodeJS.Process` by applying
  typescript-eslint's `eslint-recommended` compatibility rules across TS layers.

---

## [0.1.0] – 2026-02-15

### Added

- Flat ESLint presets:
  - `base` – ESLint recommended rules + Prettier compatibility.
  - `typescript` – TypeScript preset with type-aware linting.
  - `vanilla` – `base` + `typescript`.
  - `react` – `vanilla` + React / Hooks / Refresh rules.
  - `solid` – `vanilla` + SolidJS rules.
- Shared rule set (`commonTsRules`) used across presets.
- Exports map entrypoints for presets (e.g. `@pkg/react`, `@pkg/solid`).
