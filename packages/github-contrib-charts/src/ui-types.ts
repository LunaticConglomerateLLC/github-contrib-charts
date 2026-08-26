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
  shape?: 'rectangular' | 'square';
  /** Day count for the rectangular shape (1–366). Defaults to 365. Ignored for square. */
  days?: number;
  /** Edge size for the square shape (1–19). Defaults to 10. Ignored for rectangular. */
  size?: number;
  /**
   * Grid layout strategy.
   *
   * @deprecated Use `shape`/`days`/`size` instead. If both are given, shape wins.
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
export function toShapeConfig(config: Pick<ChartConfig, 'shape' | 'days' | 'size' | 'gridLayout'>): ChartShapeConfig {
  if (config.gridLayout && !config.shape) return config.gridLayout;
  if (config.shape === 'square') return { shape: 'square', size: config.size };
  return { shape: 'rectangular', days: config.days };
}