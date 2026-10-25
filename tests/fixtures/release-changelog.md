# Changelog

## [Unreleased]

### Added

- Future change.

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
