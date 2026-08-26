# Implementation Plan: Configurable Rectangular Chart Shape

**Branch**: `003-configurable-chart-shape` | **Date**: 2026-08-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-configurable-chart-shape/spec.md`

## Summary

Extend the rectangular chart shape so users can personalise its geometry with explicit `rows` and `columns` values (e.g., 4×30 instead of the default 7×52, 7×7 now replaces the removed square). Explicit dimensions produce a day-per-cell column-major grid (GitHub week style, `idx=col*rows+row`, bottom-right pinned, transposing column-wise as in spec clarification 7×4→6×4); the unspecified-dimension defaults are 7 rows / 52 columns; the legacy week-aligned `days` behaviour is preserved and made mutually exclusive with explicit dimensions. **Breaking:** square shape is removed — `shape:'square'`/`size`/`--size`/`--geometry square` rejected (FR-017); a square is now `rows==columns`. Configuration surfaces span the library API (rectangular-only), React props, CLI flags (`--rows`, `--columns` only), and demo controls/snippet.

## Technical Context

**Language/Version**: TypeScript 7.0.2 (strict mode, ESM `"type": "module"`), Node.js >= 24

**Primary Dependencies**: commander 15.0.0 (CLI), sharp 0.35.3 (PNG), @octokit/graphql 9.0.4 (fetching), react 19 (peer, UI component); Vite (demo site)

**Storage**: N/A (no persistence; GitHub GraphQL API is the data source)

**Testing**: Vitest 4.1.10 + @vitest/coverage-v8 (>90% line/branch gate), @testing-library/react for component tests

**Target Platform**: Node.js 24+ (library + CLI), evergreen browsers (React component, demo site on GitHub Pages)

**Project Type**: Single npm package (`@wearelunatic/github-contrib-charts`) in a pnpm + turbo monorepo, plus a Vite demo workspace

**Performance Goals**: Grid computation for max geometry (366 cells) < 10 ms; demo preview updates < 500 ms after control change (spec SC-004)

**Constraints**: Display window capped at 366 days (one-year GitHub contributions API limit); PNG pixel dimensions scale with configured rows/columns; **breaking** removal of square shape per FR-017 (rectangular-only, `rows==columns` for squares)

**Scale/Scope**: ~8 source files touched (types, errors, grid, fetch validation, ui-types, CLI resolve/options/renderers, demo controls), new unit + functional + integration tests, README/TSDoc/demo doc updates in the same changeset

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Monorepo with Separable Packages | PASS | Changes confined to `packages/github-contrib-charts` (+ demo app); no new top-level modules |
| II. TypeScript Mandatory | PASS | All changes in strict-mode TS; exported API fully annotated |
| III. Test-First / TDD | PASS | Tasks will be ordered Red-Green-Refactor; failing tests committed with implementation |
| IV. Quality Gates | PASS | >90% coverage maintained; functional tests for public API additions; integration test covers fetch-window derivation for custom geometries |
| V. Versioning & Automated Publishing | PASS | Feature lands as `feat:` conventional commit; no publishing steps added |
| VI. Living Documentation | PASS | README options table, TSDoc, CLI `--help`, and demo option descriptions updated in the same changeset |

**Post-design re-check (Phase 1)**: PASS — design introduces no new packages, no `any`, no skipped tests; contracts define every public surface requiring functional tests.

## Project Structure

### Documentation (this feature)

```text
specs/003-configurable-chart-shape/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api.md           # Library, React, and CLI surface contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/github-contrib-charts/
├── src/
│   ├── types.ts            # ChartShapeConfig rectangular variant gains rows/columns; new constants
│   ├── errors.ts           # validateRows, validateColumns, rectangular-conflict validation
│   ├── grid.ts             # resolveShapeConfig precedence, column-major (GH week) computation for custom rectangular
│   ├── fetch.ts            # window derivation via shapeDayCount (unchanged signature)
│   ├── ui-types.ts         # ChartConfig rows/columns props + toShapeConfig mapping
│   └── cli/
│       ├── resolve.ts      # --rows/--columns flag resolution + conflict errors
│       ├── types.ts        # CliOptions rows/columns fields
│       └── cli.ts          # flag registration/help text
tests live under packages/github-contrib-charts/tests/{unit,functional,integration,cli}/
demo/                      # Vite demo app: rows/columns controls, preview, code snippet
```

**Structure Decision**: Existing monorepo layout retained. All library work happens inside the single package `packages/github-contrib-charts`; the demo workspace gets the interactive controls. No structural changes required.

## Complexity Tracking

> No constitution violations to justify — table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
