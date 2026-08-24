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

  it('aggregates each cell to a full week of 7 days', () => {
    const grid = computeGrid(buildYear(), { type: '13-by-4' });

    // Row 0 (Q1) col 0 = week 1 (days 0..6) => sum = 0+1+2+3+4+5+6 = 21
    expect(grid.cells[0]![0]!.contributionCount).toBe(21);
    // Row 0 col 1 = week 2 (days 7..13) => sum = 7*7 + 21 = 70
    expect(grid.cells[0]![1]!.contributionCount).toBe(70);
    // Q1 has 13 weeks, so col 12 = week 13 (days 84..90)
    expect(grid.cells[0]![12]!.contributionCount).toBe(84 * 7 + 21);
    // Q2 (row 1) col 0 = week 14
    expect(grid.cells[1]![0]!.contributionCount).toBe(13 * 7 * 7 + 21);
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