# Implementation Plan: Custom Chart Layouts (Rectangular & Square)

**Branch**: `002-custom-chart-layouts` | **Date**: 2026-08-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-custom-chart-layouts/spec.md`

## Summary

Extend the existing contribution chart library to support two explicit shape modes: **rectangular** (default, 7 rows × `ceil(days/7)` columns, each cell = 1 day) and **square** (`N×N`, each cell = 1 day, row-major order, bottom-right most recent). Replace the implicit `weeks`-based `n-by-7` API with a `days`-based rectangular API while preserving backwards compatibility via adapter/migration shim. Update the single published package (`packages/github-contrib-charts`) — grid engine (`grid.ts`, `types.ts`, `ui-types.ts`), React renderer (`chart.tsx`), CLI (`cli.ts` + renderers), and demo site (`config-panel.tsx`, `app.tsx`) — to expose shape selection and dimension controls, plus validation and documentation.

## Technical Context

**Language/Version**: TypeScript 5.8+ (strict mode), targeting Node.js 24+ (LTS/Krypton)

**Primary Dependencies**:
- **Core**: `@octokit/graphql` 9.x (GitHub GraphQL client, already in repo)
- **React**: `react` 19.x, `react-dom` 19.x
- **CLI/PNG**: `sharp` 0.35.x (SVG→PNG via libvips), `commander` 15.x
- **Monorepo**: `pnpm` 11.x workspaces + `turbo` 2.x task orchestration
- **Testing**: `vitest` 4.x + `@vitest/coverage-v8`, `@testing-library/react`, `jsdom`
- **Demo site**: `vite` 8.x + `@vitejs/plugin-react` 6.x

**Storage**: N/A (stateless data fetching and rendering; no persistence)

**Testing**: Vitest 4.x with V8 coverage. Unit tests for new grid modes, validation, colour mapping. Integration tests for fetch window derivation (`days` / `size²`) using snapshotted GraphQL responses. PNG pipeline tested via sharp metadata + pixel-diff tolerance. Demo functional tests via jsdom/React Testing Library.

**Target Platform**: Node.js 24+ for core/CLI. Modern browsers (ES2022+) for React component and demo site.

**Project Type**: Monorepo — single npm package (`@wearelunatic/github-contrib-charts` under `packages/github-contrib-charts`) + `demo/` app (not published). This feature touches only that package and the demo.

**Performance Goals**: No regression from existing gates: CLI PNG generation <10s for max window (366 days / 19×19). React renders within one frame (16ms) for up to 53×7 or 19×19 cells. GraphQL query deserialization <50ms for 1-year data. New grid computation O(days) or O(N²) with negligible overhead vs current O(weeks×7).

**Constraints**: Zero unauthenticated HTTP. Token never logged/persisted. ESM-only. Exact-version pinned deps. Max window 366 days (leap-year). Rectangular fixed height 7. Square max size `floor(sqrt(366)) = 19`. Backwards compat for `n-by-7`/`13-by-4` via deprecated shim.

**Scale/Scope**: Single user's contributions, 1–366 days rectangular / 1–361 days square (19²). Grids up to 53×7 or 19×19 cells. ~12 source files touched, ~28 functional requirements, 3 user stories.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Monorepo with Separable Packages | PASS | Changes stay inside the single published package `packages/github-contrib-charts` (modular sub-modules `grid`, `fetch`, `chart`, `cli`) and `demo/`. No new top-level module introduced; internal boundaries preserved. |
| II. TypeScript Mandatory | PASS | All new/changed code in strict TypeScript with explicit exported types. No `any` expected. |
| III. Test-First / TDD (NON-NEGOTIABLE) | PASS | Plan mandates failing tests before implementation (grid modes, validation, CLI flags, demo toggle). |
| IV. Quality Gates (>90% coverage) | PASS | New grid branches, validation, and renderers add coverage load; coverage target unchanged. Functional tests per public API, integration tests for fetch window + PNG pipeline. |
| V. Versioning & Automated Publishing | PASS | Conventional Commits `feat:` with possible `BREAKING CHANGE:` footer if `GridLayoutConfig` is renamed; release-please handles semver bump (`feat!:` → major). No manual publish. |
| VI. Living Documentation | PASS | TSDoc, CLI `--help`, demo inline descriptions, README API reference, and quickstart will be updated in same changeset. |
| Technical Standards | PASS | Node 24+, ESM, pnpm, exact-version deps pinned to latest, MIT. |

**Post-design re-check**: All gates remain PASS after Phase 1 design (see research.md alternatives). No violations or deviations requiring Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/002-custom-chart-layouts/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── grid-contract.md # computeGrid contract for rectangular/square
│   ├── cli-contract.md  # CLI flags contract
│   └── react-contract.md# React props contract
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/github-contrib-charts/
├── src/
│   ├── types.ts              # GridLayoutConfig → ChartShapeConfig, ContributionGrid refinement
│   ├── ui-types.ts           # ChartConfig updated to use shape/days/size
│   ├── grid.ts               # computeRectangular, computeSquare, adapter for legacy n-by-7/13-by-4
│   ├── fetch.ts              # derive dateRange from shape (days / size²)
│   ├── chart.tsx             # renders rectangular (7×ceil) and square (N×N)
│   ├── theme.ts              # unchanged (colour mapping shared)
│   ├── shapes.tsx            # unchanged
│   ├── errors.ts             # add validation error type if needed
│   ├── cli/
│   │   ├── cli.ts            # --shape, --days, --size flags, mutually-exclusive validation
│   │   ├── types.ts          # CliOptions shape fields
│   │   ├── resolve.ts        # options → GridLayoutConfig mapping
│   │   ├── render-text.ts    # text grid for both modes
│   │   └── render-png.ts     # PNG dimensions for both modes
│   └── index.ts              # re-exports new types
└── tests/
    ├── unit/
    │   ├── grid.test.ts      # rectangular/square cases, padding, ordering
    │   ├── types.test.ts
    │   └── cli.test.ts
    ├── integration/
    │   └── fetch.test.ts     # window derivation
    └── functional/
        └── [existing]

demo/
├── src/
│   ├── config-panel.tsx      # shape toggle + conditional days/size inputs
│   ├── app.tsx               # state for shape, derived GridLayoutConfig
│   └── code-snippet.tsx      # snippet reflects shape/days/size
└── tests/functional/
    └── config-panel.test.tsx # updated
```

**Structure Decision**: Single-package monorepo (constitution v1.2.0). Feature is an in-place extension of `packages/github-contrib-charts`; no new package created. Demo remains the sole app. This matches the repo's actual layout (discovered via `ls` — `packages/github-contrib-charts` + `demo/`), correcting the three-package diagram from `001` which predates the single-package migration.

## Complexity Tracking

> No constitution violations. No complexity justifications needed.
