# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

- (Nothing yet)

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
