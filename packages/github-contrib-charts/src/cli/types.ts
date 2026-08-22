import type { ThemeOption } from '../theme.js';

/** Output formats supported by the CLI. */
export type OutputFormat = 'text' | 'png';

/** Options accepted by renderText, renderPng and the CLI. */
export interface CliOptions {
  /** GitHub personal access token. Falls back to the GITHUB_TOKEN env var. */
  token?: string;
  /** Output path prefix for PNG files. Default './output'. */
  output?: string;
  /** Number of weeks for an n-by-7 layout. Default 52. */
  weeks?: number;
  /** Grid layout strategy. Default 'n-by-7'. */
  layout?: 'n-by-7' | '13-by-4';
  /** Cell shape. Default 'square'. */
  shape?: 'circle' | 'square' | 'rounded-rect';
  /** Colour theme. Default 'github-light'. */
  theme?: ThemeOption;
  /** Output PNG resolution as 'WxH'. Default '800x600'. */
  resolution?: string;
}
