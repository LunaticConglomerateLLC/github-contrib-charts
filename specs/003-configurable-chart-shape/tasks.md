# Tasks: Configurable Rectangular Chart Shape

**Input**: Design documents from `/specs/003-configurable-chart-shape/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Constitution v1.2.0 Principle III mandates TDD (non-negotiable) and Principle IV requires >90% coverage with functional + integration gates — therefore test tasks are REQUIRED in every story phase and must be written/executed FAILING before their implementation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Monorepo (pnpm + turbo). All library work lives in `packages/github-contrib-charts/`; demo app in `demo/`.

- Library source: `packages/github-contrib-charts/src/`
- Library tests: `packages/github-contrib-charts/tests/{unit,functional,integration,cli}/`
- Demo app: `demo/src/`, demo tests: `demo/tests/functional/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm clean baseline before any feature work

 - [X] T001 Verify baseline on branch `003-configurable-chart-shape`: run `pnpm install && pnpm build && pnpm --filter @wearelunatic/github-contrib-charts typecheck && pnpm --filter @wearelunatic/github-contrib-charts test` from repo root; record all green before modifying files

**Checkpoint**: Baseline green — feature work may begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type surface + validation + config resolution that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Write FAILING validation tests in packages/github-contrib-charts/tests/unit/grid-edge-cases.test.ts covering: rows/columns = 0, negative, non-integer rejected with parameter-naming RangeErrors; `rows * columns > 366` rejected; `{shape:'rectangular', days}` combined with rows or columns rejected (mutual exclusion); valid 4×30 accepted
- [X] T003 Extend types in packages/github-contrib-charts/src/types.ts per data-model.md: rectangular variant of `ChartShapeConfig` gains optional `rows`/`columns`; `NormalizedShapeConfig` rectangular branch becomes discriminated `geometry:'weeks'|'custom'`; add constants `MIN_ROWS=1`, `MIN_COLUMNS=1`, `DEFAULT_ROWS=7`, `DEFAULT_COLUMNS=52`
- [X] T004 Implement validators in packages/github-contrib-charts/src/errors.ts: `validateRows(n)` / `validateColumns(n)` (integer ≥ 1, message names the offending parameter), product bound check (`rows * columns ≤ MAX_DAYS`), and days-vs-rows/columns conflict error inside `validateChartShapeConfig`; export new validators from src/index.ts
- [X] T005 Update `resolveShapeConfig` precedence + `shapeDayCount` in packages/github-contrib-charts/src/grid.ts per research.md D1/D7: rows/columns present → custom geometry (error if days also present via T004 validators); else days → weeks geometry; extend `warnCrossModeParam` so square configs warn-and-ignore rows/columns (FR-017)

**Checkpoint**: `pnpm --filter @wearelunatic/github-contrib-charts test -- tests/unit/grid-edge-cases.test.ts` green; typecheck green. User stories can now proceed.

---

## Phase 3: User Story 1 — Render Rectangular Grid with Explicit Rows×Columns (Priority: P1) 🎯 MVP

**Goal**: `{shape:'rectangular', rows:R, columns:C}` produces exactly R×C one-day cells in column-major GitHub-week chronological order (earliest top-left, latest bottom-right pinned; idx=col*rows+row; 7×4 28→6×4 24 transpose, 01 stays bottom-right) across SVG/text/PNG surfaces.

**Independent Test**: Run `tests/unit/grid-custom.test.ts` — a 4×30 config yields 120 day-cells, newest at bottom-right, young-account padding produces leading `date:null`/NONE cells, extremes 1×52 and 52×1 work.

### Tests for User Story 1 ⚠️ (write FIRST, verify FAILING)

- [X] T006 [P] [US1] Create FAILING geometry/ordering tests in packages/github-contrib-charts/tests/unit/grid-custom.test.ts: 4×30 grid has exactly 4 rows × 30 columns; cell index maps column-major GitHub-week (`idx = col*rows + row`); chronology top-to-bottom within column, columns left-to-right, bottom-right pinned; validated against 7×4 (28 21 14 07 / 01 bottom-right) → 6×4 (24 18 12 06 / 01 pinned) transpose; layout 'rectangular'
- [X] T007 [US1] Append FAILING padding/extremes tests to packages/github-contrib-charts/tests/unit/grid-custom.test.ts (after T006, same file): young-account data → earliest cells padded with `{date:null, contributionCount:0, contributionLevel:'NONE'}` while total window stays R×C; verify column-major earliest = top-left columns; 1×52 and 52×1 shapes render correctly; empty-data throws RangeError
- [X] T008 [P] [US1] Add FAILING integration test in packages/github-contrib-charts/tests/integration/fetch.test.ts: for custom config rows=4/columns=30 the derived fetch window spans exactly 120 days (`to - from`), and an explicit dateRange override not covering exactly rows*columns days throws RangeError mentioning the required count

