# Contract: React Component — `ContributionChart`

**Module**: `packages/github-contrib-charts/src/chart.tsx`
**Export**: `ContributionChart(props: ContributionChartProps): JSX.Element`
**Date**: 2026-08-25

## Props

```ts
interface ContributionChartProps {
  data?: ContributionDay[];           // if omitted and autoFetch=true, fetched internally
  autoFetch?: boolean;                // default true
  shape?: 'rectangular' | 'square';  // default 'rectangular'
  days?: number;                      // rectangular only, 1–366, default 365
  size?: number;                      // square only, 1–19, default 10
  // deprecated alias (maps to shape/days/size, warns):
  gridLayout?: GridLayoutConfig;      // { type: 'n-by-7', weeks } | { type: '13-by-4', weeks? }
  cellShape: CellShape;               // 'circle' | 'square' | 'rounded-rect'
  colorTheme: ThemePreset | ColorStop[];
  title?: string;
  showLegend?: boolean;               // default true
  showStats?: boolean;                // default true
  onCellClick?: (cell: GridCell) => void;
  className?: string;
  style?: CSSProperties;
}
```

**Validation**: `days` and `size` validated via `computeGrid`; invalid values throw `RangeError` which the component surfaces as an error boundary or descriptive fallback UI (or re-throws for caller to catch). `shape` validated similarly.

**Backwards compat**: If `gridLayout` is provided and `shape` is not, it is adapter-mapped to `shape/days` (e.g., `n-by-7 weeks=4 → shape=rectangular days=28`; `13-by-4` preserved). If both are provided, `shape/days/size` wins and a dev warning is emitted.

## Rendering

- **Rectangular**: `rows=7`, `columns=ceil(days/7)`, SVG `width = columns*(CELL_SIZE+GAP)+GAP`, `height = rows*(CELL_SIZE+GAP)+GAP + legend` (if shown). Each `<CellShapeRenderer>` at `(col*(size+gap), row*(size+gap))`. Row 0 = Sunday.
- **Square**: `rows=size`, `columns=size`, SVG dimensions analogously `size*(CELL_SIZE+GAP)+GAP`. Cells at row-major positions; no weekday semantics.
- Shared: `fill = colorFor(stops, cell.contributionLevel)`. Tooltip on hover/tap shows `date` (ISO) + `contributionCount`. Legend maps 5 levels to glyphs.
- Stats panel (`<ContributionStats>`) renders from `computeStats(windowFilteredDays)` — window is `days` or `size*size` derived from props.

## Examples

```tsx
// Default rectangular (365 days)
<ContributionChart cellShape="square" colorTheme="github-light" />

// Rectangular 30 days
<ContributionChart shape="rectangular" days={30} cellShape="circle" colorTheme="github-dark" />

// Square 10×10
<ContributionChart shape="square" size={10} cellShape="square" colorTheme="github-light" title="My 100 days" />

// Deprecated compat (still works, warns)
<ContributionChart gridLayout={{ type: 'n-by-7', weeks: 4 }} cellShape="square" colorTheme="github-light" />
```

## Data Fetching

When `autoFetch=true` and `data` not provided, the component derives `DateRange` from `shape/days/size` via the same `displayWindow` logic as `fetch.ts` and calls `fetchContributions`. When `autoFetch=false`, `data` MUST be non-empty or the component throws `RangeError`.

## Accessibility

- SVG has `role="img"` and `aria-label="GitHub contribution chart"`.
- Each cell group has `data-cell` for testing; tooltip has `data-tooltip`.

## Demo Integration

`demo/src/app.tsx` holds `shape`, `days`, `size` state; `config-panel.tsx` provides segmented `shape` control and conditional `days`/`size` inputs; `code-snippet.tsx` reflects `shape/days/size` in generated JSX.

```
shape=rectangular → <ContributionChart shape="rectangular" days={30} ... />
shape=square      → <ContributionChart shape="square" size={10} ... />
```
