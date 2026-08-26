# Data Model: Custom Chart Layouts (Rectangular & Square)

**Phase**: 1 — Design & Contracts
**Date**: 2026-08-25

## Entities

### ContributionDay (unchanged)

A single day's contribution data returned by the GitHub GraphQL API after normalization. No changes for this feature.

| Field | Type | Description |
|-------|------|-------------|
| `date` | `Date` | Calendar date (midnight UTC). Unique key per day. |
| `contributionCount` | `number` | Total contributions for this day (all types combined). |
| `contributionLevel` | `ContributionLevel` | Pre-computed intensity tier from GitHub: `NONE` / `FIRST_QUARTILE` / `SECOND_QUARTILE` / `THIRD_QUARTILE` / `FOURTH_QUARTILE`. |
| `commitCount` | `number` | Commits authored on this day. |
| `pullRequestCount` | `number` | PRs opened on this day. |
| `issueCount` | `number` | Issues opened on this day. |
| `reviewCount` | `number` | PR reviews submitted on this day. |

**Validation**: `contributionCount >= 0`. `contributionLevel` ∈ 5 enum values. Date is valid, not future. Type breakdowns may sum to ≤ `contributionCount`.

---

### ChartShapeConfig (new, replaces/extends GridLayoutConfig)

Union configuration selecting chart geometry. Replaces the prior `GridLayoutConfig` (`n-by-7` / `13-by-4`) as the preferred API; old variants are retained as deprecated aliases that adapter-map to the new shapes.

