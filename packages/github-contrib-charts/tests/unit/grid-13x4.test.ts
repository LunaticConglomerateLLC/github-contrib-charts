import { describe, it, expect } from 'vitest';
import { computeGrid } from '../../src/grid.js';
import type { ContributionDay } from '../../src/types.js';

function day(date: string, count: number): ContributionDay {
  return {
    date: new Date(date),
    contributionCount: count,
    contributionLevel: count === 0 ? 'NONE' : 'FIRST_QUARTILE',
    commitCount: 0,
    pullRequestCount: 0,
    issueCount: 0,
    reviewCount: 0,
  };
}

// Build 52 weeks (364 days) starting Sunday 2025-12-28.
// Each week has 7 days with increasing counts: week w, day d => (w * 7) + d
function buildYear(): ContributionDay[] {
  const start = new Date('2025-12-28T00:00:00Z');
  const days: ContributionDay[] = [];
  for (let w = 0; w < 52; w++) {
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start);
      dt.setUTCDate(start.getUTCDate() + w * 7 + d);
      days.push(day(dt.toISOString().slice(0, 10), w * 7 + d));
    }
  }
  return days;
}

describe('computeGrid 13-by-4', () => {
  it('builds a 13x4 grid', () => {
    const grid = computeGrid(buildYear(), { type: '13-by-4' });

    expect(grid.rows).toBe(4);
    expect(grid.columns).toBe(13);
    expect(grid.layout).toBe('13-by-4');
    expect(grid.cells).toHaveLength(4);
    grid.cells.forEach((row) => expect(row).toHaveLength(13));
  });

  it('aggregates each cell to a full week of 7 days (current week bottom-right)', () => {
    const grid = computeGrid(buildYear(), { type: '13-by-4' });

    // Oldest week at top-left, most recent at bottom-right
    // Top-left (0,0) = week 1 (w0) sum 21
    expect(grid.cells[0]![0]!.contributionCount).toBe(21);
    // Bottom-right (3,12) = most recent week (w51) sum = 49*51+21 = 2520
    expect(grid.cells[3]![12]!.contributionCount).toBe(49 * 51 + 21);
    // Top-right (0,12) = 4th most recent (w48) sum = 49*48+21 = 2373
    expect(grid.cells[0]![12]!.contributionCount).toBe(49 * 48 + 21);
    // Bottom-left (3,0) = 4th oldest group bottom: week 4 (w3) sum = 49*3+21 = 168
    expect(grid.cells[3]![0]!.contributionCount).toBe(49 * 3 + 21);
  });

  it('produces a compact grid when weeks < 52 (example: 12 weeks -> 3×4)', () => {
    const grid = computeGrid(buildYear().slice(-84), { type: '13-by-4', weeks: 12 }); // last 12 weeks
    expect(grid.rows).toBe(4);
    expect(grid.columns).toBe(3);
    // Layout per spec: w12 w8 w4 / w11 w7 w3 / w10 w6 w2 / w09 w5 w1
    // Bottom-right w1 is most recent week
    expect(grid.cells[3]![2]!.contributionCount).toBeGreaterThan(0);
    // Top-left w12 is oldest among the 12
    expect(grid.cells[0]![0]!.contributionCount).toBeGreaterThan(0);
  });

  it('totalContributions matches full year sum', () => {
    const grid = computeGrid(buildYear(), { type: '13-by-4' });
    const expected = Array.from({ length: 52 * 7 }, (_, i) => i).reduce((a, b) => a + b, 0);
    expect(grid.totalContributions).toBe(expected);
  });

  it('labels each cell with its week date range', () => {
    const grid = computeGrid(buildYear(), { type: '13-by-4' });
    const cell = grid.cells[0]![0]!;
    expect(cell.dateRange).not.toBeNull();
    expect(cell.dateRange!.from.toISOString().slice(0, 10)).toBe('2025-12-28');
    expect(cell.dateRange!.to.toISOString().slice(0, 10)).toBe('2026-01-03');
  });
});