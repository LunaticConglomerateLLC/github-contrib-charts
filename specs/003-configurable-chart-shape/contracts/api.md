# Contracts: Configurable Rectangular Chart Shape

**Branch**: `003-configurable-chart-shape` | **Date**: 2026-08-26

Public surfaces exposed by this feature. Signatures are contracts, not implementations.

## 1. Library API (root entry `@wearelunatic/github-contrib-charts`)

### 1.1 Configuration type (types.ts)

```ts
/** Rectangular variant — extended. */
{
  shape: 'rectangular';
  /** Week-aligned legacy window (1–366). Mutually exclusive with rows/columns. */
  days?: number;
  /** Custom grid height (integer ≥ 1). Default 7 when only columns given. */
  rows?: number;
  /** Custom grid width (integer ≥ 1). Default 52 when only rows given. */
  columns?: number;
}
```

New exported constants: `MIN_ROWS = 1`, `MIN_COLUMNS = 1`, `DEFAULT_ROWS = 7`, `DEFAULT_COLUMNS = 52`; `DEFAULT_DAYS` changes 365 → **364**.

### 1.2 Normalized shape config (internal, exported for typing)

```ts
// Square removed per FR-017 — rectangular-only (7×7 via rows==columns).
type NormalizedShapeConfig =
  | { shape: 'rectangular'; geometry: 'weeks'; days: number }
  | { shape: 'rectangular'; geometry: 'custom'; rows: number; columns: number }
```

### 1.3 Behavioural contract

| Operation | Contract |
|-----------|----------|
| `resolveShapeConfig({shape:'rectangular', ...})` | Applies precedence (custom > weeks > defaults); throws RangeError on conflicts/invalid values |
| `shapeDayCount(config)` | Returns `days` (weeks path) or `rows × columns` (custom path) |
| `displayWindow(config, anchor)` | Window spans exactly the day count above, ending at anchor UTC midnight (`to` exclusive) |
| `computeGrid(days, {rows,c})` | Rectangular-only grid of exactly `rows × c` cells; column-major GH week style (`idx=col*rows+row`), bottom-right pinned, column-wise transpose on resize; earliest top-left populated, latest bottom-right; missing history padded with `{date:null, count:0, level:'NONE'}` cells at the earliest positions |
| `fetchContributions(...)` | Rectangular-only; fetches the derived window; explicit `dateRange` override must still cover exactly `rows × columns` days or throws RangeError |

**Error contract** (all thrown synchronously before any network call):

```text
RangeError: "rows must be an integer between 1 and <product-derived bound>"
RangeError: "columns must be an integer between 1 and <product-derived bound>"
RangeError: "rows * columns must not exceed 366 days"
RangeError: "'days' cannot be combined with 'rows'/'columns'; use one or the other"
RangeError: "shape 'square' is no longer supported — use rows==columns (FR-017)"
RangeError: "'size' is no longer supported — use rows/columns (FR-017)"
```

## 2. React component props (ui-types.ts)

```ts
// Rectangular-only per FR-017 — square/size removed (7×7 via rows==columns).
interface ChartConfig {
  /* existing fields unchanged (square/size removed) */
  shape?: 'rectangular';
  days?: number;
  /** Custom rectangular height (≥1). */
  rows?: number;
  /** Custom rectangular width (≥1). */
  columns?: number;
}

toShapeConfig(): passes rows/columns through for rectangular (sole shape).
```

Rendered SVG contains exactly `columns` cell-columns and `rows` cell-rows; tooltips/legend behave identically to default geometry.

## 3. CLI (bin entry)

New flags:

```text
--rows <n>       custom rectangular grid height (≥1)
--columns <n>    custom rectangular grid width (≥1)
```

Resolution rules:

| Invocation                                        | Result / Error |
|---------------------------------------------------|----------------|
| `--rows 4 --columns 30`                           | rectangular custom 4×30 (fetches 120 days) |
| `--columns 26`                                    | rectangular custom 7×26 |
| `--rows 4`                                        | rectangular custom 4×52 (columns defaults 52) |
| `--rows 4 --days 90`                              | **error**: mutually exclusive options listed |
| `--size 10` / `--rows 4 --size 10`                | **error**: 'size' is no longer supported — use `rows`/`columns` (`rows==columns` for squares) per FR-017 |
| `shape:'square'` / `--geometry square`            | **error**: square shape removed per FR-017 — use `rows==columns` (e.g., 7×7 via `--rows 7 --columns 7`) |
| no flags                                          | default week-aligned 7×52 year view |

Text output prints exactly `rows` lines; PNG pixel dimensions scale with `rows`/`columns`. `--help` documents defaults, bounds, and exclusivity.

## 4. Demo site

- Rectangular mode shows numeric **Rows** and **Columns** controls (defaults 7 / 52).
- Changing any control updates the preview within 500 ms and regenerates the copyable snippet, e.g. `<ContributionChart shape="rectangular" rows={4} columns={30} />`.
- Snippet reflects exactly the rendered configuration (single source of truth).

## 5. Documentation contract (Constitution VI)

Same-changeset updates required: root README + package README option tables, TSDoc on all new fields/constants, CLI `--help` text, demo usage descriptions.
