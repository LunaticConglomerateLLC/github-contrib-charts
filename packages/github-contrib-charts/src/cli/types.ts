import type { ThemeOption } from '../theme.js';

/** Output formats supported by the CLI. */
export type OutputFormat = 'text' | 'png';

/** Grid geometry for the chart. */
export type ChartGeometry = 'rectangular';

/** Options accepted by renderText, renderPng and the CLI. */
export interface CliOptions {
  /** GitHub personal access token. Falls back to the GITHUB_TOKEN env var. */
  token?: string;
  /** Output path prefix for PNG files. Default './output'. */
  output?: string;
  /** Chart geometry. Default 'rectangular'. */
  geometry?: ChartGeometry;
  /** Day count for the rectangular geometry (1–366). Default 364. */
  days?: number;
  /** Custom rectangular grid height (rows). Default 7 when only columns given. */
  rows?: number;
  /** Custom rectangular grid width (columns). Default 52 when only rows given. */
  columns?: number;
  /**
   * Number of weeks for an n-by-7 layout.
   *
   * @deprecated Use --days instead.
   */
  weeks?: number;
  /**
   * Grid layout strategy.
   *
   * @deprecated Use --geometry instead.
   */
  layout?: 'n-by-7' | '13-by-4';
  /**
   * Cell glyph shape alias. Accepts 'rectangular'/'square' as a --geometry alias.
   *
   * @deprecated Use --cell-shape for glyphs and --geometry for the grid.
   */
  shape?: 'circle' | 'square' | 'rounded-rect';
  /** Cell glyph shape. Default 'square'. */
  cellShape?: 'circle' | 'square' | 'rounded-rect';
  /** Colour theme. Default 'github-light'. */
  theme?: ThemeOption;
  /** Output PNG resolution as 'WxH'. Default '800x600'. */
  resolution?: string;
}
