# Tasks: Custom Chart Layouts (Rectangular & Square)

**Input**: Design documents from `/specs/002-custom-chart-layouts/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Branch**: `002-custom-chart-layouts`
**Tests**: Included per TDD constitution ( >90% coverage, write FAILing tests first )

**Organization**: Tasks grouped by user story for independent implementation & testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3)
- Exact file paths required; checklist format `- [ ] T00X ...`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Branch, dependencies, workspace verification — no code changes yet

- [x] T001 Verify branch `002-custom-chart-layouts` and run `pnpm install` at repository root
- [x] T002 [P] Build workspace and confirm `pnpm --filter @wearelunatic/github-contrib-charts test --run` baseline passes in `packages/github-contrib-charts/`
- [x] T003 [P] Confirm demo builds via `pnpm --filter github-contrib-charts-demo build` in `demo/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared type system, validation, deprecated adapter, and display-window derivation that ALL stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Extend `ChartShapeConfig` union and `ContributionGrid` refinements in `packages/github-contrib-charts/src/types.ts` (add `shape:'rectangular'|'square'`, `days` 1–366 default 365, `size` 1–19 default 10; keep deprecated `GridLayoutConfig` variants with `@deprecated` TSDoc; export `ChartShapeConfig`, `DisplayWindow`, update `GridCell` date nullability)
- [x] T005 Update `ChartConfig` / `ContributionChartProps` to accept `shape`/`days`/`size` alongside deprecated `gridLayout` alias in `packages/github-contrib-charts/src/ui-types.ts` (defaults: shape rectangular, days 365, size 10; document mutual exclusivity)
- [x] T006 Add/extend validation helpers and re-export types in `packages/github-contrib-charts/src/errors.ts` (RangeError messages for `days must be integer 1–366`, `size must be integer 1–19`, `shape must be 'rectangular'|'square'`; helper `validateChartShapeConfig`)
- [x] T007 Implement `displayWindow(shapeConfig, anchor)` + `resolveShapeConfig` adapter (legacy `n-by-7` weeks→days, `13-by-4` passthrough) in `packages/github-contrib-charts/src/grid.ts` (export `resolveShapeConfig`, `displayWindow`, keep internal `ADAPTERS` map; include deprecation warning via console.warn)
- [x] T008 Update `displayWindow` usage and export re-exports in `packages/github-contrib-charts/src/index.ts` (re-export `ChartShapeConfig`, `ContributionGrid`, `DisplayWindow`)
- [x] T009 Update `deriveDateRange` from shape config in `packages/github-contrib-charts/src/fetch.ts` (rectangular `days` → from=anchor-(days-1), square `size*size` → from=anchor-(N²-1); respect explicit dateRange override with validation/warning; preserve token handling FR-028)

**Checkpoint**: `types.ts:ChartShapeConfig`, `grid.ts:resolveShapeConfig`, `fetch.ts` derivation compiles; unit tests for types/validation can now be written

---

## Phase 3: User Story 1 — Render Default Rectangular Chart by Days (Priority: P1) 🎯 MVP

**Goal**: Default rectangular 7×ceil(days/7) grid, days-based, week-aligned, most recent at bottom-right, padding earliest cells

**Independent Test**: Render with `mode: rectangular` (or omit mode) and `days:30` → 7 rows, ceil(30/7)=5 columns, 35 cells; most recent at bottom-right; `days:10` → 7×2 with 4 padded NONE cells; `days:365` → 7×53. Verified via `pnpm --filter @wearelunatic/github-contrib-charts test -- grid --run` and `<ContributionChart shape="rectangular" days={14}>` rendering 14 cells.

### Tests for User Story 1 (Write FIRST — must FAIL before implementation) ⚠️

- [x] T010 [P] [US1] Add rectangular contract tests for `computeGrid` in `packages/github-contrib-charts/tests/unit/grid.test.ts` (cases: days=1→7×1 with 6 padded, days=10→7×2 with 4 padded top of col0, days=14→7×2 no pad, days=30→7×5, days=365→7×53; verify bottom-right is most recent, week-alignment row=Sunday, chronological left-to-right)
- [x] T011 [P] [US1] Add rectangular validation/error tests in `packages/github-contrib-charts/tests/unit/grid.test.ts` (days=0,-5,3.5,1000,366+1 → RangeError; empty days array → RangeError; unknown shape → RangeError)
- [x] T012 [P] [US1] Add fetch window derivation tests for rectangular in `packages/github-contrib-charts/tests/integration/fetch.test.ts` (days=30→30-day range ending at anchor; days=365 default; explicit dateRange override honored; mocked GraphQL snapshots)
- [x] T013 [P] [US1] Add React rectangular rendering tests in `packages/github-contrib-charts/tests/unit/chart.test.tsx` (shape rectangular days=14 → 14 data-cell groups, 7-row geometry; hover tooltip shows ISO date+count; legend present; deprecated `gridLayout:{type:'n-by-7',weeks:4}` → still renders 28 days)

