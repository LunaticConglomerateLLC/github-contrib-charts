# Data Model: GitHub Contribution Charts

**Phase**: 1 — Design & Contracts
**Date**: 2026-08-16

## Entities

### ContributionDay

A single day's contribution data as returned by the GitHub GraphQL API after normalisation.

| Field | Type | Description |
|-------|------|-------------|
| `date` | `Date` | Calendar date (midnight UTC). Unique key per day. |
| `contributionCount` | `number` | Total number of contributions for this day (all types combined). |
| `contributionLevel` | `ContributionLevel` | Pre-computed intensity tier from GitHub: `NONE` (0), `FIRST_QUARTILE` (1), `SECOND_QUARTILE` (2), `THIRD_QUARTILE` (3), `FOURTH_QUARTILE` (4). |
| `commitCount` | `number` | Commits authored on this day. Derived from `commitContributionsByRepository`. |
| `pullRequestCount` | `number` | PRs opened on this day. Derived from `pullRequestContributions`. |
| `issueCount` | `number` | Issues opened on this day. Derived from `issueContributions`. |
| `reviewCount` | `number` | PR reviews submitted on this day. Derived from `pullRequestReviewContributions`. |

**Validation**: `contributionCount` MUST be >= 0. `contributionLevel` MUST be one of the five `ContributionLevel` values. Date MUST be a valid, non-future calendar date. Type breakdowns (`commitCount` + `pullRequestCount` + `issueCount` + `reviewCount`) MAY sum to less than or equal to `contributionCount` (GitHub may include additional categories under "total").

### ContributionGrid

A computed matrix of cells organised by a grid layout strategy. Returned by `computeGrid()` in the core package.

| Field | Type | Description |
|-------|------|-------------|
| `cells` | `GridCell[][]` | 2D array of cells: `cells[row][col]`. Row 0 = top, Column 0 = left. Chronological order left-to-right, top-to-bottom. |
| `rows` | `number` | Number of rows in the grid. |
| `columns` | `number` | Number of columns in the grid. |
| `layout` | `GridLayout` | The layout strategy used: `"n-by-7"` or `"13-by-4"`. |
| `totalContributions` | `number` | Sum of all cell contribution counts. |

#### GridCell

| Field | Type | Description |
|-------|------|-------------|
| `date` | `Date` or `null` | The date this cell represents (null for trailing empty cells). |
| `dateRange` | `{ from: Date, to: Date }` or `null` | For aggregated cells (13×4), the week range this cell covers. |
| `contributionCount` | `number` | Total contributions for this cell's date(s). 0 for empty cells. |
| `contributionLevel` | `ContributionLevel` | Intensity level for visual mapping. Computed from `contributionCount` relative to the grid's distribution. |

**Grid layout semantics**:
- **N×7**: Each column = one week (Sunday–Saturday). Each row = one day of the week (row 0 = Sunday). `columns` = N (number of weeks), `rows` = 7. Each cell maps to exactly one `ContributionDay`.
- **13×4**: 52 weeks condensed into 13 columns × 4 rows. Each column = one week. Each row = one quarter (row 0 = Q1, weeks 1–13; row 1 = Q2, weeks 14–26; etc.). Each cell aggregates 7 days into one `contributionCount`.

**Validation**: `cells.length` MUST equal `rows`. Every row in `cells` MUST have length equal to `columns`. Total cells MUST equal `rows × columns`.

### ContributionStats

Aggregate statistics computed from a collection of `ContributionDay` data. Returned by `computeStats()`.

| Field | Type | Description |
|-------|------|-------------|
| `totalContributions` | `number` | Sum of all `contributionCount` values across all days. |
| `totalCommits` | `number` | Sum of all `commitCount` values. |
| `totalPullRequests` | `number` | Sum of all `pullRequestCount` values. |
| `totalIssues` | `number` | Sum of all `issueCount` values. |
| `totalReviews` | `number` | Sum of all `reviewCount` values. |
| `pullRequestReviewPercentage` | `number` | `(totalReviews / totalContributions) * 100`. Rounded to 1 decimal place. 0 if `totalContributions` is 0. |
| `activeDays` | `number` | Number of days where `contributionCount > 0`. |
| `dateRange` | `{ from: Date, to: Date }` | The span of dates covered by these stats. |

**Validation**: All count fields MUST be >= 0. `pullRequestReviewPercentage` MUST be in range [0, 100]. `activeDays` MUST be <= number of days in `dateRange`.

### ChartConfig

User-facing configuration passed to the rendering layer (React component, CLI, or demo site).

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `username` | `string` | *(required)* | GitHub username to fetch data for. |
| `token` | `string` | *(required)* | GitHub personal access token. |
| `gridLayout` | `{ type: "n-by-7" \| "13-by-4", weeks?: number }` | `{ type: "n-by-7", weeks: 52 }` | Grid layout strategy. `weeks` only applies to `n-by-7`. |
| `cellShape` | `"circle" \| "square" \| "rounded-rect"` | `"square"` | Shape of each cell in the chart. |
| `colorTheme` | `ThemePreset \| ColorStop[]` | `"github-light"` | Built-in theme name or custom color stops. |
| `dateRange` | `{ from: Date, to: Date }` | Last 365 days | Date range for data. Max 366 days. |
| `title` | `string` | *(none)* | Optional chart title. |
| `showLegend` | `boolean` | `true` | Whether to render a contribution-level legend. |

#### ThemePreset

`"github-light"` | `"github-dark"` — built-in colour themes matching GitHub's own palette.

#### ColorStop

`{ level: ContributionLevel, color: string }` — maps a contribution intensity level to a hex colour string (e.g., `"#ebedf0"` for level 0, up to `"#216e39"` for level 4).

## State Transitions

This is a stateless rendering library — no persistent state. The data flow is:

```text
ChartConfig → fetchContributions(token, username, dateRange) → ContributionDay[]
  ├─→ computeStats(days) → ContributionStats
  └─→ computeGrid(days, gridConfig) → ContributionGrid
                                                  ↓
                              render(Grid, Stats, Config) → SVG | PNG | Text
```

## Cross-Package Dependencies

```text
@scope/cli ──→ @scope/core (fetch + stats + grid)
            ──→ SVG renderer (text-based for now, PNG via sharp)

@scope/react ──→ @scope/core (fetch + stats + grid)

demo ──→ @scope/react (component)
     ──→ @scope/core (config types)
```
