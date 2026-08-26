import { describe, it, expect, vi } from 'vitest';
import { computeGrid } from '../../src/grid.js';
import type { ContributionDay } from '../../src/types.js';

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

/** Builds `count` consecutive days ending at `endIso` (inclusive), chronological. */
function daysEndingAt(count: number, endIso = '2024-01-06'): ContributionDay[] {
  const end = new Date(`${endIso}T00:00:00Z`);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - (count - 1 - i));
    return day(d.toISOString().slice(0, 10), i + 1);
  });
}

const iso = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);

describe('computeGrid rectangular', () => {
  it('days=1 → 7x1 with six padded cells and most recent at bottom-right', () => {
    const grid = computeGrid(daysEndingAt(1), { shape: 'rectangular', days: 1 });

    expect(grid.rows).toBe(7);
    expect(grid.columns).toBe(1);
    expect(grid.layout).toBe('rectangular');

    // First 6 cells padded at top of column 0.
    for (let row = 0; row < 6; row++) {
      const cell = grid.cells[row]![0]!;
      expect(cell.date).toBeNull();
      expect(cell.contributionCount).toBe(0);
      expect(cell.contributionLevel).toBe('NONE');
      expect(cell.dateRange).toBeNull();
    }
    // Most recent day in bottom-right.
    const last = grid.cells[6]![0]!;
    expect(iso(last.date)).toBe('2024-01-06');
    expect(last.contributionCount).toBe(1);
    expect(grid.totalContributions).toBe(1);
  });

  it('days=10 → 7x2 with four padded cells at top of column 0', () => {
    const grid = computeGrid(daysEndingAt(10), { shape: 'rectangular', days: 10 });

    expect(grid.rows).toBe(7);
    expect(grid.columns).toBe(2);

    for (let row = 0; row < 4; row++) {
      const cell = grid.cells[row]![0]!;
      expect(cell.date).toBeNull();
      expect(cell.contributionLevel).toBe('NONE');
    }
    // Earliest populated cell directly below padding.
    expect(iso(grid.cells[4]![0]!.date)).toBe('2023-12-28');
    // Bottom-right is most recent.
    expect(iso(grid.cells[6]![1]!.date)).toBe('2024-01-06');
    expect(grid.totalContributions).toBe(55); // 1+2+...+10
  });

  it('days=14 → 7x2 with no padding, Sunday-aligned rows, chronological column-major order', () => {
    const grid = computeGrid(daysEndingAt(14), { shape: 'rectangular', days: 14 });

    expect(grid.rows).toBe(7);
    expect(grid.columns).toBe(2);
    // No padding: every slot carries a real date starting at the window start.
    expect(iso(grid.cells[0]![0]!.date)).toBe('2023-12-24');
    expect(grid.cells[0]![0]!.contributionCount).toBe(1);
    expect(iso(grid.cells[6]![1]!.date)).toBe('2024-01-06');

    // Every populated cell sits on its weekday row (row 0 = Sunday).
    for (let col = 0; col < grid.columns; col++) {
      for (let row = 0; row < 7; row++) {
        const cell = grid.cells[row]![col]!;
        if (cell.date) expect(cell.date.getUTCDay()).toBe(row);
      }
    }
  });

  it('days=30 → 7x5 grid with five padded cells', () => {
    const grid = computeGrid(daysEndingAt(30), { shape: 'rectangular', days: 30 });

    expect(grid.rows).toBe(7);
    expect(grid.columns).toBe(5);
    expect(iso(grid.cells[0]![0]!.date)).toBeNull();
    expect(iso(grid.cells[5]![0]!.date)).toBe('2023-12-08'); // earliest of 30 days
    expect(iso(grid.cells[6]![4]!.date)).toBe('2024-01-06');
  });

  it('days=365 → 7x53 grid', () => {
    const grid = computeGrid(daysEndingAt(365), { shape: 'rectangular', days: 365 });

    expect(grid.rows).toBe(7);
    expect(grid.columns).toBe(53);
    expect(iso(grid.cells[6]![52]!.date)).toBe('2024-01-06');
  });

  it('days=366 is allowed (leap-year upper bound)', () => {
    const grid = computeGrid(daysEndingAt(366), { shape: 'rectangular', days: 366 });
    expect(grid.rows).toBe(7);
    expect(grid.columns).toBe(Math.ceil(366 / 7));
  });
});

