import { describe, it, expect } from 'vitest';
import { computeGrid, resolveShapeConfig } from '../../src/grid.js';
import { validateChartShapeConfig } from '../../src/errors.js';
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

describe('computeGrid edge cases', () => {
  it('throws RangeError when weeks is less than 1', () => {
    expect(() => computeGrid([day('2025-12-28', 1)], { type: 'n-by-7', weeks: 0 })).toThrow(RangeError);
  });

  it('throws RangeError when days array is empty', () => {
    expect(() => computeGrid([], { type: 'n-by-7', weeks: 1 })).toThrow(RangeError);
    expect(() => computeGrid([], { type: '13-by-4' })).toThrow(RangeError);
  });

  it('fills trailing cells as empty when range does not divide evenly (n-by-7)', () => {
    // Only 10 days provided for a 2-week grid (14 cells). Last 4 cells should be empty.
    const days: ContributionDay[] = [];
    const start = new Date('2025-12-28T00:00:00Z');
    for (let i = 0; i < 10; i++) {
      const dt = new Date(start);
      dt.setUTCDate(start.getUTCDate() + i);
      days.push(day(dt.toISOString().slice(0, 10), i));
    }
    const grid = computeGrid(days, { type: 'n-by-7', weeks: 2 });
    expect(grid.cells.flat()).toHaveLength(14);
    // Days 10..13 fall in column 1 (second week) at rows 3..6; those cells are empty.
    for (const row of [3, 4, 5, 6]) {
      const cell = grid.cells[row]![1]!;
      expect(cell.contributionCount).toBe(0);
      expect(cell.date).toBeNull();
    }
    // The filled 10 days still render their counts.
    expect(grid.cells[0]![0]!.contributionCount).toBe(0); // day 0
    expect(grid.cells[1]![0]!.contributionCount).toBe(1); // day 1
  });

  it('handles a single week with only some days filled', () => {
    const days = [day('2025-12-29', 5)];
    const grid = computeGrid(days, { type: 'n-by-7', weeks: 1 });
    expect(grid.cells.flat()).toHaveLength(7);
    expect(grid.cells[1]![0]!.contributionCount).toBe(5);
  });

  it('renders all cells at NONE level when there are no contributions (max is 0)', () => {
    const days: ContributionDay[] = [];
    const start = new Date('2025-12-28T00:00:00Z');
    for (let i = 0; i < 7; i++) {
      const dt = new Date(start);
      dt.setUTCDate(start.getUTCDate() + i);
      days.push(day(dt.toISOString().slice(0, 10), 0));
    }
    const grid = computeGrid(days, { type: 'n-by-7', weeks: 1 });
    grid.cells.flat().forEach((c) => expect(c.contributionLevel).toBe('NONE'));
  });

  it('renders all 13-by-4 cells at NONE level for an empty year', () => {
    const days: ContributionDay[] = [];
    const start = new Date('2025-12-28T00:00:00Z');
    for (let i = 0; i < 364; i++) {
      const dt = new Date(start);
      dt.setUTCDate(start.getUTCDate() + i);
      days.push(day(dt.toISOString().slice(0, 10), 0));
    }
    const grid = computeGrid(days, { type: '13-by-4' });
    expect(grid.cells.flat()).toHaveLength(52);
    grid.cells.flat().forEach((c) => expect(c.contributionLevel).toBe('NONE'));
    expect(grid.totalContributions).toBe(0);
  });
});

describe('rectangular rows/columns validation', () => {
  it.each([0, -4, 2.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects rows=%s with a RangeError naming rows',
    (rows) => {
      expect(() => validateChartShapeConfig({ shape: 'rectangular', rows })).toThrow(RangeError);
      expect(() => validateChartShapeConfig({ shape: 'rectangular', rows })).toThrow(/rows/);
      expect(() => resolveShapeConfig({ shape: 'rectangular', rows })).toThrow(RangeError);
    },
  );

  it.each([0, -1, 7.25, Number.NaN])(
    'rejects columns=%s with a RangeError naming columns',
    (columns) => {
      expect(() => validateChartShapeConfig({ shape: 'rectangular', columns })).toThrow(RangeError);
      expect(() => validateChartShapeConfig({ shape: 'rectangular', columns })).toThrow(/columns/);
      expect(() => resolveShapeConfig({ shape: 'rectangular', columns })).toThrow(RangeError);
    },
  );

  it('rejects a product exceeding the 366-day window', () => {
    const config = { shape: 'rectangular' as const, rows: 20, columns: 20 };
    expect(() => validateChartShapeConfig(config)).toThrow(RangeError);
    expect(() => validateChartShapeConfig(config)).toThrow(/rows \* columns must not exceed 366 days/);
  });

  it("rejects combining 'days' with 'rows'", () => {
    const config = { shape: 'rectangular' as const, days: 90, rows: 4 };
    expect(() => validateChartShapeConfig(config)).toThrow(RangeError);
    expect(() => validateChartShapeConfig(config)).toThrow(/'days' cannot be combined with 'rows'\/'columns'/);
    expect(() => resolveShapeConfig(config)).toThrow(RangeError);
  });

  it("rejects combining 'days' with 'columns'", () => {
    const config = { shape: 'rectangular' as const, days: 90, columns: 30 };
    expect(() => validateChartShapeConfig(config)).toThrow(RangeError);
    expect(() => resolveShapeConfig(config)).toThrow(/'days' cannot be combined/);
  });

  it('accepts a valid 4x30 configuration', () => {
    expect(() => validateChartShapeConfig({ shape: 'rectangular', rows: 4, columns: 30 })).not.toThrow();
    expect(() => resolveShapeConfig({ shape: 'rectangular', rows: 4, columns: 30 })).not.toThrow();
  });

  it('accepts single-dimension configurations within bounds', () => {
    expect(() => validateChartShapeConfig({ shape: 'rectangular', columns: 52 })).not.toThrow();
    expect(() => validateChartShapeConfig({ shape: 'rectangular', rows: 1 })).not.toThrow();
  });
});

describe('square mode removal (FR-017 breaking)', () => {
  it("rejects shape:'square' with size", () => {
    expect(() => validateChartShapeConfig({ shape: 'square', size: 7 } as any)).toThrow(RangeError);
    expect(() => validateChartShapeConfig({ shape: 'square', size: 7 } as any)).toThrow(/square mode removed/i);
    expect(() => resolveShapeConfig({ shape: 'square', size: 7 } as any)).toThrow(RangeError);
  });
  it('rejects any square config via validateChartShapeConfig', () => {
    expect(() => validateChartShapeConfig({ shape: 'square' } as any)).toThrow(RangeError);
  });
});