### Implementation for User Story 1

- [x] T014 [US1] Implement `computeRectangular` in `packages/github-contrib-charts/src/grid.ts` (rows=7, columns=ceil(days/7), Sunday-aligned `sundayOfWindow` anchor, column-major `date = sunday + col*7 + row`, padding `rows*columns-D` earliest cells at top of col0 with count 0 / NONE / date null; levelFor via window max; totalContributions sum; depends on T010–T013 failing)
- [x] T015 [US1] Update `computeGrid` dispatcher to route `rectangular` via `computeRectangular` and keep legacy `n-by-7` adapter path in `packages/github-contrib-charts/src/grid.ts` (validate days integer 1–366 before compute; normalize via `resolveShapeConfig`)
- [x] T016 [US1] Ensure `fetch.ts` rectangular window is used end-to-end and filtered to exact D days in `packages/github-contrib-charts/src/fetch.ts` (filter/pad missing dates to window length before return)
- [x] T017 [US1] Update `ContributionChart` to render rectangular geometry in `packages/github-contrib-charts/src/chart.tsx` (rows=7, columns=ceil(days/7), SVG width=columns*(CELL_SIZE+GAP)+GAP, height rows*…; cell positions col*(size+gap) row*(size+gap); use colorFor + level; keep tooltips/legend unchanged; handle deprecated gridLayout alias → resolveShapeConfig with dev warning)
- [x] T018 [US1] Verify text/PNG renderers are shape-agnostic for rectangular in `packages/github-contrib-charts/src/cli/render-text.ts` and `packages/github-contrib-charts/src/cli/render-png.ts` (text iterates cells row-by-row 7 rows; PNG dimensions columns*(CELL_SIZE+GAP)+GAP; no special case needed but add test for rectangular dims)

**Checkpoint**: `T010–T018` green → `pnpm --filter @wearelunatic/github-contrib-charts test -- grid --run` shows rectangular 7×ceil, padding, most-recent bottom-right; React rectangular renders; fetch window correct

---

## Phase 4: User Story 2 — Render Square Chart by Size (Priority: P2)

**Goal**: Square N×N grid (N² days), row-major left-to-right top-to-bottom, earliest top-left, most recent bottom-right, no weekday alignment

**Independent Test**: Render `shape:'square' size:10` → 10 rows, 10 cols, 100 cells, cells[0][0] earliest, cells[9][9] most recent; `size=7` → 7×7 square; `size=1` → 1×1; verify via grid.test and `<ContributionChart shape="square" size={10}>`.

### Tests for User Story 2 (Write FIRST — must FAIL before rectangular-complete impl) ⚠️

- [x] T019 [P] [US2] Add square contract tests in `packages/github-contrib-charts/tests/unit/grid.test.ts` (cases: size=1→1×1, size=5→5×5=25, size=7→7×7, size=10→10×10 row-major ordering earliest [0][0] most recent [N-1][N-1], size=19→19×19=361; verify no weekday alignment, chronological increment by 1 day, totalContributions sum)
- [x] T020 [P] [US2] Add square validation tests in `packages/github-contrib-charts/tests/unit/grid.test.ts` (size=0,-1,3.5,20,50,100→RangeError `size must be integer 1–19`; missing data → padded NONE)
- [x] T021 [P] [US2] Add square fetch window tests in `packages/github-contrib-charts/tests/integration/fetch.test.ts` (size=10→100-day range ending at anchor; size=1→1 day; explicit dateRange override validated against N²)
- [x] T022 [P] [US2] Add React square rendering tests in `packages/github-contrib-charts/tests/unit/chart.test.tsx` (shape square size=10→100 cells, 10×10 geometry equal width/height proportion, tooltip/legend preserved; shape switch without reload not required here)

### Implementation for User Story 2

