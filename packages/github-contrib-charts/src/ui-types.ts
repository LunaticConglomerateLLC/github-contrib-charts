import type { ContributionLevel, DateRange, GridLayoutConfig } from './types.js';

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
  /** Grid layout strategy. */
  gridLayout: GridLayoutConfig;
  /** Cell shape. */
  cellShape: CellShape;
  /** Built-in theme name or custom colour stops. */
  colorTheme: ThemePreset | ColorStop[];
  /** Date range for fetching. */
  dateRange: DateRange;
  /** Optional chart title. */
  title?: string;
  /** Whether to show the contribution-level legend. */
  showLegend: boolean;
}