# Implementation Plan: GitHub Contribution Charts Library

**Branch**: `001-github-contribution-charts` | **Date**: 2026-08-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-github-contribution-charts/spec.md`

## Summary

Build a three-package TypeScript monorepo that lets developers fetch GitHub contribution data via the authenticated GraphQL API, compute derived statistics and custom grid layouts (N×7 daily, 13×4 weekly-aggregated), and render the result as SVG (React component), PNG (CLI via `sharp`), or text (CLI). A Vite + React demo site deployed to GitHub Pages lets visitors configure and preview charts interactively. Published to npm under MIT.

## Technical Context

**Language/Version**: TypeScript 5.8+ (strict mode), targeting Node.js 24+ (LTS/Krypton)

**Primary Dependencies**:
- **Core**: `@octokit/graphql` 9.x (GitHub GraphQL client)
- **React**: `react` 19.x, `react-dom` 19.x
- **CLI/PNG**: `sharp` 0.35.x (SVG-to-PNG conversion via libvips)
- **CLI framework**: `commander` 15.x
- **Monorepo**: `pnpm` 11.x workspaces + `turbo` 2.x task orchestration
- **Testing**: `vitest` 4.x (unit + functional), `@vitejs/plugin-react` 6.x
- **Demo site**: `vite` 8.x + `react` 19.x

**Storage**: N/A (no persistent storage — stateless data fetching and rendering)

**Testing**: Vitest 4.x with `@vitest/coverage-v8` for coverage. Integration tests use recorded/snapshotted GraphQL responses to avoid live API calls in CI. PNG output tested via sharp metadata checks and pixel-diff tolerance.

**Target Platform**: Node.js 24+ server/CLI for core and CLI packages. Modern browsers (ES2022+) for the React component and demo site.

**Project Type**: Monorepo — 3 npm packages + 1 demo app (not published)

**Performance Goals**: CLI PNG generation <10s for a full year (366 days). React component renders within one frame (16ms) for typical grid sizes. GraphQL query response deserialization <50ms for 1-year data.

**Constraints**: Zero unauthenticated HTTP requests. Token never logged/persisted. ESM-only. Exact-version dependencies pinned to latest. MIT license. No scraping.

**Scale/Scope**: Single user's contribution data, max 366 days per query. Grids up to ~53×7 cells. 3 packages, ~25 functional requirements.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Monorepo with Separable Packages | PASS | Three packages (`core`, `react`, `cli`) + demo site in pnpm workspaces. Each has a single responsibility. |
| II. TypeScript Mandatory | PASS | All code in strict-mode TypeScript. No `any` expected in public API. |
| III. Test-First / TDD (NON-NEGOTIABLE) | PASS | All feature code will be preceded by failing tests. Vitest configured for Red-Green-Refactor. |
| IV. Quality Gates (>90% coverage) | PASS | Coverage target configured. Functional tests per package. Integration tests for GraphQL fetch, PNG pipeline, and cross-package contracts. |
| V. Versioning & Automated Publishing | PASS | release-please with `include-component-in-tag: false` + `node-workspace` plugin. npm publish gated in CI. |
| VI. Living Documentation | PASS | Each package gets a README. Root README states SpecKit + OpenCode usage. Demo site documents all config options. TSDoc on public API. CLI `--help` maintained. |
| Technical Standards | PASS | Node 24+, ESM, pnpm, exact-version deps pinned to latest, MIT. |

**Post-design re-check**: All gates remain PASS after Phase 1 design. No violations or deviations.

## Project Structure

### Documentation (this feature)

```text
specs/001-github-contribution-charts/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── core-api.md      # Public API contract for @wearelunatic/github-contrib-charts
│   ├── react-api.md     # Public API contract for @wearelunatic/github-contrib-charts-react
│   └── cli-api.md       # Public API contract for @wearelunatic/github-contrib-charts-cli
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── core/
│   ├── src/
│   │   ├── index.ts            # Public API entry
│   │   ├── fetch.ts            # GraphQL client + contributionsCollection query
│   │   ├── grid.ts             # Grid layout computation (N×7, 13×4)
│   │   ├── stats.ts            # Derived statistics computation
│   │   └── types.ts            # Shared types (ContributionDay, ContributionGrid, etc.)
│   └── tests/
│       ├── unit/
│       │   ├── grid.test.ts
│       │   ├── stats.test.ts
│       │   └── types.test.ts
│       ├── integration/
│       │   └── fetch.test.ts   # Against recorded/snapshotted API responses
│       └── functional/
│           └── core-api.test.ts
├── react/
│   ├── src/
│   │   ├── index.ts            # Public API entry
│   │   ├── chart.tsx           # SVG heatmap chart component
│   │   ├── shapes.tsx          # Cell shape renderers (circle, square, rounded-rect)
│   │   ├── theme.ts            # Colour theme definitions and mapping
│   │   └── tooltip.tsx         # Hover tooltip component
│   └── tests/
│       ├── unit/
│       │   ├── chart.test.tsx
│       │   ├── shapes.test.tsx
│       │   └── theme.test.ts
│       └── functional/
│           └── react-api.test.tsx
├── cli/
│   ├── src/
│   │   ├── index.ts            # Public Node API entry
│   │   ├── cli.ts              # Commander-based CLI definition
│   │   ├── render-text.ts      # Text output formatter
│   │   └── render-png.ts       # SVG → PNG via sharp
│   └── tests/
│       ├── unit/
│       │   ├── cli.test.ts
│       │   ├── render-text.test.ts
│       │   └── render-png.test.ts
│       └── functional/
│           └── cli-api.test.ts
demo/
├── src/
│   ├── main.tsx                # Vite entry
│   ├── app.tsx                 # Demo site layout
│   ├── config-panel.tsx         # Interactive controls
│   ├── preview.tsx              # Live chart preview
│   └── code-snippet.tsx         # Copy-paste snippet generator
└── tests/
    └── functional/
        └── demo.test.tsx
```

**Structure Decision**: Monorepo with pnpm workspaces + Turborepo. Three `packages/` published to npm, one `demo/` app deployed to GitHub Pages (not published). Each package has `src/` and `tests/` with unit, integration, and functional test directories. Root-level config: `pnpm-workspace.yaml`, `turbo.json`, `release-please-config.json`.

## Complexity Tracking

> No constitution violations. No complexity justifications needed.
