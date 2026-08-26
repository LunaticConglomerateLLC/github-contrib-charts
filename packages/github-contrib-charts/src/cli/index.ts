/**
 * Programmatic CLI API for `@wearelunatic/github-contrib-charts` — text/PNG rendering and the commander program.
 *
 * Import from the `@wearelunatic/github-contrib-charts/cli` subpath.
 *
 * @module
 */

/**
 * Renders a chart as formatted text.
 * @see {@link renderText}
 */
export { renderText, formatText, gridConfig } from './render-text.js';

/**
 * Resolves CLI options into a chart shape config and derives fetch windows.
 * @see {@link gridShapeConfig}, {@link resolveDateRange}, {@link parseResolution}
 */
export { gridShapeConfig, resolveDateRange, parseResolution, resolveToken } from './resolve.js';

/**
 * Renders a chart as a PNG image buffer.
 * @see {@link renderPng}
 */
export { renderPng, buildContributionSvg } from './render-png.js';

/**
 * The commander program, the run() executor, and the programmatic entry point.
 * @see {@link buildCli}, {@link run}, {@link main}
 */
export { buildCli, run, main } from './cli.js';

/**
 * Colour theme helpers shared with the rendering pipeline.
 * @see {@link GITHUB_LIGHT}, {@link GITHUB_DARK}, {@link colorFor}, {@link resolveStops}
 */
export { GITHUB_LIGHT, GITHUB_DARK, colorFor, resolveStops } from '../theme.js';
export type { CliOptions, OutputFormat } from './types.js';
export type { ColorStop, ThemeOption } from '../theme.js';
