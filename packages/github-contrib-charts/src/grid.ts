import type { ContributionLevel, ContributionDay, ContributionGrid, GridCell, GridLayoutConfig } from './types.js';

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

/**
 * Computes a contribution grid from daily data using the specified layout.
 *
 * - `n-by-7`: each column is a week (Sun–Sat), 7 rows are days of the week.
 * - `13-by-4`: 52 weeks condensed into 13 columns × 4 quarterly rows, each cell aggregating one week.
 */
export function computeGrid(days: ContributionDay[], layout: GridLayoutConfig): ContributionGrid {
  if (days.length === 0) throw new RangeError('days array must not be empty');

  if (layout.type === 'n-by-7') {
    return computeNBy7(days, layout.weeks);
  }
  return compute13By4(days);
}

function computeNBy7(days: ContributionDay[], weeks: number): ContributionGrid {
  if (weeks < 1) throw new RangeError('weeks must be >= 1');

  const byDate = new Map<string, ContributionDay>();
  let maxCount = 0;
  for (const d of days) {
    byDate.set(isoDay(d.date), d);
    if (d.contributionCount > maxCount) maxCount = d.contributionCount;
  }

  // Determine the week containing the first day, anchored on Sunday.
  const first = new Date(days[0]!.date);
  const sunday = new Date(first);
  sunday.setUTCDate(first.getUTCDate() - weekday(first));

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

function compute13By4(days: ContributionDay[]): ContributionGrid {
  const byDate = new Map<string, ContributionDay>();
  for (const d of days) byDate.set(isoDay(d.date), d);

  // Anchor the year on the first day's Sunday, then produce 52 weekly blocks.
  const first = new Date(days[0]!.date);
  const sunday = new Date(first);
  sunday.setUTCDate(first.getUTCDate() - weekday(first));

  const weeklyBlocks: { from: Date; to: Date; count: number }[] = [];
  for (let w = 0; w < 52; w++) {
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

  const cells: GridCell[][] = [];
  let total = 0;

  // 4 rows (quarters), each row covering 13 consecutive weeks.
  for (let quarter = 0; quarter < 4; quarter++) {
    const row: GridCell[] = [];
    for (let col = 0; col < 13; col++) {
      const weekIndex = quarter * 13 + col;
      const block = weeklyBlocks[weekIndex]!;
      total += block.count;
      row.push({
        date: null,
        dateRange: { from: block.from, to: block.to },
        contributionCount: block.count,
        contributionLevel: levelFor(block.count, maxCount),
      });
    }
    cells.push(row);
  }

  return { cells, rows: 4, columns: 13, layout: '13-by-4', totalContributions: total };
}