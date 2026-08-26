import type { ChartShapeConfig, DateRange } from '../types.js';
import { DEFAULT_DAYS, DEFAULT_SIZE, MAX_DAYS } from '../types.js';
import { validateDays, validateSize } from '../errors.js';
import type { CliOptions } from './types.js';

/** Resolves the GitHub token from options or the GITHUB_TOKEN env var. */
export function resolveToken(token?: string): string {
  return token ?? process.env.GITHUB_TOKEN ?? '';
}

function warnIgnoredFlag(otherKey: string, shapeName: string, usedKey: string): void {
  console.warn(
    `[github-contrib-charts] '${otherKey}' is ignored for ${shapeName} shapes; use '${usedKey}'.`,
  );
}

/**
 * Resolves CLI options into a ChartShapeConfig.
 *
 * Explicit --geometry wins over deprecated --weeks/--layout. Without any shape
 * flags this falls back to the default rectangular 365-day window.
 */
export function gridShapeConfig(options: CliOptions = {}): ChartShapeConfig {
  const geometry = options.geometry;
  if (geometry !== undefined) {
    if (geometry !== 'rectangular' && geometry !== 'square') {
      throw new RangeError("geometry must be 'rectangular' or 'square'");
    }
    if (geometry === 'square') {
      if (options.days !== undefined) warnIgnoredFlag('days', 'square', 'size');
      if (options.size !== undefined) validateSize(options.size);
      return { shape: 'square', size: options.size ?? DEFAULT_SIZE };
    }
    if (options.size !== undefined) warnIgnoredFlag('size', 'rectangular', 'days');
    if (options.days !== undefined) validateDays(options.days);
    return { shape: 'rectangular', days: options.days ?? DEFAULT_DAYS };
  }

  // Deprecated layout flags keep working when no explicit geometry is given.
  if (options.layout === '13-by-4') return { type: '13-by-4', weeks: options.weeks };
  if (options.weeks !== undefined && options.days === undefined && options.size === undefined) {
    return { type: 'n-by-7', weeks: options.weeks };
  }
  if (options.days !== undefined) {
    if (options.size !== undefined) warnIgnoredFlag('size', 'rectangular', 'days');
    validateDays(options.days);
    return { shape: 'rectangular', days: options.days };
  }
  if (options.size !== undefined) {
    validateSize(options.size);
    return { shape: 'square', size: options.size };
  }
  return { shape: 'rectangular', days: DEFAULT_DAYS };
}

/** Number of days a resolved config's window covers. */
function spanOf(config: ChartShapeConfig): number {
  if ('shape' in config) {
    return config.shape === 'square'
      ? (config.size ?? DEFAULT_SIZE) ** 2
      : (config.days ?? DEFAULT_DAYS);
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
