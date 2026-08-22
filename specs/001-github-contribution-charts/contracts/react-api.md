# Contract: @wearelunatic/github-contrib-charts-react — Public API

**Package**: `@wearelunatic/github-contrib-charts` (root entry — 2026-08-22 consolidation merged core+react+cli into one package)
**Version**: 1.0.0 (target)
**Type**: React component library
**Peer dependency**: `@wearelunatic/github-contrib-charts`, `react` >=19, `react-dom` >=19

## Exports

### `<ContributionChart />`

Primary React component. Fetches data (when `autoFetch` is true) and renders an SVG heatmap.

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `username` | `string` | Yes | — | GitHub username. |
| `token` | `string` | Yes (if `autoFetch`) | — | GitHub PAT. Not rendered in DOM. |
| `data` | `ContributionDay[]` | Yes (if `!autoFetch`) | — | Pre-fetched data. Bypasses internal fetch. |
| `autoFetch` | `boolean` | No | `true` | When true, fetches via `@wearelunatic/github-contrib-charts` using `token`. When false, uses provided `data`. |
| `gridLayout` | `GridLayoutConfig` | No | `{ type: "n-by-7", weeks: 52 }` | Layout strategy. |
| `cellShape` | `"circle" \| "square" \| "rounded-rect"` | No | `"square"` | Cell shape. |
| `colorTheme` | `ThemePreset \| ColorStop[]` | No | `"github-light"` | Color theme. |
| `dateRange` | `DateRange` | No | Last 365 days | Date range (when `autoFetch`). |
| `title` | `string` | No | — | Optional chart title. |
| `showLegend` | `boolean` | No | `true` | Show/hide contribution-level legend. |
| `showStats` | `boolean` | No | `true` | Show/hide derived statistics panel. |
| `onCellClick` | `(cell: GridCell) => void` | No | — | Click handler per cell. |
| `className` | `string` | No | — | CSS class for the root SVG element. |
| `style` | `CSSProperties` | No | — | Inline styles for the root SVG element. |

**Behavior**:
- Renders a responsive SVG that fills its container. Cell sizes scale proportionally.
- Tooltips appear on hover/touch showing date and contribution count.
- When `autoFetch` is true, displays a loading skeleton while fetching, and an error state on failure.
- When `autoFetch` is false, renders immediately from `data`. No loading state.

**Error states**:
- Authentication failure: displays "Invalid token" message.
- User not found: displays "User not found: {username}".
- Rate limited: displays "Rate limited. Try again at {resetAt}".
- Network error: displays "Failed to reach GitHub. Check your connection."
- Empty data (all zeros): renders full grid with all cells at level 0. No error.

### `<ContributionStats />`

Standalone stats panel (usable outside the chart).

**Props**:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `stats` | `ContributionStats` | Yes | Stats data from `@wearelunatic/github-contrib-charts`. |

**Renders**: Total contributions, breakdown by type (commits/PRs/issues/reviews), and PR review percentage. Responsive layout.

### Type Exports

```typescript
export type {
  ThemePreset,             // "github-light" | "github-dark"
  ColorStop,               // { level: ContributionLevel, color: string }
  CellShape,               // "circle" | "square" | "rounded-rect"
}
```

Re-exports all types from `@wearelunatic/github-contrib-charts` (for convenience — consumers can import everything from `@wearelunatic/github-contrib-charts-react` without separately importing `@wearelunatic/github-contrib-charts`).

## Contract Stability

- MAJOR: Breaking prop changes, removed components, type changes in return types.
- MINOR: New components, new optional props, new theme presets.
- PATCH: Bug fixes, internal refactors, documentation updates.