describe('computeGrid rectangular validation', () => {
  it.each([0, -5, 3.5, 1000, 367])('rejects days=%i with a RangeError', (bad) => {
    expect(() =>
      computeGrid(daysEndingAt(10), { shape: 'rectangular', days: bad }),
    ).toThrow(RangeError);
    expect(() =>
      computeGrid(daysEndingAt(10), { shape: 'rectangular', days: bad }),
    ).toThrow(/days must be an integer between 1 and 366/);
  });

  it('rejects an empty days array', () => {
    expect(() => computeGrid([], { shape: 'rectangular', days: 10 })).toThrow(
      'days array must not be empty',
    );
  });

  it('rejects unknown shapes', () => {
    expect(() =>
      computeGrid(daysEndingAt(10), { shape: 'hexagon' } as never),
    ).toThrow(/shape must be 'rectangular'/);
  });
});

describe('computeGrid rectangular 7×7 via rows/columns (FR-017: square removed, use rows==columns)', () => {
  it.each([1, 5, 7, 10, 19])('rows=%i columns=%i → %i×%i grid with column-major chronological ordering', (size) => {
    const grid = computeGrid(daysEndingAt(size * size), {
      shape: 'rectangular',
      rows: size,
      columns: size,
    });

    expect(grid.rows).toBe(size);
    expect(grid.columns).toBe(size);
    expect(grid.layout).toBe('rectangular');

    const first = grid.cells[0]![0]!;
    const last = grid.cells[size - 1]![size - 1]!;
    const expectedFirst = new Date(new Date('2024-01-06T00:00:00Z').getTime() - (size * size - 1) * 86_400_000);
    expect(iso(first.date)).toBe(expectedFirst.toISOString().slice(0, 10));
    expect(iso(last.date)).toBe('2024-01-06');
  });

  it('increments by exactly one day per cell in column-major order (GH week style)', () => {
    const grid = computeGrid(daysEndingAt(25), { shape: 'rectangular', rows: 5, columns: 5 });
    for (let c = 0; c < 5; c++) {
      for (let r = 0; r < 4; r++) {
        const cur = grid.cells[r]![c]!.date!;
        const next = grid.cells[r + 1]![c]!.date!;
        expect(next.getTime() - cur.getTime()).toBe(86_400_000);
      }
      if (c < 4) {
        const bottom = grid.cells[4]![c]!.date!;
        const nextColTop = grid.cells[0]![c + 1]!.date!;
        expect(nextColTop.getTime() - bottom.getTime()).toBe(86_400_000);
      }
    }
  });

  it('does not require weekday alignment', () => {
    // Anchor is a Saturday; cell [0][0] of a 5x5 window is 2023-12-13, a Wednesday (column-major still same start).
    const grid = computeGrid(daysEndingAt(25), { shape: 'rectangular', rows: 5, columns: 5 });
    expect(grid.cells[0]![0]!.date!.getUTCDay()).toBe(3);
  });

  it('rows=1 columns=1 → single cell showing only the most recent day', () => {
    const grid = computeGrid(daysEndingAt(1), { shape: 'rectangular', rows: 1, columns: 1 });
    expect(grid.rows).toBe(1);
    expect(grid.columns).toBe(1);
    expect(iso(grid.cells[0]![0]!.date)).toBe('2024-01-06');
  });

  it('sums contributions over the rows×columns window', () => {
    const count = 100;
    const grid = computeGrid(daysEndingAt(count), { shape: 'rectangular', rows: 10, columns: 10 });
    expect(grid.totalContributions).toBe((count * (count + 1)) / 2);
  });

  it.each([0, -1, 2.5, 400])('rejects rows=%s with a RangeError', (bad) => {
    expect(() =>
      computeGrid(daysEndingAt(10), { shape: 'rectangular', rows: bad as number, columns: 5 }),
    ).toThrow(/rows must be an integer/);
  });

  it('rejects days when given with rows/columns (FR-017)', () => {
    expect(() =>
      computeGrid(daysEndingAt(100), {
        shape: 'rectangular',
        rows: 10,
        columns: 10,
        days: 30,
      } as never),
    ).toThrow(/'days' cannot be combined with 'rows'\/'columns'/);
  });
});

