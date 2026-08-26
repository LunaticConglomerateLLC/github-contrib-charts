import type {
  ChartShapeConfig,
  ContributionLevel,
  ContributionDay,
  ContributionGrid,
  DisplayWindow,
  GridCell,
  GridLayoutConfig,
  NormalizedShapeConfig,
} from './types.js';
import { DEFAULT_DAYS, DEFAULT_SIZE } from './types.js';
import { validateChartShapeConfig, validateDays } from './errors.js';

/** Returns the ISO date string for a Date, or the Date passed in if already normalized. */
function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns the day-of-week (0 = Sunday .. 6 = Saturday) for a Date. */
function weekday(d: Date): number {
  return d.getUTCDay();
}

/** Maps a contribution count to a quartile level based on the max count in the set. */
function levelFor(count: number, max: number): ContributionLevel {
  if (count <= 0) return 'NONE';
  if (max <= 0) return 'NONE';
  const ratio = count / max;
  if (ratio <= 0.25) return 'FIRST_QUARTILE';
  if (ratio <= 0.5) return 'SECOND_QUARTILE';
  if (ratio <= 0.75) return 'THIRD_QUARTILE';
  return 'FOURTH_QUARTILE';
}

/** Returns true when the config uses a deprecated GridLayoutConfig variant. */
function isLegacyLayout(config: ChartShapeConfig): config is GridLayoutConfig {
  return 'type' in config;
}

function warnDeprecatedLayout(type: string, alternative: string): void {
  console.warn(
    `[github-contrib-charts] layout '${type}' is deprecated; ${alternative}`,
  );
}

/**
 * Normalizes any chart shape config (including deprecated layouts) into a
 * `NormalizedShapeConfig`. Legacy `n-by-7` maps to an equivalent rectangular
 * day count; `13-by-4` maps to its covered day count for windowing purposes.
 */
export function resolveShapeConfig(config: ChartShapeConfig): NormalizedShapeConfig {
  if (isLegacyLayout(config)) {
    if (config.type === 'n-by-7') {
      warnDeprecatedLayout('n-by-7', "use { shape: 'rectangular', days } instead.");
      return { shape: 'rectangular', days: config.weeks * 7 };
    }
    warnDeprecatedLayout('13-by-4', 'it is kept for backwards compatibility only.');
    return { shape: 'rectangular', days: (config.weeks ?? 52) * 7 };
  }
  validateChartShapeConfig(config);
  if (config.shape === 'square') {
    warnCrossModeParam('square', config, 'days', 'size');
    return { shape: 'square', size: config.size ?? DEFAULT_SIZE };
  }
  warnCrossModeParam('rectangular', config, 'size', 'days');
  return { shape: 'rectangular', days: config.days ?? DEFAULT_DAYS };
}

/** Warns when a dimension param for the other shape is present and will be ignored. */
function warnCrossModeParam(
  shapeName: 'rectangular' | 'square',
  config: ChartShapeConfig,
  otherKey: string,
  usedKey: string,
): void {
  if (otherKey in config) {
    console.warn(
      `[github-contrib-charts] '${otherKey}' is ignored for ${shapeName} shapes; use '${usedKey}'.`,
    );
  }
}

/** Total number of days the config's display window covers. */
export function shapeDayCount(config: ChartShapeConfig): number {
  if (isLegacyLayout(config)) {
    return config.type === 'n-by-7' ? config.weeks * 7 : (config.weeks ?? 52) * 7;
  }
  const normalized = resolveShapeConfig(config);
  return normalized.shape === 'square' ? normalized.size * normalized.size : normalized.days;
}

/** Shifts a Date by whole days without mutating it. */
function shiftUTC(d: Date, days: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

/**
 * Derives the inclusive/exclusive date window a chart shape covers, ending at
 * `anchor`. Rectangular covers `days` days; square covers `size²` days.
 * The anchor is truncated to UTC midnight; `to` is exclusive (`anchor + 1d`).
 */
export function displayWindow(config: ChartShapeConfig, anchor: Date): DisplayWindow {
  const span = shapeDayCount(config);
  const utcMidnight = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate()));
  return { from: shiftUTC(utcMidnight, -(span - 1)), to: shiftUTC(utcMidnight, 1) };
}

