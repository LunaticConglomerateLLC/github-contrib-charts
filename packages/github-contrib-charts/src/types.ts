/** Intensity tiers returned by the GitHub GraphQL API. */
export type ContributionLevel =
  | 'NONE'
  | 'FIRST_QUARTILE'
  | 'SECOND_QUARTILE'
  | 'THIRD_QUARTILE'
  | 'FOURTH_QUARTILE';

/** A single day's contribution data. */
export interface ContributionDay {
  /** Calendar date (UTC). Unique key per day. */
  date: Date;
  /** Total contributions for this day across all types. */
  contributionCount: number;
  /** Intensity tier from GitHub. */
  contributionLevel: ContributionLevel;
  /** Commits authored on this day. */
  commitCount: number;
  /** Pull requests opened on this day. */
  pullRequestCount: number;
  /** Issues opened on this day. */
  issueCount: number;
  /** Code reviews submitted on this day. */
  reviewCount: number;
}

/** Inclusive/exclusive date range for data fetching. */
export interface DateRange {
  /** Inclusive start date. */
  from: Date;
  /** Exclusive end date. */
  to: Date;
}

/**
 * Grid layout configuration.
 *
 * @deprecated Use {@link ChartShapeConfig} (`shape: 'rectangular' | 'square'`) instead.
 * Legacy layouts are adapted internally: `n-by-7` maps to a rectangular grid of
 * `weeks * 7` days; `13-by-4` is kept for backwards compatibility.
 */
export type GridLayoutConfig =
  | { type: 'n-by-7'; weeks: number }
  | { type: '13-by-4'; weeks?: number };

/** Bounds for the rectangular shape's day count. */
export const MIN_DAYS = 1;
export const MAX_DAYS = 366;
/** Default day count for the rectangular shape. */
export const DEFAULT_DAYS = 365;

/** Bounds for the square shape's edge size. */
export const MIN_SIZE = 1;
export const MAX_SIZE = 19;
/** Default edge size for the square shape (floor(sqrt(366))). */
export const DEFAULT_SIZE = 10;

/**
 * Shape-based grid configuration.
 *
 * - `rectangular`: 7 rows × ceil(days/7) week-aligned columns (GitHub-style).
 * - `square`: size×size row-major grid of size² days.
 * - Legacy {@link GridLayoutConfig} variants are accepted but deprecated.
 */
export type ChartShapeConfig =
  | { shape: 'rectangular'; days?: number }
  | { shape: 'square'; size?: number }
  | GridLayoutConfig;

/** A chart shape config with defaults applied and legacy aliases resolved. */
export type NormalizedShapeConfig =
  | { shape: 'rectangular'; days: number }
  | { shape: 'square'; size: number };

/** The inclusive/exclusive date window a chart shape covers. Alias of DateRange. */
export type DisplayWindow = DateRange;

/** A single cell in the computed contribution grid. */
export interface GridCell {
  /** The date this cell represents, or null for trailing empty cells. */
  date: Date | null;
  /** Week range for aggregated cells, or null for single-day cells. */
  dateRange: { from: Date; to: Date } | null;
  /** Total contributions for this cell's date(s). 0 for empty cells. */
  contributionCount: number;
  /** Intensity level for visual mapping. */
  contributionLevel: ContributionLevel;
}

/** Computed grid matrix, cells[row][col]. Row 0 = top, column 0 = left. */
export interface ContributionGrid {
  /** 2D matrix of cells, chronological left-to-right, top-to-bottom. */
  cells: GridCell[][];
  /** Number of rows. */
  rows: number;
  /** Number of columns. */
  columns: number;
  /** Layout strategy used. */
  layout: 'rectangular' | 'square' | 'n-by-7' | '13-by-4';
  /** Sum of all cell contribution counts. */
  totalContributions: number;
}

/** Aggregate statistics computed from contribution data. */
export interface ContributionStats {
  /** Sum of all contributionCount values. */
  totalContributions: number;
  /** Sum of all commitCount values. */
  totalCommits: number;
  /** Sum of all pullRequestCount values. */
  totalPullRequests: number;
  /** Sum of all issueCount values. */
  totalIssues: number;
  /** Sum of all reviewCount values. */
  totalReviews: number;
  /** (totalReviews / totalContributions) * 100, rounded to 1 decimal. 0 if totalContributions is 0. */
  pullRequestReviewPercentage: number;
  /** Number of days where contributionCount > 0. */
  activeDays: number;
  /** The span of dates covered by these stats. */
  dateRange: { from: Date; to: Date };
}