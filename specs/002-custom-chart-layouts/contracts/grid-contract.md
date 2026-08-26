# Contract: Grid Computation — `computeGrid`

**Module**: `packages/github-contrib-charts/src/grid.ts`
**Export**: `computeGrid(days: ContributionDay[], config: ChartShapeConfig): ContributionGrid`
**Date**: 2026-08-25

## Signature

```ts
import type { ContributionDay, ContributionGrid, ChartShapeConfig } from './types.js';

export function computeGrid(days: ContributionDay[], config: ChartShapeConfig): ContributionGrid;
```

`ChartShapeConfig` (preferred):

```ts
type ChartShapeConfig =
  | { shape: 'rectangular'; days: number }   // 1–366, default 365
  | { shape: 'square'; size: number }        // 1–19, default 10
  // deprecated aliases (adapter-mapped):
  | { type: 'n-by-7'; weeks: number }
  | { type: '13-by-4'; weeks?: number };
```

`ContributionGrid`:

```ts
interface ContributionGrid {
  cells: GridCell[][]; // cells[row][col], row 0 = top
  rows: number;
  columns: number;
  layout: 'rectangular' | 'square' | 'n-by-7' | '13-by-4';
  totalContributions: number;
}
```

## Behavior

### Rectangular (`{ shape: 'rectangular', days: D }`)

- `rows = 7`, `columns = ceil(D / 7)`.
- Cells are week-aligned: `row = weekday(Sunday=0..Saturday=6)`, `col = week index (0 earliest)`.
- Anchor: window ends at the most recent day in `days` (its Sunday-aligned week). Window is `D` days inclusive ending at that day.
- Ordering: column-major weeks, left-to-right chronological. Most recent day at bottom-right (`cells[weekday(last)][columns-1]`).
- Padding: when `D % 7 != 0`, the earliest `rows*columns - D` cells at the top of `col=0` are padded (`date=null`, `count=0`, `level=NONE`).
- If `days` empty array passed → `RangeError('days array must not be empty')`.
- If `days` not in [1,366] or non-integer → `RangeError('days must be an integer between 1 and 366')`.

### Square (`{ shape: 'square', size: N }`)

- `rows = N`, `columns = N`, `N²` days.
- Row-major: `cells[r][c]` ← `windowStart + r*N + c` days offset.
- Anchor: window is `N²` days inclusive ending at most recent day in `days`. `cells[0][0]` = earliest, `cells[N-1][N-1]` = most recent.
- If `size` not in [1,19] or non-integer → `RangeError('size must be an integer between 1 and 19')`.

### Shared

- Empty/missing dates → `count=0`, `level=NONE`, `date=null` (or implied date if within window but absent in map).
- `contributionLevel` via quartile mapping `levelFor(count, max)` where `max` is max `contributionCount` in the **window** (square) or in the **mapped days** (rectangular, includes padded zeros for level calc? max over populated days only, zeros map to NONE).
- `totalContributions` = sum over all cells' `contributionCount`.
- Deprecated configs via adapter: `n-by-7 weeks=W → rectangular days=W*7`; `13-by-4` preserved or mapped similarly with deprecation notice.

## Examples

```ts
// Rectangular: 14 days → 7×2
computeGrid(mockDays, { shape: 'rectangular', days: 14 });
// → { rows: 7, columns: 2, layout: 'rectangular', cells: 7×2 }

// Rectangular: 10 days → 7×2 with 4 padded cells at top of col 0
computeGrid(mockDays, { shape: 'rectangular', days: 10 });
// → rows=7, columns=2, cells[0][0]..cells[3][0] padded

// Square: 10×10 → 100 days
computeGrid(mockDays, { shape: 'square', size: 10 });
// → { rows: 10, columns: 10, layout: 'square' }
```

## Errors

| Condition | Error |
|-----------|-------|
| `days` empty | `RangeError: days array must not be empty` |
| `days` not int 1..366 | `RangeError: days must be an integer between 1 and 366` |
| `size` not int 1..19 | `RangeError: size must be an integer between 1 and 19` |
| Unknown `shape` | `RangeError: shape must be 'rectangular' or 'square'` |
| Deprecated `weeks` out of range | `RangeError` as per original (`weeks >=1`, `13-by-4` weeks 1..52) |

## Test Anchors

- `days=1,7,10,14,365` → verify rows/cols, padding, most-recent position.
- `size=1,7,10,19` → verify rows==cols==size, row-major ordering, most-recent at [N-1][N-1].
- Weekday alignment: rectangular `days=14` where last day is Wednesday → verify column for last week and row for Wednesday.