### Implementation for User Story 1

- [X] T009 [US1] Split computation in packages/github-contrib-charts/src/grid.ts per research.md D8: custom rectangular uses column-major GitHub-week (`idx=col*rows+row` bottom-right pinned, 7×4 28→6×4 24); square retains row-major (`idx=row*size+col`); route accordingly in `computeGrid`; verify padding stays earliest-cells
- [X] T010 [US1] Verify/adjust window derivation in packages/github-contrib-charts/src/fetch.ts so `shapeDayCount` returns rows*columns for custom geometry and the dateRange override check message reflects the custom count (depends on T009)
- [X] T011 [US1] Add functional black-box tests to packages/github-contrib-charts/tests/functional/core-api.test.ts: public API accepts {rows:4, columns:30} end-to-end (computeGrid column-major + displayWindow bottom-right pinned) and rejects every invalid combination from SC-005 without invoking network (mock fetch not called) (depends on T009, T010)

**Checkpoint**: User Story 1 independently functional — quickstart.md Scenario 2 & 3 pass.

---

## Phase 4: User Story 2 — Partial Overrides, Default 7×52, React Props (Priority: P2)

**Goal**: Only-columns → rows defaults to 7; only-rows → columns defaults to 52; omitting everything renders the default week-aligned 7×52 year view (DEFAULT_DAYS 364); React component exposes rows/columns props.

**Independent Test**: Resolution tests prove partial/full defaults; updated legacy tests prove default window = 364 days → 52 week-aligned columns; ui-types tests prove prop mapping.

### Tests for User Story 2 ⚠️ (write FIRST, verify FAILING)

- [X] T012 [P] [US2] Add FAILING default-resolution tests to packages/github-contrib-charts/tests/unit/grid-custom.test.ts: `{columns:26}` resolves rows=7; `{rows:4}` resolves columns=52; both absent resolves week-aligned geometry with days=364 (52 columns, no padding column 53); proportional resize keeps count/ratio consistent when scaling 4×30 ↔ 2×60 style changes (FR proportional resize edge case)
- [X] T013 [P] [US2] Update FAILING expectations for the amended default in packages/github-contrib-charts/tests/unit/grid.test.ts and packages/github-contrib-charts/tests/cli/unit/cli.test.ts where they assert DEFAULT_DAYS=365 / 53-column default windows → now 364 days / 52 columns (documented intentional refinement FR-002)
- [X] T014 [P] [US2] Add FAILING prop-mapping tests to packages/github-contrib-charts/tests/unit/ui-types.test.ts: ChartConfig rows/columns flow through `toShapeConfig` into rectangular custom config; rows/columns never attached when shape='square'

### Implementation for User Story 2

- [X] T015 [US2] Apply partial-dimension defaults using DEFAULT_ROWS/DEFAULT_COLUMNS inside `resolveShapeConfig` in packages/github-contrib-charts/src/grid.ts (depends on T005, T012)
- [X] T016 [US2] Change `DEFAULT_DAYS` 365→364 in packages/github-contrib-charts/src/types.ts and fix any compile-time dependents; keep JSDoc noting the documented refinement (depends on T013)
- [X] T017 [US2] Extend ChartConfig with optional `rows`/`columns` and map them in `toShapeConfig` in packages/github-contrib-charts/src/ui-types.ts (rectangular only, per contracts §2) (depends on T014)
- [X] T018 [US2] Verify ContributionChart rendering honors custom props (tooltips/legend unchanged) by extending packages/github-contrib-charts/tests/react/unit/ coverage if a chart-level test exists, else assert via computeGrid output shape used by src/chart.tsx (FR-011) (depends on T017)

**Checkpoint**: User Stories 1 AND 2 independently functional — quickstart.md Scenarios 1, 2, 3 pass.

---

## Phase 5: User Story 3 — CLI Flags and Demo Controls (Priority: P3)

**Goal**: CLI `--rows`/`--columns` produce matching text/PNG charts with hard conflict errors; demo site Rows/Columns controls update preview ≤500 ms and regenerate the snippet.

**Independent Test**: CLI unit tests resolve flags and reject conflicts; render-text prints exactly R lines; demo functional test drives controls and asserts preview+snippet.

