# Data Model: Configurable Rectangular Chart Shape

**Branch**: `003-configurable-chart-shape` | **Date**: 2026-08-26 | **Spec**: [spec.md](./spec.md)

## Entities

### ChartShapeConfig (extended union — public API)

Rectangular variant gains two optional fields; square variant removed per FR-017 (rectangular rows==columns replicates 7×7 square, shape 'square' rejected). Legacy GridLayoutConfig remains deprecated/unchanged.

```text
ChartShapeConfig =
  | { shape: 'rectangular'; days?: number; rows?: number; columns?: number }
  | GridLayoutConfig (legacy, deprecated)
```

**Validation rules** (rectangular variant):

| Field    | Rule                                                            | Error |
|----------|-----------------------------------------------------------------|-------|
| `rows`   | integer ≥ 1 when present                                        | RangeError naming `rows` |
| `columns`| integer ≥ 1 when present                                        | RangeError naming `columns` |
| combined | `rows × columns ≤ 366` when both/either present                 | RangeError citing max window |
| combined | `days` absent whenever `rows` or `columns` present              | RangeError listing alternatives (FR-006) |
| `days`   | existing rule: integer in [1, 366] (week-aligned path)          | unchanged |

Square variant removed per FR-017 breaking: `{ shape:'square', size }` / `size` is rejected (use `rows==columns`).

### NormalizedShapeConfig (extended union — internal, rectangular-only)

```text
NormalizedShapeConfig =
  | { shape: 'rectangular'; geometry: 'weeks'; days: number }
  | { shape: 'rectangular'; geometry: 'custom'; rows: number; columns: number }
```

**Resolution state transitions** (input → normalized):

| Input (rectangular)                       | Normalized result                                   |
|-------------------------------------------|-----------------------------------------------------|
| `{}`                                      | `{ geometry:'weeks', days:364 }` → renders 7×52     |
| `{ days: n }`                             | `{ geometry:'weeks', days:n }` (unchanged)          |
| `{ columns: c }`                          | `{ geometry:'custom', rows:7, columns:c }`          |
| `{ rows: r }`                             | `{ geometry:'custom', rows:r, columns:52 }`         |
| `{ rows: r, columns: c }`                 | `{ geometry:'custom', rows:r, columns:c }`          |
| `{ days:d, rows?/columns? }`              | RangeError (conflict)                               |

Legacy layouts resolve exactly as today (`n-by-7`→weeks-days; `13-by-4`→weeks-days for windowing).

### Constants (types.ts)

| Constant         | Value | Change        |
|------------------|-------|---------------|
| `DEFAULT_DAYS`   | 365 → **364** | amended (52 full weeks ⇒ default 7×52) |
| `MIN_DAYS/MAX_DAYS` | 1 / 366   | unchanged |
| `MIN_ROWS`, `MIN_COLUMNS` | 1   | new |
| `DEFAULT_ROWS`   | 7     | new           |
| `DEFAULT_COLUMNS`| 52    | new           |

Note: `MAX_SIZE` / square `size` removed with square per FR-017. Rectangular bound is the product rule `rows × columns ≤ MAX_DAYS` ( ≤366); no separate per-dimension maximum beyond the product. 7×7 square is now `rows:7, columns:7`.

### ContributionGrid / GridCell / DisplayWindow (unchanged structures)

- `ContributionGrid`: `cells[row][col]`, `rows`, `columns`, `layout`, `totalContributions`. For custom geometries `layout = 'rectangular'` with `rows`/`columns` reflecting configuration.
- `GridCell`: one calendar day per cell; padded cells carry `date=null`, `contributionCount=0`, `contributionLevel='NONE'`.
- `DisplayWindow`: `[anchor − (span−1) days, anchor + 1 day)` where `span = days | rows×columns | size²`. Reflow on dimension change re-renders the last `rows×columns` days anchored at bottom-right column-major GH week style transposing column-wise (e.g., 7×4 28→6×4 24 with 01 pinned; 7×52=364 → 6×52=312).

### CliOptions (cli/types.ts, extended)

Adds `rows?: number; columns?: number`. Resolution precedence documented in contracts/api.md §CLI.

## Relationships

```text
CliOptions ─resolves→ ChartShapeConfig ─validates→ NormalizedShapeConfig
React ChartConfig ─toShapeConfig→ ChartShapeConfig
NormalizedShapeConfig ─shapeDayCount→ span ─displayWindow→ DateRange ─→ fetch layer
ContributionDay[] + NormalizedShapeConfig ─computeGrid→ ContributionGrid ─→ SVG/text/PNG renderers
```
