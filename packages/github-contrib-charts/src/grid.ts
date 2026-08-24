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
  return compute13By4(days, layout.weeks ?? 52);
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