### Tests for User Story 3 ⚠️ (write FIRST, verify FAILING)

 - [X] T019 [P] [US3] Add FAILING resolution tests to packages/github-contrib-charts/tests/cli/unit/grid-config.test.ts: `--rows 4 --columns 30` → rectangular custom; `--columns 26` alone → 7×26; `--rows 4 --days 90` → RangeError listing mutually exclusive options; `--rows 4 --size 10` → RangeError (ambiguous geometry); `--geometry rectangular --rows 4` valid
 - [X] T020 [P] [US3] Add FAILING renderer tests: packages/github-contrib-charts/tests/cli/unit/render-text.test.ts asserts exactly 4 lines × 30 cells for 4×30 grids; packages/github-contrib-charts/tests/cli/unit/render-png.test.ts asserts pixel dimensions scale with configured rows/columns (FR-013, FR-014)
 - [X] T021 [P] [US3] Add FAILING demo functional test in demo/tests/functional/controls.test.tsx (create if absent): setting Rows=4/Columns=30 updates preview grid within 500 ms and snippet shows `shape="rectangular" rows={4} columns={30}`; restoring defaults shows 7×52

### Implementation for User Story 3

 - [X] T022 [US3] Add `rows?`/`columns?` fields to CliOptions in packages/github-contrib-charts/src/cli/types.ts (depends on T019)
 - [X] T023 [US3] Register `--rows <n>`/`--columns <n>` options with help text documenting defaults (7×52), bounds (≥1, product ≤366), and exclusivity with --days/--size in packages/github-contrib-charts/src/cli/cli.ts (depends on T022)
 - [X] T024 [US3] Implement flag resolution + hard conflict errors in `gridShapeConfig` in packages/github-contrib-charts/src/cli/resolve.ts per research.md D5 (presence implies rectangular; errors beat warn-ignore for days/size combos) (depends on T019, T022)
 - [X] T025 [US3] Extend functional CLI API coverage in packages/github-contrib-charts/tests/cli/functional/cli-api.test.ts: end-to-end resolve→grid→text render for 4×30 and rejection paths exit non-zero pre-fetch (depends on T024)
 - [X] T026 [US3] Add Rows/Columns numeric inputs to the rectangular panel in demo/src/config-panel.tsx wired through demo/src/app.tsx state so demo/src/preview.tsx re-renders and demo/src/code-snippet.tsx regenerates from the same config source (single source of truth, ≤500 ms update) (depends on T021)

