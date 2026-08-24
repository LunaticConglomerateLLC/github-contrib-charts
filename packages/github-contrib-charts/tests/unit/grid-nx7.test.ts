import { describe, it, expect } from 'vitest';
import { computeGrid } from '../../src/grid.js';
import type { ContributionDay } from '../../src/types.js';

function day(date: string, count: number, extra: Partial<ContributionDay> = {}): ContributionDay {
  return {
    date: new Date(date),
    contributionCount: count,
    contributionLevel: count === 0 ? 'NONE' : 'FIRST_QUARTILE',
    commitCount: 0,
    pullRequestCount: 0,
    issueCount: 0,
    reviewCount: 0,
    ...extra,
  };
}

// 2026-01-01 is a Thursday. Build a full week Sun 2025-12-28 .. Sat 2026-01-03.
const SUNDAY = new Date('2025-12-28T00:00:00Z');
const week = (start: Date): ContributionDay[] =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return day(d.toISOString().slice(0, 10), i);
  });

describe('computeGrid n-by-7', () => {
  it('builds a 7x7 grid with chronological left-to-right, top-to-bottom ordering', () => {
    const days = [...week(SUNDAY), ...week(new Date('2026-01-04T00:00:00Z')), ...week(new Date('2026-01-11T00:00:00Z'))];
    const grid = computeGrid(days, { type: 'n-by-7', weeks: 3 });

    expect(grid.rows).toBe(7);
    expect(grid.columns).toBe(3);
    expect(grid.layout).toBe('n-by-7');
    expect(grid.cells).toHaveLength(7);
    grid.cells.forEach((row) => expect(row).toHaveLength(3));

    // Cell at row 0, col 0 is the first day (Sunday of week 1)
    expect(grid.cells[0]![0]!.date!.toISOString().slice(0, 10)).toBe('2025-12-28');
    // Cell at row 6, col 0 is Saturday of week 1
    expect(grid.cells[6]![0]!.date!.toISOString().slice(0, 10)).toBe('2026-01-03');
    // Cell at row 0, col 1 is Sunday of week 2
    expect(grid.cells[0]![1]!.date!.toISOString().slice(0, 10)).toBe('2026-01-04');
  });

  it('returns zeroed cells for missing days in the range', () => {
    // Only provide Monday 2025-12-29 and Tuesday 2025-12-30
    const days = [day('2025-12-29', 3), day('2025-12-30', 5)];
    const grid = computeGrid(days, { type: 'n-by-7', weeks: 1 });

    expect(grid.cells[0]![0]!.contributionCount).toBe(0); // Sunday
    expect(grid.cells[1]![0]!.contributionCount).toBe(3); // Monday
    expect(grid.cells[2]![0]!.contributionCount).toBe(5); // Tuesday
    expect(grid.cells[3]![0]!.contributionCount).toBe(0); // Wednesday
    expect(grid.totalContributions).toBe(8);
  });

  it('computes contribution level relative to grid distribution', () => {
    const days = [
      day('2025-12-28', 0),
      day('2025-12-29', 100),
      day('2025-12-30', 50),
      day('2025-12-31', 0),
      day('2026-01-01', 25),
      day('2026-01-02', 75),
      day('2026-01-03', 10),
    ];
    const grid = computeGrid(days, { type: 'n-by-7', weeks: 1 });
    // Highest count (100, Monday) should be FOURTH_QUARTILE
    expect(grid.cells[1]![0]!.contributionCount).toBe(100);
    expect(grid.cells[1]![0]!.contributionLevel).toBe('FOURTH_QUARTILE');
    // Zero (Sunday) should stay NONE
    expect(grid.cells[0]![0]!.contributionCount).toBe(0);
    expect(grid.cells[0]![0]!.contributionLevel).toBe('NONE');
  });
});