```ts
type ChartShapeConfig =
  | { shape: 'rectangular'; days: number }   // default days = 365
  | { shape: 'square'; size: number }        // e.g. 10 → 10×10 = 100 days
  // Deprecated aliases (adapter-mapped, @deprecated):
  | { type: 'n-by-7'; weeks: number }        // → rectangular days = weeks*7
  | { type: '13-by-4'; weeks?: number }     // → kept or mapped
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `shape` | `'rectangular' \| 'square'` | `'rectangular'` | Chart geometry selector. |
| `days` | `number` | `365` | Rectangular only: number of days of history (1–366). Columns = `ceil(days/7)`. |
| `size` | `number` | `10` | Square only: side length N (1–19). Displays N×N = N² days. |

**Validation**:
- `shape` MUST be one of `'rectangular'`, `'square'` (deprecated `'n-by-7'`, `'13-by-4'` via `type` discriminator accepted with deprecation warning).
- `days` MUST be integer ∈ [1, 366]; else `RangeError` with field name and valid range.
- `size` MUST be integer ∈ [1, 19]; else `RangeError` with field name and valid range. Max derived from `floor(sqrt(366))`.
- Supplying the non-applicable dimension (e.g., `days` when `shape='square'`) is ignored or triggers a validation error if both are non-default.

---

### ContributionGrid (refined)

Computed matrix returned by `computeGrid(days, shapeConfig)`.

| Field | Type | Description |
|-------|------|-------------|
| `cells` | `GridCell[][]` | 2D array `cells[row][col]`. Row 0 = top, Col 0 = left. Chronological order shape-specific (see below). |
| `rows` | `number` | Number of rows. 7 for rectangular, N for square. |
| `columns` | `number` | Number of columns. `ceil(days/7)` for rectangular, N for square. |
| `layout` | `'rectangular' \| 'square'` (plus deprecated `'n-by-7' \| '13-by-4'` values when old config used) | Layout discriminator used for rendering branch. |
| `totalContributions` | `number` | Sum of `contributionCount` across all cells (excludes padded empty cells' zeros, but they contribute 0 anyway). |

#### GridCell (unchanged structure, refined semantics)

| Field | Type | Description |
|-------|------|-------------|
| `date` | `Date \| null` | Calendar date this cell represents, or `null` for padded/empty cells before the window start or missing data. |
| `dateRange` | `{ from: Date, to: Date } \| null` | Always `null` for the new modes (each cell = one day). Retained as `null` for forward compat; aggregated week ranges only apply to deprecated `13-by-4`. |
| `contributionCount` | `number` | Contributions for this cell's date, 0 for empty. |
| `contributionLevel` | `ContributionLevel` | Quartile level computed via `levelFor(count, windowMax)`. |

**Grid semantics**:
- **Rectangular** (`days=D`): `rows=7`, `columns=ceil(D/7)`, `rows×columns >= D` cells. Sunday-aligned: `row=weekday` (0=Sun top), `col=week index` (0=earliest). Anchored so most recent Sunday-aligned week ends at bottom-right. Ordering is column-major weeks: `date = sundayOfWindow + col*7 + row`. When `D % 7 != 0`, the first `rows*columns - D` cells at the top of `col=0` are padded `NONE`.
- **Square** (`size=N`): `rows=N`, `columns=N`, `rows×columns = N²` cells. No weekday alignment. Row-major: `cells[r][c]` maps to `windowStart + r*N + c` days offset. `cells[0][0]` = earliest, `cells[N-1][N-1]` = most recent.

**Validation**: `cells.length === rows`, each `cells[r].length === columns`, total cells `=== rows*columns`. Each cell's `contributionLevel` computed from window max (0 → all `NONE`).

---

### ContributionStats (unchanged)

Aggregate statistics computed by `computeStats(days)`. Input is always the filtered window (`days` or `N²` days). No shape-specific change.

| Field | Type | Description |
|-------|------|-------------|
| `totalContributions` | `number` | Sum of `contributionCount` in window. |
| `totalCommits` | `number` | Sum of `commitCount`. |
| `totalPullRequests` | `number` | Sum of `pullRequestCount`. |
| `totalIssues` | `number` | Sum of `issueCount`. |
| `totalReviews` | `number` | Sum of `reviewCount`. |
| `pullRequestReviewPercentage` | `number` | `(totalReviews / totalContributions)*100`, 1 decimal, 0 if total 0. |
| `activeDays` | `number` | Days with `contributionCount > 0` in window. |
| `dateRange` | `{ from: Date, to: Date }` | Window span (`from` inclusive midnight UTC, `to` exclusive next day after most recent). |

---

### ChartConfig (refined)

User-facing rendering config (React props, CLI resolved options, demo state). Supersedes `gridLayout: GridLayoutConfig`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `username` | `string` | *(required)* | GitHub username. |
| `token` | `string` | *(required)* | GitHub PAT. |
| `shape` | `'rectangular' \| 'square'` | `'rectangular'` | Geometry selector (preferred). Deprecated: `gridLayout` alias accepted. |
| `days` | `number` | `365` | Rectangular window length; ignored when `shape='square'`. |
| `size` | `number` | `10` | Square side N; ignored when `shape='rectangular'`. |
| `gridLayout` | `GridLayoutConfig` (deprecated) | — | Legacy alias; adapter-mapped to `shape/days/size`. |
| `cellShape` | `'circle' \| 'square' \| 'rounded-rect'` | `'square'` | Cell glyph shape (orthogonal to grid geometry). |
| `colorTheme` | `ThemePreset \| ColorStop[]` | `'github-light'` | Colour mapping. |
| `dateRange` | `{ from: Date, to: Date }` | Derived from `shape`/`days`/`size` (last D days) | Explicit override; validated against shape window if both provided. |
| `title` | `string` | *(none)* | Optional chart title. |
| `showLegend` | `boolean` | `true` | Legend toggle. |

#### ThemePreset / ColorStop (unchanged)

- `ThemePreset`: `'github-light' | 'github-dark'`
- `ColorStop`: `{ level: ContributionLevel, color: string }`

---

### DisplayWindow (derived, not persisted)

Computed from shape config, used by `fetch.ts` and stats.

```ts
function displayWindow(shape: ChartShapeConfig, anchor: Date): DateRange
// rectangular: { from: anchor - (days-1) days, to: anchor + 1 day }
// square:      { from: anchor - (size*size-1) days, to: anchor + 1 day }
```

Anchored at `anchor = last ContributionDay.date` or `today` if no data. UTC midnight boundaries.

---

## State Transitions

Stateless rendering library — no persistent state. Data flow after this feature:

```text
ChartShapeConfig (shape + days/size) ─┐
                                      ├─→ displayWindow(anchor) → DateRange → fetchContributions(token, username, range) → ContributionDay[]
ChartConfig (shape/days/size/...) ────┘                                              ├─→ computeStats(filtered window) → ContributionStats
                                                                                     └─→ computeGrid(filtered window, ChartShapeConfig) → ContributionGrid
                                                                                                                                      ↓
                                                                                                              render(Grid, Stats, Config) → SVG | PNG | Text
```

Filtering: fetched days are filtered to the window (or padded if fewer days returned than window length) before `computeGrid`/`computeStats`.

## Cross-Package Dependencies

Single package `@wearelunatic/github-contrib-charts` with internal modules:

```text
fetch.ts ──→ types.ts (ContributionDay, DateRange)
grid.ts  ──→ types.ts (ChartShapeConfig, ContributionGrid, GridCell, levelFor)
stats.ts ──→ types.ts
chart.tsx ──→ grid.ts, stats.ts, theme.ts, shapes.tsx, types.ts
cli/*    ──→ fetch.ts, grid.ts, stats.ts, types.ts, chart.tsx (for SVG source), theme.ts
demo     ──→ chart.tsx, types.ts
```