**Checkpoint**: All three user stories independently functional — full CLI + demo paths verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation (Constitution VI), quality gates (Constitution IV), release readiness (Constitution V)

 - [X] T027 [P] Update option tables + examples for rows/columns and the amended 7×52 default in README.md (root) and packages/github-contrib-charts/README.md; note the intentional default change prominently
 - [X] T028 [P] Update demo usage descriptions/snippet docs in demo/README.md to describe Rows/Columns controls
 - [X] T029 Audit exported JSDoc on all new/changed symbols (src/types.ts, src/errors.ts, src/grid.ts, src/ui-types.ts, src/cli/*) for completeness (Constitution VI living documentation)
 - [X] T030 Run full quality gate: `pnpm build && pnpm typecheck && pnpm --filter @wearelunative/github-contrib-charts test:coverage` — suite green, coverage ≥90% line/branch (SC-006)
 - [X] T031 Execute quickstart.md scenarios 1–6 end-to-end and record results (SC-001…SC-006)
 - [X] T032 Prepare conventional commit plan: `feat:` scope with `!`/breaking-note decision for DEFAULT_DAYS 365→364 per research.md D3 impact note (Constitution V)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none — start immediately
- **Foundational (Phase 2)**: depends on T001; BLOCKS all user stories
- **US1 (Phase 3)**: depends on Phase 2; MVP increment
- **US2 (Phase 4)**: depends on Phase 2 (T005 especially); independent of US1 except sharing grid.ts (sequence edits to that file, do not parallel-edit)
- **US3 (Phase 5)**: depends on Phase 2; CLI/demo consume the foundational config surface; demo task T021/T026 independent of library internals beyond public API
- **Polish (Phase 6)**: depends on all desired stories complete

### User Story Dependencies

- **US1 (P1)**: Foundational only. No cross-story dependency.
- **US2 (P2)**: Foundational only. Touches same files as US1 (grid.ts, types.ts) — implement sequentially after US1 to avoid edit conflicts.
- **US3 (P3)**: Foundational only. CLI tasks independent of US1/US2 file edits except consuming resolved config; demo fully independent.

### Within Each User Story

Tests first (verify FAILING) → implementation → story checkpoint validation.

### Parallel Opportunities

- T002/T008/T012/T013/T014/T019/T020/T021 are test-file tasks in distinct files — parallelizable once their phase opens
- Phase 6 doc tasks T027/T028 parallelizable
- Stories may proceed in parallel across different engineers only if file ownership is split (library core vs CLI vs demo)

---

## Parallel Example: User Story 1

```bash
# Launch US1 test tasks together (distinct files):
Task: "T006 grid-custom geometry tests in tests/unit/grid-custom.test.ts"
Task: "T008 fetch-window integration test in tests/integration/fetch.test.ts"

# Then sequentially:
Task: "T007 padding/extremes tests (same file as T006)"
Task: "T009 implementation in src/grid.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phases 1–2 (setup + foundational types/validation/resolution)
2. Complete Phase 3 (custom R×C rendering end-to-end)
3. STOP and VALIDATE via quickstart.md Scenario 2/3
4. Demo-ready if desired

### Incremental Delivery

1. Foundation → 2. US1 (MVP) → 3. US2 (defaults + React props) → 4. US3 (CLI + demo) → 5. Polish gates

Each story adds value without breaking previous ones; SC-006 regression gate runs in Phase 6.

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Constitution III: every implementation task's preceding test task MUST be observed failing first
- Commit after each task or logical group (conventional commits, Constitution V)
- Avoid editing packages/github-contrib-charts/src/grid.ts from two stories concurrently

---

## Phase 7: Square Removal — Breaking FR-017 (rectangular-only, 7×7 via rows==columns)

**Purpose**: Remove square mode entirely per clarified FR-017 Session 2026-08-26 (user answer A). Rectangular `rows==columns` replaces square; hard-reject `shape:'square'`, `size`/`--size`, `--geometry square` with RangeError + guidance. Rectangular-only column-major (`idx=col*rows+row` bottom-right pinned).

**Independent Test**: `shape:'square'` / `size` / `--size` / `--geometry square` all throw `RangeError` mentioning removal + use `rows/columns`; 7×7 via `{shape:'rectangular', rows:7, columns:7}` renders 49 cells; no square branches remain.

### Tests for Square Removal ⚠️ (write FIRST, verify FAILING)

- [X] T033 [P] Add FAILING rejection tests in packages/github-contrib-charts/tests/unit/grid-edge-cases.test.ts + tests/unit/grid.test.ts: `validateChartShapeConfig({shape:'square', size:7})` and `resolveShapeConfig` with square throw RangeError mentioning square removed / use rows==columns (FR-017)
- [X] T034 [P] Add FAILING CLI rejection tests in packages/github-contrib-charts/tests/cli/unit/grid-config.test.ts + tests/cli/unit/cli.test.ts: `--size 7`, `--geometry square`, `{geometry:'square'}` in code all exit non-zero / throw RangeError mentioning square removed

### Implementation for Square Removal

- [X] T035 [P] Remove square variant from types in packages/github-contrib-charts/src/types.ts: delete `ChartShapeConfig` square branch and `NormalizedShapeConfig` square branch, remove `MIN_SIZE`/`MAX_SIZE`/`DEFAULT_SIZE` constants and `GridLayoutConfig` legacy square mapping; keep rectangular `rows`/`columns` + legacy `GridLayoutConfig` only if rectangular
- [X] T036 Remove square validators in packages/github-contrib-charts/src/errors.ts: delete `validateSize`, remove square path in `validateChartShapeConfig`, add hard reject for `shape==='square'` or `size` present with message `square mode removed: use {shape:'rectangular', rows: N, columns: N} for 7×7 etc.`; export updated
- [X] T037 Remove square branches in packages/github-contrib-charts/src/grid.ts per research.md D6/D8: delete `computeSquare`/`compute13By4` square paths, delete `warnCrossModeParam` square handling, `resolveShapeConfig`/`shapeDayCount`/`computeGrid` rectangular-only (weeks|custom column-major); remove `size` params
- [X] T038 Remove square from React + UI types in packages/github-contrib-charts/src/ui-types.ts + packages/github-contrib-charts/src/chart.tsx: `ChartConfig` shape narrowed to `'rectangular'` only, remove `size` prop, `toShapeConfig` rejects square, chart renders rectangular-only
- [X] T039 Remove square CLI surface in packages/github-contrib-charts/src/cli/types.ts + packages/github-contrib-charts/src/cli/cli.ts + packages/github-contrib-charts/src/cli/resolve.ts: delete `size` from `CliOptions`, remove `--size` option registration and `--geometry square` handling, `gridShapeConfig` rejects `--size`/`geometry square` with RangeError (FR-017) per contracts §2/§5
- [X] T040 [P] Update docs and clean tests: remove square tables/examples from README.md (root) + packages/github-contrib-charts/README.md + demo/README.md, delete square-specific test cases in tests/unit/grid-edge-cases.test.ts, tests/react/unit/theme.test.ts, demo/tests/functional/* that assert square; ensure 7×7 rectangular example present

**Checkpoint**: `pnpm build && pnpm typecheck && pnpm test` green, no `shape:'square'`/`--size`/`validateSize` greps remain except changelog/breaking note; 7×7 rectangular renders 49 cells.