- [x] T023 [US2] Implement `computeSquare` in `packages/github-contrib-charts/src/grid.ts` (rows=N, cols=N, N² cells, windowStart = anchor-(N²-1) days, row-major mapping windowStart + r*N + c, levelFor over window max, missing dates → NONE; validate size integer 1–19)
- [x] T024 [US2] Route `square` in `computeGrid` dispatcher in `packages/github-contrib-charts/src/grid.ts` (depends on T023; share displayWindow logic; handle ignore/warn for rectangular `days` param when shape is square per FR-017 note)
- [x] T025 [US2] Update `ContributionChart` square rendering in `packages/github-contrib-charts/src/chart.tsx` (square branch: rows=size, cols=size, SVG dims size*(CELL_SIZE+GAP)+GAP both axes, row-major cell positions; container resize keeps square proportions; reuse colorFor/tooltip/legend)
- [x] T026 [US2] Ensure stats filtering uses N² window in `packages/github-contrib-charts/src/stats.ts` or via fetch window (stats computed over filtered `size*size` days; no shape-specific branch beyond window length)
- [x] T027 [US2] Verify square PNG/text dimensions in `packages/github-contrib-charts/src/cli/render-text.ts` and `packages/github-contrib-charts/src/cli/render-png.ts` (text renders N rows; PNG width/height proportional to N; share rendering loop)

**Checkpoint**: Square contract holds for 1,10,19; both rectangular and square pass independently; React renders both modes

---

## Phase 5: User Story 3 — Configure Layout via CLI and Demo Site (Priority: P3)

**Goal**: CLI flags (`--geometry`/`--shape`, `--days`, `--size`) and demo shape toggle with conditional inputs + live preview + copyable snippet

**Independent Test**: `github-contribution-chart octocat --geometry rectangular --days 60` → 7×9 text/PNG; `--geometry square --size 12` → 12×12; no flags → rectangular 365; demo toggle Rectangular/Square → preview within 500ms, snippet reflects shape.

### Tests for User Story 3 (Write FIRST) ⚠️

- [x] T028 [P] [US3] Add CLI geometry/days/size parsing tests in `packages/github-contrib-charts/tests/unit/cli.test.ts` (default no flags → rectangular days 365; --geometry rectangular --days 30 → 7×5; --geometry square --size 10 → 10×10; invalid --geometry hex / --days 0 / --size 100 → exit 1 with message; mutual exclusivity --days with square / --size with rectangular → warning or error as spec)
- [x] T029 [P] [US3] Add CLI deprecated alias tests in `packages/github-contrib-charts/tests/unit/cli.test.ts` (--weeks 4 --layout n-by-7 → maps to rectangular days 28 with deprecation warning; still produces 7×4)
- [x] T030 [P] [US3] Add CLI PNG/text rendering tests in `packages/github-contrib-charts/tests/unit/cli.test.ts` (rectangular text has 7 rows; square text has N rows; PNG metadata width/height reflects grid geometry via sharp; filesystem error → exit 6)
- [x] T031 [P] [US3] Add demo config-panel tests in `demo/tests/functional/config-panel.test.tsx` (shape toggle visible; selecting Square shows size input hides days; selecting Rectangular shows days; changing value updates preview within 500ms via jsdom; code snippet reflects current shape/days/size; browser resize keeps square proportions)

### Implementation for User Story 3

- [x] T032 [US3] Add geometry CLI options and parsing in `packages/github-contrib-charts/src/cli/cli.ts` (add `--geometry <rectangular|square>` with choices, default rectangular, alias `--shape` for geometry; keep `--cell-shape` for glyph; add `--days` 1–366, `--size` 1–19; choices validation via commander; hidden deprecated `--weeks`, `--layout`; help text updated per `contracts/cli-contract.md`)
- [x] T033 [US3] Extend `CliOptions` type with shape fields in `packages/github-contrib-charts/src/cli/types.ts` (geometry: 'rectangular'|'square', days?:number, size?:number, weeks/layout deprecated; cellShape glyph field retained)
- [x] T034 [US3] Map CLI options → ChartShapeConfig in `packages/github-contrib-charts/src/cli/resolve.ts` (resolve geometry→shape, days or size→ChartShapeConfig; validate integer bounds, throw typed error → exit 1; mutually exclusive handling: if shape rectangular and size provided with non-default → warn or error; if deprecated weeks/layout provided → adapter-map to rectangular days=weeks*7)
- [x] T035 [US3] Wire fetch window derivation for CLI in `packages/github-contrib-charts/src/cli/cli.ts` (derive DateRange via displayWindow from resolved shapeConfig; pass to fetchContributions; honor explicit --from/--to if exists else shape-derived)
- [x] T036 [US3] Ensure CLI text renderer handles both modes in `packages/github-contrib-charts/src/cli/render-text.ts` (already shape-agnostic row iteration; verify rectangular 7 rows vs square N rows; map levels to block chars)
- [x] T037 [US3] Ensure CLI PNG renderer dimensions reflect geometry in `packages/github-contrib-charts/src/cli/render-png.ts` (width=cols*(CELL_SIZE+GAP)+GAP, height=rows*(CELL_SIZE+GAP)+GAP; square produces equal dims; rectangular produces 7-row height)
- [x] T038 [US3] Add demo shape toggle + conditional controls in `demo/src/config-panel.tsx` (segmented control Rectangular/Square at top; conditional: shape=rectangular → days number input 1–366 default 365; shape=square → size input 1–19 default 10; preserve inactive mode value on toggle; accessible labels, min/max validation)
- [x] T039 [US3] Manage shape/days/size state and derived GridLayoutConfig in `demo/src/app.tsx` (state shape:'rectangular'|'square', days, size; derive ChartShapeConfig; pass to ContributionChart; real-time preview without reload; handle deprecated gridLayout alias → adapter)
- [x] T040 [US3] Generate copyable snippet reflecting shape in `demo/src/code-snippet.tsx` (rectangular → `<ContributionChart shape="rectangular" days={60} .../>`; square → `<ContributionChart shape="square" size={10} .../>`; keep legacy gridLayout snippet as fallback)
- [x] T041 [US3] Sync demo preview with fetch and stats window in `demo/src/app.tsx` and `demo/src/preview.tsx` (derive DateRange from shape/size/days; fetch via same displayWindow; stats computed over correct N)

