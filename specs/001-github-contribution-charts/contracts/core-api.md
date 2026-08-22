# Contract: @wearelunatic/github-contrib-charts — Public API

**Package**: `@wearelunatic/github-contrib-charts`
**Version**: 1.0.0 (target)
**Type**: Framework-agnostic TypeScript library

## Exports

### `fetchContributions(token: string, username: string, dateRange: DateRange): Promise<ContributionDay[]>`

Fetches contribution data for a GitHub user over a date range using the GitHub GraphQL API.

- **token**: GitHub personal access token. Passed in `Authorization` header. Never logged or persisted.
- **username**: GitHub username (any public user, not limited to token owner).
- **dateRange**: `{ from: Date, to: Date }`. Max span: 366 days. `from` inclusive, `to` exclusive.
- **Returns**: Array of `ContributionDay` objects, one per calendar day in range. Days with no contributions have `contributionCount: 0`.
- **Errors**:
  - `AuthenticationError` — token invalid or expired.
  - `UserNotFoundError` — username does not exist.
  - `RateLimitError` — GraphQL rate limit exceeded. Includes `resetAt` timestamp.
  - `NetworkError` — connection failure or timeout.
  - `RangeError` — `dateRange` exceeds 366 days or `from` > `to`.

### `computeGrid(days: ContributionDay[], layout: GridLayoutConfig): ContributionGrid`

Computes a contribution grid matrix from daily data using the specified layout strategy.

- **days**: Array of `ContributionDay` objects (typically from `fetchContributions`).
- **layout**: `{ type: "n-by-7", weeks: number }` or `{ type: "13-by-4" }`.
  - `n-by-7`: `weeks` defines column count. Each column = one week (Sun–Sat). 7 rows = days of week.
  - `13-by-4`: Fixed 13 columns × 4 rows. Columns = weeks 1–52, rows = quarters (Q1–Q4). Each cell = one week's aggregated contributions.
- **Returns**: `ContributionGrid` with cells in chronological order (left-to-right, top-to-bottom).
- **Errors**:
  - `RangeError` — `weeks` < 1 or days array empty.

### `computeStats(days: ContributionDay[]): ContributionStats`

Computes aggregate statistics from contribution data.

- **days**: Array of `ContributionDay` objects.
- **Returns**: `ContributionStats` with totals, breakdowns, and `pullRequestReviewPercentage`.
- **Errors**:
  - `RangeError` — days array empty (returns zeroed stats, not an error).

### Type Exports

```typescript
export type {
  ContributionDay,
  ContributionLevel,       // "NONE" | "FIRST_QUARTILE" | ... | "FOURTH_QUARTILE"
  ContributionGrid,
  GridCell,
  GridLayoutConfig,
  ContributionStats,
  DateRange,
  FetchError,              // Union of error types
  AuthenticationError,
  UserNotFoundError,
  RateLimitError,
  NetworkError,
}
```

## Contract Stability

- MAJOR version bump on: breaking argument changes, removed exports, changed error types.
- MINOR version bump on: new functions, new optional fields in return types, new layout strategies added to `GridLayoutConfig`.
- PATCH version bump on: bug fixes, performance improvements, non-breaking internal refactors.
