import type { ChartShapeConfig, DateRange } from '../types.js';
import {
  DEFAULT_COLUMNS,
  DEFAULT_DAYS,
  DEFAULT_ROWS,
  MAX_DAYS,
} from '../types.js';
import {
  validateColumns,
  validateDays,
  validateRectangularDimensions,
  validateRows,
} from '../errors.js';
import type { CliOptions } from './types.js';

const SQUARE_REMOVED_MESSAGE =
  "square mode removed: use { shape: 'rectangular', rows: N, columns: N } (e.g. rows: 7, columns: 7 for 7×7)";

/** Resolves the GitHub token from options or the GITHUB_TOKEN env var. */
export function resolveToken(token?: string): string {
  return token ?? process.env.GITHUB_TOKEN ?? '';
}

/**
 * Resolves CLI options into a ChartShapeConfig (rectangular-only after FR-017 square removal).
 *
 * Explicit --geometry rectangular wins over deprecated --weeks/--layout. Without
 * any shape flags this falls back to the default rectangular 364-day (7×52)
 * window. Presence of --rows/--columns implies rectangular custom geometry;
 * combining them with --days is a hard RangeError (FR-006). --size and
 * --geometry square are rejected per FR-017 (breaking).
 */
export function gridShapeConfig(options: CliOptions = {}): ChartShapeConfig {
  const raw = options as CliOptions & Record<string, unknown>;
  const hasRowsCols = options.rows !== undefined || options.columns !== undefined;
  const geometry = options.geometry;
  // FR-017 breaking: square removed (runtime check: raw may carry 'square' despite CliOptions type)
  if ((geometry as unknown) === 'square' || (raw as Record<string, unknown>).geometry === 'square') {
    throw new RangeError(SQUARE_REMOVED_MESSAGE);
  }
  if (raw.size !== undefined) {
    throw new RangeError(SQUARE_REMOVED_MESSAGE);
  }
  if (geometry !== undefined) {
    if (geometry !== 'rectangular') {
      throw new RangeError("geometry must be 'rectangular' (square removed: use --rows/--columns for 7×7)");
    }
    // geometry rectangular
    if (hasRowsCols) {
      if (options.days !== undefined) {
        throw new RangeError("'days' cannot be combined with 'rows'/'columns'; use one or the other");
      }
      const rows = options.rows ?? DEFAULT_ROWS;
      const columns = options.columns ?? DEFAULT_COLUMNS;
      validateRows(rows);
      validateColumns(columns);
      validateRectangularDimensions(rows, columns);
      return { shape: 'rectangular', rows, columns };
    }
    if (options.days !== undefined) validateDays(options.days);
    return { shape: 'rectangular', days: options.days ?? DEFAULT_DAYS };
  }

  // Deprecated layout flags keep working when no explicit geometry is given.
  if (options.layout === '13-by-4') return { type: '13-by-4', weeks: options.weeks };
  if (options.weeks !== undefined && options.days === undefined && !hasRowsCols) {
    return { type: 'n-by-7', weeks: options.weeks };
  }
  if (hasRowsCols) {
    if (options.days !== undefined) {
      throw new RangeError("'days' cannot be combined with 'rows'/'columns'; use one or the other");
    }
    const rows = options.rows ?? DEFAULT_ROWS;
    const columns = options.columns ?? DEFAULT_COLUMNS;
    validateRows(rows);
    validateColumns(columns);
    validateRectangularDimensions(rows, columns);
    return { shape: 'rectangular', rows, columns };
  }
  if (options.days !== undefined) {
    validateDays(options.days);
    return { shape: 'rectangular', days: options.days };
  }
  return { shape: 'rectangular', days: DEFAULT_DAYS };
}

/** Number of days a resolved config's window covers (rectangular-only). */
function spanOf(config: ChartShapeConfig): number {
  if ('shape' in config) {
    if (config.rows !== undefined || config.columns !== undefined) {
      return (config.rows ?? DEFAULT_ROWS) * (config.columns ?? DEFAULT_COLUMNS);
    }
    return config.days ?? DEFAULT_DAYS;
  }
  return config.type === 'n-by-7' ? config.weeks * 7 : (config.weeks ?? 52) * 7;
}

/**
 * Derives the fetch date range for the chart shape, ending at today UTC
 * midnight (`to` exclusive). Legacy layouts map to their covered day count,
 * capped at the GitHub API maximum of 366 days.
 */
export function resolveDateRange(options: CliOptions = {}): DateRange {
  const span = Math.min(spanOf(gridShapeConfig(options)), MAX_DAYS);
  const anchor = new Date();
  anchor.setUTCHours(0, 0, 0, 0);
  const from = new Date(anchor);
  from.setUTCDate(from.getUTCDate() - (span - 1));
  const to = new Date(anchor);
  to.setUTCDate(to.getUTCDate() + 1);
  return { from, to };
}

/** Parses a 'WxH' resolution string, falling back to 800x600. */
export function parseResolution(resolution?: string): { width: number; height: number } {
  if (!resolution) return { width: 800, height: 600 };
  const match = /^(\d+)x(\d+)$/i.exec(resolution);
  if (!match) return { width: 800, height: 600 };
  return { width: Number(match[1]), height: Number(match[2]) };
}