/**
 * Computes a contribution grid from daily data using the specified layout.
 *
 * - `rectangular`: each column is a week (Sun–Sat), 7 rows are days of the week.
 * - `square`: size×size row-major grid of size² days.
 * - `n-by-7` (deprecated): legacy rectangular alias via `weeks`.
 * - `13-by-4` (deprecated): 52 weeks condensed into 13 columns × 4 quarterly rows.
 */
export function computeGrid(days: ContributionDay[], config: ChartShapeConfig): ContributionGrid {
  if (days.length === 0) throw new RangeError('days array must not be empty');

  if ('shape' in config) {
    const normalized = resolveShapeConfig(config);
    if (normalized.shape === 'square') {
      return computeSquare(days, normalized.size);
    }
    return computeRectangular(days, normalized.days);
  }

  if (config.type === 'n-by-7') {
    return computeNBy7(days, config.weeks);
  }
  return compute13By4(days, config.weeks ?? 52);
}

const DAY_MS = 86_400_000;

/** UTC midnight of a Date. */
function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Rectangular layout: 7 rows × ceil(days/7) week-aligned columns. The most
 * recent day sits at the bottom-right cell; when days is not divisible by 7
 * the earliest `rows*columns-days` cells are padded with empty cells at the
 * top of column 0.
 */
function computeRectangular(days: ContributionDay[], dayCount: number): ContributionGrid {
  validateDays(dayCount);

  const byDate = new Map<string, ContributionDay>();
  let maxCount = 0;
  for (const d of days) {
    byDate.set(isoDay(utcMidnight(d.date)), d);
    if (d.contributionCount > maxCount) maxCount = d.contributionCount;
  }

  const last = utcMidnight(days[days.length - 1]!.date);
  const columns = Math.ceil(dayCount / 7);
  const totalCells = columns * 7;
  const firstCellMs = last.getTime() - (totalCells - 1) * DAY_MS;

  const cells: GridCell[][] = [];
  let total = 0;

  for (let row = 0; row < 7; row++) {
    const gridRow: GridCell[] = [];
    for (let col = 0; col < columns; col++) {
      const idx = col * 7 + row;
      const cellDate = new Date(firstCellMs + idx * DAY_MS);
      const data = byDate.get(isoDay(cellDate));
      const count = data?.contributionCount ?? 0;
      total += count;
      gridRow.push({
        date: data ? data.date : null,
        dateRange: null,
        contributionCount: count,
        contributionLevel: levelFor(count, maxCount),
      });
    }
    cells.push(gridRow);
  }

  return { cells, rows: 7, columns, layout: 'rectangular', totalContributions: total };
}

/** Square layout: size×size row-major grid of size² days, most recent at bottom-right. */
function computeSquare(days: ContributionDay[], size: number): ContributionGrid {
  const byDate = new Map<string, ContributionDay>();
  let maxCount = 0;
  for (const d of days) {
    byDate.set(isoDay(utcMidnight(d.date)), d);
    if (d.contributionCount > maxCount) maxCount = d.contributionCount;
  }

  const totalCells = size * size;
  const last = utcMidnight(days[days.length - 1]!.date);
  const firstCellMs = last.getTime() - (totalCells - 1) * DAY_MS;

  const cells: GridCell[][] = [];
  let total = 0;

  for (let row = 0; row < size; row++) {
    const gridRow: GridCell[] = [];
    for (let col = 0; col < size; col++) {
      const idx = row * size + col; // row-major: earliest top-left, most recent bottom-right
      const cellDate = new Date(firstCellMs + idx * DAY_MS);
      const data = byDate.get(isoDay(cellDate));
      const count = data?.contributionCount ?? 0;
      total += count;
      gridRow.push({
        date: data ? data.date : null,
        dateRange: null,
        contributionCount: count,
        contributionLevel: levelFor(count, maxCount),
      });
    }
    cells.push(gridRow);
  }

  return { cells, rows: size, columns: size, layout: 'square', totalContributions: total };
}