describe('computeGrid edge cases (polish)', () => {
  it('sparse data younger than the window pads earliest cells with NONE', () => {
    // Window of 14 days ending 2024-01-06, but only the last 3 days have data.
    const sparse: ContributionDay[] = [
      day('2024-01-04', 5),
      day('2024-01-05', 10),
      day('2024-01-06', 15),
    ];
    const grid = computeGrid(sparse, { shape: 'rectangular', days: 14 });
    expect(grid.rows).toBe(7);
    expect(grid.columns).toBe(2);
    // Window has no padding (14 days fills 7x2); missing dates are zero cells.
    expect(iso(grid.cells[6]![1]!.date)).toBe('2024-01-06');
    expect(grid.cells[6]![1]!.contributionCount).toBe(15);
    expect(iso(grid.cells[4]![1]!.date)).toBe('2024-01-04');
    // Slots before the earliest available data stay fully empty.
    expect(iso(grid.cells[0]![0]!.date)).toBeNull();
    expect(grid.cells[0]![0]!.contributionLevel).toBe('NONE');
    expect(grid.cells[6]![1]!.contributionCount).toBe(15);
    expect(grid.totalContributions).toBe(30);
    expect(grid.cells.flat().every((c) => c.contributionLevel !== undefined)).toBe(true);
  });

  it('all-zero contributions produce an all-NONE grid', () => {
    const zeros = daysEndingAt(14).map((d) => ({ ...d, contributionCount: 0 }));
    const rect = computeGrid(zeros, { shape: 'rectangular', days: 14 });
    for (const row of rect.cells) {
      for (const cell of row) expect(cell.contributionLevel).toBe('NONE');
    }
    expect(rect.totalContributions).toBe(0);
  });

  it('rectangular 19×19 covers 361 contiguous days in column-major order', () => {
    const grid = computeGrid(daysEndingAt(361), { shape: 'rectangular', rows: 19, columns: 19 });
    expect(grid.rows).toBe(19);
    expect(grid.columns).toBe(19);
    const first = new Date('2023-01-11T00:00:00Z');
    for (let idx = 0; idx < 361; idx += 40) {
      const r = idx % 19;
      const c = Math.floor(idx / 19);
      const expected = new Date(first);
      expected.setUTCDate(first.getUTCDate() + idx);
      expect(iso(grid.cells[r]![c]!.date)).toBe(expected.toISOString().slice(0, 10));
    }
    expect(iso(grid.cells[18]![18]!.date)).toBe('2024-01-06');
  });

  it('identical counts map to identical colours across rectangular modes (FR-018)', () => {
    const data = daysEndingAt(49);
    const rectWeeks = computeGrid(data, { shape: 'rectangular', days: 49 });
    const rectCustom = computeGrid(data, { shape: 'rectangular', rows: 7, columns: 7 });
    const levelsByDate = (g: typeof rectWeeks): Map<string, string> => {
      const map = new Map<string, string>();
      for (const row of g.cells) {
        for (const cell of row) {
          if (cell.date) map.set(cell.date.toISOString().slice(0, 10), cell.contributionLevel);
        }
      }
      return map;
    };
    expect(levelsByDate(rectCustom)).toEqual(levelsByDate(rectWeeks));
    expect([...levelsByDate(rectWeeks).values()]).toContain('FOURTH_QUARTILE');
  });
});

describe('grid empty/missing-date semantics', () => {
  it('padded cells always have count 0, level NONE and date null in both rectangular modes', () => {
    const rect = computeGrid(daysEndingAt(10), { shape: 'rectangular', days: 10 });
    for (let r = 0; r < 4; r++) {
      const cell = rect.cells[r]![0]!;
      expect(cell.contributionCount).toBe(0);
      expect(cell.contributionLevel).toBe('NONE');
      expect(cell.date).toBeNull();
      expect(cell.dateRange).toBeNull();
    }
    const rectCustom = computeGrid(daysEndingAt(100), { shape: 'rectangular', rows: 10, columns: 10 });
    for (const row of rectCustom.cells) {
      for (const cell of row) expect(cell.dateRange).toBeNull();
    }
  });

  it('window max of 0 maps every populated day to NONE', () => {
    const zeros = daysEndingAt(7).map((d) => ({ ...d, contributionCount: 0 }));
    const rect = computeGrid(zeros, { shape: 'rectangular', rows: 7, columns: 7 });
    expect(rect.cells.flat().every((c) => c.contributionLevel === 'NONE')).toBe(true);
  });

  it('totalContributions sums populated days only', () => {
    const data = daysEndingAt(20); // counts 1..20
    const grid = computeGrid(data, { shape: 'rectangular', days: 20 });
    expect(grid.totalContributions).toBe(210);
  });
});
