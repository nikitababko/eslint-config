# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added

- Default `.mts` and `.cts` support in the TypeScript layer, the vanilla, React,
  and Solid presets, and the optional stylistic layer.
- Optional `stylistic` entrypoint with `stylisticConfig`, `stylisticRules`, and
  file-scoped formatting checks. Append it after a preset to enable the package's
  chosen style.

### Fixed

- Require example lint alongside the existing CI checks before publishing. Check
  that the release tag matches `package.json` and has non-empty release notes
  before either registry receives the package.
- Extract GitHub release notes with a tested script that supports bracketed
  version headings, preserves subsections, and reads the final release through
  the end of the changelog.
- Leave formatting to Prettier in the default TypeScript, vanilla, React, and
  Solid presets. Formatting rules have moved out of `commonTsRules` into the
  optional stylistic layer; React's `react/jsx-newline` is no longer enabled.
  The stylistic quotes rule accepts double quotes to avoid escaping apostrophes,
  and single-line block spacing uses spaces.
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
