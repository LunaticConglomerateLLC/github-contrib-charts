# Tasks: GitHub Contribution Charts Library

**Input**: Design documents from `specs/001-github-contribution-charts/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included. The constitution mandates TDD (test-first, >90% coverage), so tests are written FIRST and verified to fail before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `packages/core/`, `packages/react/`, `packages/cli/`, `demo/` at repository root
- **Tests**: `packages/<name>/tests/{unit,integration,functional}/` per package
- Paths below follow the plan.md monorepo structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, monorepo tooling, CI, and release configuration

- [X] T001 Create root `package.json` with `"type": "module"`, private `true`, and workspace metadata
- [X] T002 Create `pnpm-workspace.yaml` declaring `packages/*` and `demo` workspaces
- [X] T003 Create `tsconfig.base.json` with strict TypeScript settings shared by all packages
- [X] T004 [P] Create `turbo.json` with build/test/lint pipeline definitions
- [X] T005 [P] Install and configure `typescript`, `vitest`, `@vitest/coverage-v8` at the workspace root
- [X] T006 Create root `vitest.workspace.ts` covering all packages and the demo app
- [X] T007 Create `.gitignore` (node_modules, dist, coverage, .turbo, .DS_Store)
- [X] T008 Create `release-please-config.json` with `include-component-in-tag: false`, `include-v-in-tag: true`, `node-workspace` plugin, and `packages/*` entries
- [X] T009 Create empty `.release-please-manifest.json` (populated by release-please on first release)
- [X] T010 Create `.github/workflows/ci.yml` running pnpm install, typecheck, lint, build, test, and coverage (Node 24, pnpm 11)
- [X] T011 Create `.github/workflows/release.yml` using googleapis/release-please-action@v4 with npm publish steps gated on `packages/{pkg}--release_created` output variables and `NODE_AUTH_TOKEN` secret
- [X] T012 Create `.github/workflows/pages.yml` building `demo/` and deploying to GitHub Pages from `main`
- [X] T013 Create root `README.md` stating the project is built using GitHub SpecKit (specification-driven development) and OpenCode (AI-assisted coding), per the Living Documentation principle

**Checkpoint**: Monorepo builds and passes typecheck/lint with empty packages.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and package scaffolding that MUST exist before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T014 Create `packages/core/package.json` (ESM, name `@scope/core`, exports map, exact-version deps)
- [X] T015 Create `packages/react/package.json` (ESM, name `@scope/react`, peer deps on react/react-dom/`@scope/core`)
- [X] T016 Create `packages/cli/package.json` (ESM, name `@scope/cli`, bin entry `github-contribution-chart`, dep on `@scope/core`)
- [X] T017 Create `demo/package.json` (Vite + React app, private, not published)
- [X] T018 [P] Define `ContributionLevel` and `ContributionDay` types in `packages/core/src/types.ts` per data-model.md
- [X] T019 [P] Define `DateRange`, `GridLayoutConfig`, `ContributionGrid`, `GridCell`, and `ContributionStats` types in `packages/core/src/types.ts`
- [X] T020 [P] Define error types (`AuthenticationError`, `UserNotFoundError`, `RateLimitError`, `NetworkError`, `RangeError`) in `packages/core/src/errors.ts`
- [X] T021 [P] Define `ChartConfig`, `ThemePreset`, `ColorStop`, and `CellShape` types in `packages/react/src/types.ts`
- [X] T022 Configure `@scope/core` test setup (vitest config, coverage threshold >90%) in `packages/core/vitest.config.ts`

**Checkpoint**: Foundation ready — shared types defined, all three packages scaffolded. User story implementation can begin.

---

## Phase 3: User Story 1 - Embed a Contribution Chart in a React App (Priority: P1) 🎯 MVP

**Goal**: Developers can fetch GitHub contribution data, compute stats and custom grids, and render an SVG chart in React with custom shapes, colours, and themes.

**Independent Test**: Install `@scope/core` and `@scope/react`, provide a valid token and username, render a 7×7 grid, and verify a legible SVG renders with ≥2 derived statistics visible.

### Tests for User Story 1 (write FIRST, verify they FAIL) ⚠️

- [X] T023 [P] [US1] Unit test `computeGrid` N×7 layout (Sunday-first, chronological fill) in `packages/core/tests/unit/grid-nx7.test.ts`
- [X] T024 [P] [US1] Unit test `computeGrid` 13×4 layout (weekly aggregation, quarterly rows) in `packages/core/tests/unit/grid-13x4.test.ts`
- [X] T025 [P] [US1] Unit test `computeGrid` edge cases (weeks < 1, empty days, non-divisible ranges) in `packages/core/tests/unit/grid-edge-cases.test.ts`
- [X] T026 [P] [US1] Unit test `computeStats` (totals, breakdowns, PR review %, zero-day handling) in `packages/core/tests/unit/stats.test.ts`
- [X] T027 [P] [US1] Integration test `fetchContributions` against recorded GraphQL responses in `packages/core/tests/integration/fetch.test.ts`
- [X] T028 [P] [US1] Functional test for `@scope/core` public API (all exports, error types) in `packages/core/tests/functional/core-api.test.ts`
- [X] T029 [P] [US1] Unit test `<ContributionChart>` renders SVG with correct cell count/shape in `packages/react/tests/unit/chart.test.tsx`
- [X] T030 [P] [US1] Unit test theme mapping (presets + custom ColorStop) in `packages/react/tests/unit/theme.test.ts`
- [X] T031 [P] [US1] Unit test cell shape renderers (circle, square, rounded-rect) in `packages/react/tests/unit/shapes.test.tsx`
- [X] T032 [P] [US1] Unit test tooltip rendering on hover in `packages/react/tests/unit/tooltip.test.tsx`
- [X] T033 [P] [US1] Unit test error/empty states in `packages/react/tests/unit/chart-states.test.tsx`
- [X] T034 [P] [US1] Functional test for `@scope/react` public API (components, re-exports) in `packages/react/tests/functional/react-api.test.tsx`

### Implementation for User Story 1

- [X] T035 [US1] Implement `fetchContributions` using `@octokit/graphql` in `packages/core/src/fetch.ts` (token header, date-range validation, error mapping per contracts/core-api.md)
- [X] T036 [US1] Implement `computeGrid` (N×7 and 13×4 strategies) in `packages/core/src/grid.ts`
- [X] T037 [US1] Implement `computeStats` in `packages/core/src/stats.ts`
- [X] T038 [US1] Implement public exports and index in `packages/core/src/index.ts`
- [X] T039 [P] [US1] Implement theme presets and color mapping in `packages/react/src/theme.ts`
- [X] T040 [P] [US1] Implement cell shape renderers in `packages/react/src/shapes.tsx`
- [X] T041 [US1] Implement `<ContributionChart>` SVG component in `packages/react/src/chart.tsx` (grid render, shapes, themes, tooltip, legend, stats panel)
- [X] T042 [US1] Implement tooltip component in `packages/react/src/tooltip.tsx`
- [X] T043 [US1] Implement `<ContributionStats>` component in `packages/react/src/stats-panel.tsx`
- [X] T044 [US1] Implement public exports and index in `packages/react/src/index.ts`

**Checkpoint**: User Story 1 fully functional — a developer can render a custom-grid SVG contribution chart with stats, independently testable.

---

## Phase 4: User Story 2 - Generate Charts from the CLI (Priority: P2)

**Goal**: Developers/CI can generate a contribution chart as PNG or text from the command line without embedding React.

**Independent Test**: Run `github-contribution-chart <username> --format png --output ./out` with a valid token; verify a PNG file is written and `--format text` prints a summary to stdout.

### Tests for User Story 2 (write FIRST, verify they FAIL) ⚠️

- [X] T045 [P] [US2] Unit test text formatter (totals, breakdown, grid representation) in `packages/cli/tests/unit/render-text.test.ts`
- [X] T046 [P] [US2] Unit test PNG rendering via sharp (metadata + pixel-diff) in `packages/cli/tests/unit/render-png.test.ts`
- [X] T047 [P] [US2] Unit test CLI arg parsing, exit codes, and error mapping in `packages/cli/tests/unit/cli.test.ts`
- [X] T048 [P] [US2] Functional test for `@scope/cli` programmatic API (`renderText`, `renderPng`) in `packages/cli/tests/functional/cli-api.test.ts`
- [X] T049 [P] [US2] Integration test CLI end-to-end (env token, output file, exit codes) in `packages/cli/tests/integration/cli-e2e.test.ts`

### Implementation for User Story 2

- [X] T050 [P] [US2] Implement text formatter in `packages/cli/src/render-text.ts` per contracts/cli-api.md
- [X] T051 [P] [US2] Implement PNG renderer (SVG build + `sharp().png()`) in `packages/cli/src/render-png.ts`
- [X] T052 [US2] Implement commander CLI definition (flags, choices, env-token fallback) in `packages/cli/src/cli.ts`
- [X] T053 [US2] Implement `renderText` and `renderPng` programmatic functions in `packages/cli/src/index.ts`
- [X] T054 [US2] Wire `@scope/core` dependency and re-export types in `packages/cli/src/index.ts`

**Checkpoint**: User Stories 1 AND 2 both work independently — CLI produces text and PNG output.

---

## Phase 5: User Story 3 - Configure and Preview Charts Interactively (Priority: P3)

**Goal**: Visitors use the demo site to enter a token, configure grid/theme/shape interactively, see live preview, and copy ready-to-use code.

**Independent Test**: Navigate to the built demo site, enter a token, change grid to 7×7 and theme to GitHub Dark, verify live re-render and that the copied snippet is syntactically correct.

### Tests for User Story 3 (write FIRST, verify they FAIL) ⚠️

- [X] T055 [P] [US3] Unit test config-panel state updates (grid, theme, shape, date range) in `demo/tests/functional/config-panel.test.tsx`
- [X] T056 [P] [US3] Unit test preview re-renders on config change in `demo/tests/functional/preview.test.tsx`
- [X] T057 [P] [US3] Unit test code-snippet generation (npm install + JSX) in `demo/tests/functional/code-snippet.test.tsx`

### Implementation for User Story 3

- [X] T058 [P] [US3] Create Vite + React demo app entry in `demo/src/main.tsx` and `demo/index.html`
- [X] T059 [US3] Implement `App` layout wiring token/username/config state in `demo/src/app.tsx`
- [X] T060 [P] [US3] Implement interactive `ConfigPanel` (grid, theme, shape, date-range controls) in `demo/src/config-panel.tsx`
- [X] T061 [P] [US3] Implement live `Preview` chart using `@scope/react` in `demo/src/preview.tsx`
- [X] T062 [P] [US3] Implement `CodeSnippet` copy-paste generator in `demo/src/code-snippet.tsx`
- [X] T063 [US3] Implement client-side token handling and security warning in `demo/src/app.tsx`
- [X] T064 [US3] Configure Vite base path for GitHub Pages deployment in `demo/vite.config.ts`

**Checkpoint**: All three user stories functional — demo site previews and generates copyable code.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, release readiness, and constitution-mandated quality gates

- [X] T065 [P] Write `packages/core/README.md` (purpose, install, API reference, minimal example)
- [X] T066 [P] Write `packages/react/README.md` (purpose, install, component API, minimal example)
- [X] T067 [P] Write `packages/cli/README.md` (purpose, install, `--help` synopsis, programmatic API)
- [X] T068 [P] Add TSDoc to all public API symbols in `packages/core/src/index.ts`, `packages/react/src/index.ts`, `packages/cli/src/index.ts`
- [X] T069 [P] Verify CLI `--help` text stays in sync with commander definitions in `packages/cli/src/cli.ts`
- [X] T070 [P] Add `pnpm test:coverage` script enforcing >90% line+branch coverage across all packages in root `package.json`
- [X] T071 [P] Add `pnpm typecheck` script (tsc --noEmit) across all packages in root `package.json`
- [X] T072 [P] Configure Dependabot (`.github/dependabot.yml`) for pnpm and npm dependency updates
- [X] T073 [P] Verify release-please config produces `v1.2.3` tags (no package-name prefix) in `release-please-config.json`
- [X] T074 [P] Run `quickstart.md` validation scenarios end-to-end and document results in `specs/001-github-contribution-charts/quickstart.md`

**Checkpoint**: Feature is polished, documented, and all constitution quality gates verified.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational completion
  - US1 (P1) first, then US2 (P2), then US3 (P3), sequentially in priority order
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational. Uses `@scope/core` (fetch/stats/grid) and `@scope/react`. MVP.
- **User Story 2 (P2)**: After Foundational. Uses `@scope/core` (fetch/stats/grid). Does NOT depend on `@scope/react` — CLI uses its own text/SVG rendering.
- **User Story 3 (P3)**: After Foundational AND after `@scope/react` (US1). Depends on US1 for the `<ContributionChart>` component.

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD per constitution)
- Types/errors before services
- Core package before React/CLI
- Implementation before integration

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational type-definition tasks marked [P] can run in parallel
- Within US1: tests T023–T034 are all [P]; theme/shapes T039–T040 are [P] after core types
- Within US2: tests T045–T049 are all [P]; render-text/render-png T050–T051 are [P]
- Within US3: tests and app scaffolding are [P]; components T060–T062 are [P]
- Polish tasks T065–T074 are all [P]

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (write-first, TDD):
Task: "Unit test computeGrid N×7 in packages/core/tests/unit/grid-nx7.test.ts"
Task: "Unit test computeGrid 13×4 in packages/core/tests/unit/grid-13x4.test.ts"
Task: "Unit test computeStats in packages/core/tests/unit/stats.test.ts"
Task: "Integration test fetchContributions in packages/core/tests/integration/fetch.test.ts"

# Launch core implementation together:
Task: "Implement fetchContributions in packages/core/src/fetch.ts"
Task: "Implement computeGrid in packages/core/src/grid.ts"
Task: "Implement computeStats in packages/core/src/stats.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (core fetch/stats/grid + react SVG render)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (core + react)
   - Developer B: User Story 2 (CLI) — depends only on core, not react
3. Developer C: User Story 3 (demo) after US1's react component exists

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing (TDD — constitution Principle III, NON-NEGOTIABLE)
- Maintain >90% line and branch coverage per package (constitution Principle IV)
- Use conventional commits (constitution Principle V)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence

---

## Phase 7: Convergence

**Purpose**: Close the gap between the spec/plan/tasks and the current code, as identified by `/speckit.converge`.

- [X] T075 Add a CLI bin bootstrap entry point in `packages/cli/src/cli.ts` so the published `github-contribution-chart` bin actually runs (invoke `main(process.argv)` — or equivalent `import.meta` guard) and prints help/output when run directly via `node dist/cli.js`, per FR-015/US2/AC1 (missing)
- [X] T076 Add a configurable date-range control (e.g. days-back or from/to selector) to the demo site, wired through `demo/src/config-panel.tsx` → `demo/src/app.tsx` → `demo/src/preview.tsx`, replacing the hardcoded 366-day window in `preview.tsx`, per FR-020/US3/AC (partial)
- [X] T077 Add a "Copy code" button to `demo/src/app.tsx` that copies the install command and JSX snippet to the clipboard (via `navigator.clipboard`), per FR-022/US3/AC4 (partial)