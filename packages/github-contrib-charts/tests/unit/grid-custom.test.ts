import { describe, it, expect } from 'vitest';
import { computeGrid, resolveShapeConfig, shapeDayCount, displayWindow } from '../../src/grid.js';
import type { ContributionDay } from '../../src/types.js';

const ANCHOR = '2025-12-31';

function day(date: string, count: number): ContributionDay {
  return {
    date: new Date(`${date}T00:00:00Z`),
    contributionCount: count,
    contributionLevel: count === 0 ? 'NONE' : 'FIRST_QUARTILE',
    commitCount: 0,
    pullRequestCount: 0,
    issueCount: 0,
    reviewCount: 0,
  };
}

/** Builds `n` consecutive UTC days ending at ANCHOR, each with a unique count. */
function buildDays(n: number): ContributionDay[] {
  const end = new Date(`${ANCHOR}T00:00:00Z`).getTime();
  return Array.from({ length: n }, (_, i) =>
    day(new Date(end - (n - 1 - i) * 86_400_000).toISOString().slice(0, 10), i),
  );
}

describe('computeGrid custom rectangular geometry', () => {
  it('renders exactly rows × columns day-cells for 4×30', () => {
    const grid = computeGrid(buildDays(120), { shape: 'rectangular', rows: 4, columns: 30 });
    expect(grid.rows).toBe(4);
    expect(grid.columns).toBe(30);
    expect(grid.cells).toHaveLength(4);
    grid.cells.forEach((row) => expect(row).toHaveLength(30));
    expect(grid.cells.flat()).toHaveLength(120);
    expect(grid.layout).toBe('rectangular');
  });

  it('fills cells column-major GitHub-week style (top-to-bottom within column, columns left-to-right)', () => {
    const grid = computeGrid(buildDays(120), { shape: 'rectangular', rows: 4, columns: 30 });
    // Column-major chronological: traversing col*rows+row must be strictly increasing.
    const colMajor: string[] = [];
    for (let col = 0; col < 30; col++) for (let row = 0; row < 4; row++) colMajor.push(grid.cells[row]![col]!.date!.toISOString().slice(0, 10));
    for (let i = 1; i < colMajor.length; i++) {
      expect(new Date(colMajor[i]!).getTime()).toBeGreaterThan(
        new Date(colMajor[i - 1]!).getTime(),
      );
    }
    // Explicit index mapping: idx = col * rows + row counts forward from the earliest day.
    // Example 7×4/6×4 table shows bottom-right pinned, idx = col*rows+row.
    const start = new Date(grid.cells[0]![0]!.date!.getTime());
    for (const [row, col] of [
      [0, 0],
      [0, 29],
      [1, 0],
      [2, 15],
      [3, 29],
    ] as const) {
      const expectedMs = start.getTime() + (col * 4 + row) * 86_400_000;
      expect(grid.cells[row]![col]!.date!.toISOString().slice(0, 10)).toBe(
        new Date(expectedMs).toISOString().slice(0, 10),
      );
    }
  });

  it('places the most recent day at the bottom-right cell', () => {
    const grid = computeGrid(buildDays(120), { shape: 'rectangular', rows: 4, columns: 30 });
    expect(grid.cells[3]![29]!.date!.toISOString().slice(0, 10)).toBe(ANCHOR);
    expect(grid.cells[0]![0]!.date!.toISOString().slice(0, 10)).toBe('2025-09-03');
  });

  it('maps data counts into their chronological positions', () => {
    const grid = computeGrid(buildDays(120), { shape: 'rectangular', rows: 4, columns: 30 });
    expect(grid.cells[0]![0]!.contributionCount).toBe(0); // oldest day (28 in 7×4 example)
    expect(grid.cells[3]![29]!.contributionCount).toBe(119); // newest day (01 pinned bottom-right)
    expect(grid.totalContributions).toBe((0 + 119) * 120 / 2);
  });

  it('transposes when rows change but bottom-right stays pinned (7×4 28 → 6×4 24)', () => {
    // User example: 7×4 table 28..01, 6×4 table 24..01, bottom-right 01 pinned, columns transpose.
    const days28 = buildDays(28);
    const grid7 = computeGrid(days28, { shape: 'rectangular', rows: 7, columns: 4 });
    const grid6 = computeGrid(days28, { shape: 'rectangular', rows: 6, columns: 4 });
    // Bottom-right pinned same newest day.
    expect(grid7.cells[6]![3]!.date!.toISOString().slice(0, 10)).toBe(ANCHOR);
    expect(grid6.cells[5]![3]!.date!.toISOString().slice(0, 10)).toBe(ANCHOR);
    expect(grid7.cells[6]![3]!.contributionCount).toBe(27);
    expect(grid6.cells[5]![3]!.contributionCount).toBe(27);
    // Top-left after transpose: 7×4 has 28 (count 0), 6×4 drops earliest 4 and shows 24 (count 4).
    expect(grid7.cells[0]![0]!.contributionCount).toBe(0);
    expect(grid6.cells[0]![0]!.contributionCount).toBe(4);
    // Verify column-major GH-week pattern matches user tables (numbers = 28 - count).
    // 7×4 col 0: 28,27,26,25,24,23,22
    expect(grid7.cells.map((r) => r[0]!.contributionCount)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    // 6×4 col 0: 24,23,22,21,20,19
    expect(grid6.cells.map((r) => r[0]!.contributionCount)).toEqual([4, 5, 6, 7, 8, 9]);
  });
});

describe('computeGrid custom rectangular padding and extremes', () => {
  it('pads young accounts with empty leading cells (date null, count 0, NONE)', () => {
    const grid = computeGrid(buildDays(10), { shape: 'rectangular', rows: 4, columns: 30 });
    expect(grid.cells.flat()).toHaveLength(120);
    // First 110 cells have no history — column-major: idx = col*rows+row
    for (let i = 0; i < 110; i++) {
      const cell = grid.cells[i % 4]![Math.floor(i / 4)]!;
      expect(cell.date).toBeNull();
      expect(cell.contributionCount).toBe(0);
      expect(cell.contributionLevel).toBe('NONE');
    }
    // The 10 known days occupy the trailing positions (idx 110..119), ending bottom-right.
    expect(grid.cells[3]![29]!.date!.toISOString().slice(0, 10)).toBe(ANCHOR);
    // idx 110 = col 27 row 2 is the earliest of the 10 (2025-12-22)
    expect(grid.cells[2]![27]!.date!.toISOString().slice(0, 10)).toBe('2025-12-22');
    expect(grid.cells[3]![29]!.contributionCount).toBe(9);
  });

  it('renders a 1×52 strip', () => {
    const grid = computeGrid(buildDays(52), { shape: 'rectangular', rows: 1, columns: 52 });
    expect(grid.rows).toBe(1);
    expect(grid.columns).toBe(52);
    expect(grid.cells).toHaveLength(1);
    expect(grid.cells[0]).toHaveLength(52);
    expect(grid.cells[0]![51]!.date!.toISOString().slice(0, 10)).toBe(ANCHOR);
  });

  it('renders a 52×1 column', () => {
    const grid = computeGrid(buildDays(52), { shape: 'rectangular', rows: 52, columns: 1 });
    expect(grid.rows).toBe(52);
    expect(grid.columns).toBe(1);
    grid.cells.forEach((row) => expect(row).toHaveLength(1));
    expect(grid.cells[51]![0]!.date!.toISOString().slice(0, 10)).toBe(ANCHOR);
    expect(grid.cells[51]![0]!.contributionCount).toBe(51);
  });

  it('renders all-NONE cells when every day has zero contributions', () => {
    const days = buildDays(120).map((d) => ({ ...d, contributionCount: 0 }));
    const grid = computeGrid(days, { shape: 'rectangular', rows: 4, columns: 30 });
    grid.cells.flat().forEach((c) => expect(c.contributionLevel).toBe('NONE'));
    expect(grid.totalContributions).toBe(0);
  });

  it('still rejects an empty days array', () => {
    expect(() => computeGrid([], { shape: 'rectangular', rows: 4, columns: 30 })).toThrow(RangeError);
  });

  it('rejects a product above the 366-day window at compute time', () => {
    expect(() =>
      computeGrid(buildDays(400), { shape: 'rectangular', rows: 20, columns: 20 }),
    ).toThrow(RangeError);
  });
});

describe('custom rectangular default resolution (partial overrides)', () => {
  it('defaults rows to 7 when only columns is given', () => {
    expect(resolveShapeConfig({ shape: 'rectangular', columns: 26 })).toEqual({
      shape: 'rectangular',
      geometry: 'custom',
      rows: 7,
      columns: 26,
    });
  });

  it('defaults columns to 52 when only rows is given', () => {
    expect(resolveShapeConfig({ shape: 'rectangular', rows: 4 })).toEqual({
      shape: 'rectangular',
      geometry: 'custom',
      rows: 4,
      columns: 52,
    });
  });

  it('resolves the empty config to a week-aligned 364-day window rendering 7×52', () => {
    const resolved = resolveShapeConfig({ shape: 'rectangular' });
    expect(resolved).toEqual({ shape: 'rectangular', geometry: 'weeks', days: 364 });
    const grid = computeGrid(buildDays(364), { shape: 'rectangular' });
    expect(grid.rows).toBe(7);
    expect(grid.columns).toBe(52);
    expect(grid.layout).toBe('rectangular');
    expect(shapeDayCount({ shape: 'rectangular' })).toBe(364);
  });

  it('keeps window span consistent across equal-product geometries (proportional resize)', () => {
    const wide = { shape: 'rectangular' as const, rows: 4, columns: 30 };
    const tall = { shape: 'rectangular' as const, rows: 8, columns: 15 };
    const strip = { shape: 'rectangular' as const, rows: 1, columns: 120 };
    for (const config of [wide, tall, strip]) {
      expect(shapeDayCount(config)).toBe(120);
      const anchor = new Date('2026-01-31T00:00:00Z');
      const w = displayWindow(config, anchor);
      expect(Math.round((w.to.getTime() - w.from.getTime()) / 86_400_000)).toBe(120);
    }
    // Same underlying day sequence maps into each geometry without loss (column-major).
    const days = buildDays(120);
    for (const [r, c] of [[4, 30], [8, 15], [1, 120]] as const) {
      const grid = computeGrid(days, { shape: 'rectangular', rows: r, columns: c });
      const colMajorCounts: number[] = [];
      for (let col = 0; col < c; col++) for (let row = 0; row < r; row++) colMajorCounts.push(grid.cells[row]![col]!.contributionCount);
      expect(colMajorCounts).toEqual(Array.from({ length: 120 }, (_, i) => i));
    }
  });
});