**Checkpoint**: CLI examples from quickstart §4 succeed (text rows 7 vs N, PNG dims, defaults, invalid handling); demo steps from quickstart §5 succeed (toggle, conditional input, live preview ≤500ms, snippet copy)

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Coverage, docs, validation completeness, backwards-compat polish

- [x] T042 [P] Add edge-case grid tests in `packages/github-contrib-charts/tests/unit/grid.test.ts` (sparse data younger than window → padded earliest NONE; empty contributions → all NONE; N²=361 contiguous ordering; colour mapping identical across modes FR-018)
- [x] T043 [P] Add shared grid empty/missing-date semantics tests in `packages/github-contrib-charts/tests/unit/grid.test.ts` (padded cells contributionCount 0 level NONE date null; window max 0 → all NONE)
- [x] T044 Update TSDoc and README API reference for new shape modes in `packages/github-contrib-charts/src/types.ts` and `packages/github-contrib-charts/README.md` (document ChartShapeConfig, RectangularConfig/SquarConfig, defaults 365/10, max 366/19, migration note for n-by-7)
- [x] T045 Update CLI --help text and docstrings in `packages/github-contrib-charts/src/cli/cli.ts` (geometry/days/size help, examples, deprecated aliases note; sync with `contracts/cli-contract.md`)
- [x] T046 Update demo inline docs/usage guide for shape toggle in `demo/src/config-panel.tsx` and `demo/README.md` (describe Rectangular vs Square, dimension ranges)
- [x] T047 Run quickstart.md validation scenarios 1–6 in sequence (grid, fetch, React, CLI, demo, coverage) and fix gaps in `specs/002-custom-chart-layouts/quickstart.md` (executable validation; capture outputs)
- [x] T048 Enforce coverage gate >90% and fix uncovered branches in `packages/github-contrib-charts/` (run `pnpm --filter @wearelunatic/github-contrib-charts test:coverage --run`; add tests for validation mutual-exclusivity and adapter paths)
- [x] T049 [P] Run `pnpm lint` and `pnpm typecheck` and fix errors across `packages/github-contrib-charts/src/` and `demo/src/` (no any, strict types, ESM)
- [x] T050 Verify backwards-compat migration: `pnpm --filter @wearelunatic/github-contrib-charts test --run` with legacy `gridLayout:{type:'n-by-7',weeks:4}` and `13-by-4` still passes (no regression) in `packages/github-contrib-charts/tests/unit/grid.test.ts` and `packages/github-contrib-charts/tests/unit/chart.test.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (T004→T005→T006→T007, T008/T009 parallel after T007)
- **User Stories (Phase 3+)**: All depend on Foundational completion
  - US1 (P1) can start after Phase 2 — no dependencies on other stories (MVP)
  - US2 (P2) can start after Phase 2 — may proceed in parallel with US1, but shares grid.ts dispatcher (coordinate edits)
  - US3 (P3) depends on US1+US2 grid computation being available — CLI/demo consume `computeGrid`/`displayWindow`; can start after US1 grid core, but square demo needs US2
- **Polish (Phase 6)**: Depends on all desired stories being complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — independent rectangular path
- **US2 (P2)**: After Foundational — independent square path; reuses validation/fetch patterns from US1 but independently testable
- **US3 (P3)**: After US1+US2 computeGrid — CLI resolve.ts and demo config-panel depend on both shapes being implemented

### Within Each User Story

- Tests (marked [P] where parallel) MUST be written and FAIL before implementation
- Models/types → Services (grid/fetch) → Rendering (chart/cli) → Integration (demo)
- Story complete before moving to next priority (MVP-first)

### Parallel Opportunities

- All [P] test tasks within a story (T010–T013, T019–T022, T028–T031) can run in parallel (different files or independent sections)
- Foundational T004, T002, T003 setup parallel; T008+T009 parallel after T007
- Once Foundational completes, US1 and US2 tests can be written in parallel by different developers (different shapes touching different branches of grid.ts)
- Polish T042/T043, T044/T045/T046 docs parallel, T049 lint parallel with T048 coverage

---

## Parallel Example: User Story 1 (MVP)

```bash
# Launch all US1 tests together (they target different files/sections):
Task: "Add rectangular contract tests in packages/github-contrib-charts/tests/unit/grid.test.ts"
Task: "Add rectangular validation tests in packages/github-contrib-charts/tests/unit/grid.test.ts" (same file — sequential)
Task: "Add fetch window derivation tests in packages/github-contrib-charts/tests/integration/fetch.test.ts"
Task: "Add React rectangular rendering tests in packages/github-contrib-charts/tests/unit/chart.test.tsx"