function computeNBy7(days: ContributionDay[], weeks: number): ContributionGrid {
  if (weeks < 1) throw new RangeError('weeks must be >= 1');

  const byDate = new Map<string, ContributionDay>();
  let maxCount = 0;
  for (const d of days) {
    byDate.set(isoDay(d.date), d);
    if (d.contributionCount > maxCount) maxCount = d.contributionCount;
  }

  // Anchor on the most recent week so `weeks` always shows the latest data,
  // not the oldest. This keeps the demo intuitive when `weeks` < fetched range.
  const last = new Date(days[days.length - 1]!.date);
  const sundayOfLast = new Date(last);
  sundayOfLast.setUTCDate(last.getUTCDate() - weekday(last));
  const sunday = new Date(sundayOfLast);
  sunday.setUTCDate(sundayOfLast.getUTCDate() - (weeks - 1) * 7);

  const cells: GridCell[][] = [];
  let total = 0;

  // Build rows-first so cells[row][col]: row 0 = Sunday .. row 6 = Saturday, column = week.
  for (let row = 0; row < 7; row++) {
    const gridRow: GridCell[] = [];
    for (let col = 0; col < weeks; col++) {
      const date = new Date(sunday);
      date.setUTCDate(sunday.getUTCDate() + col * 7 + row);
      const iso = isoDay(date);
      const data = byDate.get(iso);
      const count = data?.contributionCount ?? 0;
      total += count;
      gridRow.push({
        date: data ? data.date : null,
        dateRange: null,
        contributionCount: count,
        contributionLevel: levelFor(count, maxCount),
      });
    }
    cells.push(gridRow);
  }

  return { cells, rows: 7, columns: weeks, layout: 'n-by-7', totalContributions: total };
}

function compute13By4(days: ContributionDay[], weeks: number): ContributionGrid {
  if (weeks < 1 || weeks > 52) throw new RangeError('weeks must be between 1 and 52 for 13-by-4');

  const byDate = new Map<string, ContributionDay>();
  for (const d of days) byDate.set(isoDay(d.date), d);

  // Build the most recent `weeks` weekly blocks, anchored on the last day's Sunday.
  const last = new Date(days[days.length - 1]!.date);
  const sundayOfLast = new Date(last);
  sundayOfLast.setUTCDate(last.getUTCDate() - weekday(last));
  const sunday = new Date(sundayOfLast);
  sunday.setUTCDate(sundayOfLast.getUTCDate() - (weeks - 1) * 7);

  const weeklyBlocks: { from: Date; to: Date; count: number }[] = [];
  for (let w = 0; w < weeks; w++) {
    let count = 0;
    const weekFrom = new Date(sunday);
    weekFrom.setUTCDate(sunday.getUTCDate() + w * 7);
    const weekTo = new Date(weekFrom);
    weekTo.setUTCDate(weekFrom.getUTCDate() + 6);
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekFrom);
      date.setUTCDate(weekFrom.getUTCDate() + d);
      count += byDate.get(isoDay(date))?.contributionCount ?? 0;
    }
    weeklyBlocks.push({ from: weekFrom, to: weekTo, count });
  }

  let maxCount = 0;
  for (const b of weeklyBlocks) if (b.count > maxCount) maxCount = b.count;

  // Layout: 4 rows. Most recent week (w1) at bottom-right, then up to top-right,
  // then next column to the left, etc. Example with 12 weeks (3 cols):
  //   w12 w8 w4
  //   w11 w7 w3
  //   w10 w6 w2
  //   w09 w5 w1
  const columns = Math.ceil(weeks / 4);
  const cells: GridCell[][] = Array.from({ length: 4 }, () =>
    Array.from({ length: columns }, () => ({
      date: null as Date | null,
      dateRange: null as { from: Date; to: Date } | null,
      contributionCount: 0,
      contributionLevel: 'NONE' as ContributionLevel,
    })),
  );
  let total = 0;

  for (let w = 0; w < weeks; w++) {
    const weekNumber = w + 1; // 1 = most recent
    const col = columns - 1 - Math.floor((weekNumber - 1) / 4);
    const row = 3 - ((weekNumber - 1) % 4);
    const displayBlock = weeklyBlocks[weeks - 1 - w]!;
    total += displayBlock.count;
    cells[row]![col]! = {
      date: null,
      dateRange: { from: displayBlock.from, to: displayBlock.to },
      contributionCount: displayBlock.count,
      contributionLevel: levelFor(displayBlock.count, maxCount),
    };
  }

  return { cells, rows: 4, columns, layout: '13-by-4', totalContributions: total };
}