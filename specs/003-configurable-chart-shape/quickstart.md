# Quickstart: Configurable Rectangular Chart Shape

Validation scenarios proving the feature end-to-end. Map each scenario to its spec success criterion.

## Prerequisites

- Node.js ≥ 24, pnpm (workspace root)
- `GITHUB_TOKEN` env var set for live-fetch scenarios (mocked otherwise)

## Setup

```bash
pnpm install
pnpm build          # turbo run build
```

## Scenario 1 — Default is 7×52 (SC-002)

```bash
pnpm --filter @wearelunatic/github-contrib-charts test -- tests/unit/grid-custom.test.ts -t "default"
```

Expected: omitting all options resolves to a week-aligned grid with 7 rows and 52 columns; existing default-window tests updated to 364 days pass.

## Scenario 2 — Custom geometry renders exactly R×C (SC-001)

```bash
pnpm --filter @wearelunatic/github-contrib-charts test -- tests/unit/grid-custom.test.ts
```

Expected: `{shape:'rectangular', rows:4, columns:30}` yields 4×30 = 120 day-cells, column-major GH style (`idx=col*rows+row`, bottom-right pinned), latest date at bottom-right; 1×52 and 52×1 extremes pass; young-account padding produces NONE-level leading cells.

## Scenario 3 — Validation & fail-fast (SC-005)

```bash
pnpm --filter @wearelunatic/github-contrib-charts test -- tests/unit/grid-edge-cases.test.ts tests/functional/core-api.test.ts
```

Expected: RangeErrors for zero/negative/non-integer dimensions, product > 366, and `days` + rows/columns conflicts; no fetch invoked when validation fails (functional black-box assertions).

## Scenario 4 — CLI output matches configuration

```bash
packages/github-contrib-charts/dist/bin.js --rows 4 --columns 30 --format text   # mocked/local data path per CLI docs
```

Expected: exactly 4 text lines of 30 cell characters; PNG variant (`--format png`) writes an image whose size scales to the 4×30 grid. Conflict cases exit non-zero:

```bash
packages/github-contrib-charts/dist/bin.js --rows 4 --days 90   # → error listing mutually exclusive options
packages/github-contrib-charts/dist/bin.js --size 10            # → error: square removed per FR-017, use --rows 10 --columns 10
```

Automated coverage: `tests/cli/unit/grid-config.test.ts`, `render-text.test.ts`, `render-png.test.ts`, functional `cli-api.test.ts`.

## Scenario 5 — React props & demo snippet (SC-003, SC-004)

```bash
pnpm --filter @wearelunatic/github-contrib-charts test -- tests/unit/ui-types.test.ts
pnpm --filter demo dev        # open printed localhost URL
```

Demo checks: select Rectangular, set Rows=4 / Columns=30 → preview shows 4×30 within 500 ms; snippet reads `<ContributionChart shape="rectangular" rows={4} columns={30} />`; switching back to defaults restores 7×52.

## Scenario 6 — No regressions (SC-006)

```bash
pnpm --filter @wearelunatic/github-contrib-charts test
pnpm --filter @wearelunatic/github-contrib-charts test:coverage
```

Expected: full suite green; legacy `days`-based rectangular and deprecated layout tests unmodified-and-passing (square removed per FR-017 — 7×7 now via `rows:7, columns:7`); coverage ≥ 90% line and branch.

## Data model / contracts references

- Configuration precedence and normalized shapes: [data-model.md](./data-model.md)
- Full public surface and error contract: [contracts/api.md](./contracts/api.md)
- Design rationale: [research.md](./research.md)