# After tests fail, implement:
Task: "Implement computeRectangular in packages/github-contrib-charts/src/grid.ts"
Task: "Update ContributionChart rectangular rendering in packages/github-contrib-charts/src/chart.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T009)
3. Complete Phase 3: US1 Rectangular (T010–T018)
4. **STOP and VALIDATE**: `pnpm --filter @wearelunatic/github-contrib-charts test -- grid --run` → rectangular 7×ceil, padding, most-recent bottom-right; `pnpm --filter @wearelunatic/github-contrib-charts test -- chart --run` → rectangular rendering
5. Deploy/demo if ready — default rectangular chart covering 365 days with zero shape config works (SC-001 half)

### Incremental Delivery

1. Setup + Foundational → types/displayWindow/adapter ready
2. Add US1 → rectangular MVP (7×53 default) → validate independently
3. Add US2 → square N×N → validate square 10×10 vs rectangular 30 days isolation
4. Add US3 → CLI --geometry/--days/--size + demo toggle → validate quickstart §4 and §5 E2E
5. Polish → coverage >90%, lint/typecheck, docs sync, backwards-compat migration note

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T004–T009)
2. Once Foundational done:
   - Developer A: US1 rectangular grid + chart (T010–T018)
   - Developer B: US2 square grid + chart (T019–T027)
   - Developer C: Prepares US3 CLI/demo scaffolding (T028–T031 tests, T032–T037 CLI prep) — integrates after A+B finish dispatcher
3. Stories integrate via `grid.ts:computeGrid` dispatcher — coordinate that file's merges

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability (US1=P1 Rectangular, US2=P2 Square, US3=P3 CLI/Demo)
- Each user story independently completable and testable per spec acceptance scenarios
- Verify tests fail before implementing (TDD constitution III)
- Commit after each task or logical group with conventional commit `feat(002-...): ...`
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same-file conflicts without sequencing, cross-story dependencies that break independence
- File paths assume single-package monorepo: `packages/github-contrib-charts/src/` + `demo/src/` per `plan.md` § Project Structure

## Phase 7: Convergence

<!-- Appended by /speckit.converge after the Phase 1–6 implementation passed all gates (178 pkg + 24 demo tests, typecheck 4/4, coverage 90.23% branches). -->

- [x] T051 Honor and validate an explicit `dateRange` override in the shape-based window derivation per FR-027 (partial): extend `deriveDateRange` in `packages/github-contrib-charts/src/fetch.ts` to accept an optional override range that is used as-is when its day-span matches the shape window (`days` or `size²`) and throws a descriptive RangeError otherwise; re-export from `src/index.ts`; add unit tests for honored + mismatch-rejected cases in `packages/github-contrib-charts/tests/integration/fetch.test.ts`; document the override behaviour in the root README 'Chart shapes' section
- [x] T052 Warn on cross-mode dimension flags during CLI option resolution per FR-020 / plan warn-and-ignore decision (partial): in `gridShapeConfig` (`packages/github-contrib-charts/src/cli/resolve.ts`), emit a console.warn mirroring grid.ts wording ("'X' is ignored for Y shapes; use 'Z'.") when `--size` accompanies a rectangular resolution or `--days` accompanies a square resolution (with or without explicit `--geometry`); add warning assertions to `packages/github-contrib-charts/tests/cli/unit/grid-config.test.ts`
