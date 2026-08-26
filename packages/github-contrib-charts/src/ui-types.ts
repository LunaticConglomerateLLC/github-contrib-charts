import type { ChartShapeConfig, ContributionLevel, DateRange, GridLayoutConfig } from './types.js';

/** Built-in colour theme names. */
export type ThemePreset = 'github-light' | 'github-dark';

/** Custom colour stop mapping a contribution level to a hex colour. */
export interface ColorStop {
  level: ContributionLevel;
  color: string;
}

/** Cell shape for the chart. */
export type CellShape = 'circle' | 'square' | 'rounded-rect';

/** User-facing configuration for rendering. */
export interface ChartConfig {
  /** GitHub username to fetch data for. */
  username: string;
  /** GitHub personal access token. */
  token: string;
  /** Chart shape. Defaults to 'rectangular'. Mutually exclusive with gridLayout. */
  shape?: 'rectangular';
  /**
   * Day count for the week-aligned rectangular shape (1–366).
   * Defaults to 364 (7×52). Mutually exclusive with rows/columns.
   */
  days?: number;
  /**
   * Custom rectangular grid height (integer ≥ 1). Defaults to 7 when only
   * `columns` is given.
   */
  rows?: number;
  /**
   * Custom rectangular grid width (integer ≥ 1). Defaults to 52 when only
   * `rows` is given; `rows × columns` must not exceed 366.
   */
  columns?: number;
  /**
   * Grid layout strategy.
   *
   * @deprecated Use `shape`/`days`/`size`/`rows`/`columns` instead. If both are given, shape wins.
   */
  gridLayout?: GridLayoutConfig;
  /** Cell shape. */
  cellShape: CellShape;
  /** Built-in theme name or custom colour stops. */
  colorTheme: ThemePreset | ColorStop[];
  /** Date range for fetching. Overrides the shape-derived window when set. */
  dateRange?: DateRange;
  /** Optional chart title. */
  title?: string;
  /** Whether to show the contribution-level legend. */
  showLegend: boolean;
}

/** Resolves a user-facing chart config into a normalized shape config. */
export function toShapeConfig(
  config: Pick<ChartConfig, 'shape' | 'days' | 'rows' | 'columns' | 'gridLayout'> & {
    size?: unknown;
  },
): ChartShapeConfig {
  if (config.gridLayout && !config.shape) return config.gridLayout;
  // Square mode removed per FR-017 (breaking): reject shape square and legacy size.
  const raw: Record<string, unknown> = config as Record<string, unknown>;
  if (raw['shape'] === 'square' || raw['size'] !== undefined) {
    throw new RangeError(
      "square mode removed: use { shape: 'rectangular', rows: N, columns: N } (e.g. rows: 7, columns: 7 for 7×7)",
    );
  }
  const rows = config.rows !== undefined || config.columns !== undefined ? config.rows : undefined;
  const columns =
    config.rows !== undefined || config.columns !== undefined ? config.columns : undefined;
  return { shape: 'rectangular', days: config.days, rows, columns };
}