/**
 * Public API for `@wearelunatic/github-contrib-charts`.
 *
 * @module
 */

export * from './types.js';
export * from './errors.js';

/**
 * Fetches contribution data for a GitHub user over a date range using the GitHub GraphQL API.
 * @see {@link fetchContributions}
 */
export { fetchContributions, deriveDateRange } from './fetch.js';

/**
 * Computes a contribution grid from daily data using the specified layout strategy.
 * @see {@link computeGrid}
 */
export { computeGrid, resolveShapeConfig, shapeDayCount, displayWindow } from './grid.js';

/**
 * Computes aggregate statistics from contribution data.
 * @see {@link computeStats}
 */
export { computeStats } from './stats.js';

/**
 * The main contribution heatmap chart component.
 * @see {@link ContributionChart}
 */
export { ContributionChart } from './chart.js';
export type { ContributionChartProps } from './chart.js';

/**
 * A compact panel rendering derived contribution statistics.
 * @see {@link ContributionStats}
 */
export { ContributionStats } from './stats-panel.js';

/**
 * Renders a single contribution cell with the configured shape.
 * @see {@link CellShapeRenderer}
 */
export { CellShapeRenderer } from './shapes.js';
export type { CellShapeRendererProps } from './shapes.js';

/**
 * Colour theme helpers and built-in GitHub palettes.
 * @see {@link colorFor}, {@link GITHUB_LIGHT}, {@link GITHUB_DARK}, {@link resolveStops}
 */
export { colorFor, GITHUB_LIGHT, GITHUB_DARK, resolveStops } from './theme.js';
export type { ThemePreset, ColorStop, CellShape, ChartConfig } from './ui-types.js';
export type { ThemeOption } from './theme.js';
export {
  validateChartShapeConfig,
  validateDays,
  validateRows,
  validateColumns,
  validateRectangularDimensions,
} from './errors.js';