import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ContributionDay } from '../../../src/types.js';
import { gridShapeConfig, resolveDateRange } from '../../../src/cli/index.js';
import { buildContributionSvg } from '../../../src/cli/index.js';
import { computeGrid } from '../../../src/grid.js';

function day(dateIso: string, count = 1): ContributionDay {
  return {
    date: new Date(dateIso),
    contributionCount: count,
    contributionLevel: 'FIRST_QUARTILE',
    commitCount: count,
    pullRequestCount: 0,
    issueCount: 0,
    reviewCount: 0,
  };
}

/** Builds n days ending at endIso (UTC). */
function daysEndingAt(n: number, endIso = '2024-01-06'): ContributionDay[] {
  const end = new Date(`${endIso}T00:00:00Z`);
  const out: ContributionDay[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(day(d.toISOString().slice(0, 10), i + 1));
  }
  return out;
}

describe('gridShapeConfig', () => {
  it('defaults to rectangular with 364 days', () => {
    expect(gridShapeConfig({})).toEqual({ shape: 'rectangular', days: 364 });
  });

  it('maps --geometry rectangular --rows 7 --columns 7 to 7×7 rectangular (square replacement)', () => {
    expect(gridShapeConfig({ geometry: 'rectangular', rows: 7, columns: 7 } as unknown as never)).toEqual({
      shape: 'rectangular',
      rows: 7,
      columns: 7,
    });
  });

  it('maps --days 30 to a rectangular config', () => {
    expect(gridShapeConfig({ days: 30 })).toEqual({ shape: 'rectangular', days: 30 });
  });

  it('keeps deprecated --weeks as an n-by-7 config', () => {
    expect(gridShapeConfig({ weeks: 7 })).toEqual({ type: 'n-by-7', weeks: 7 });
  });

  it('keeps deprecated 13-by-4 layout configs', () => {
    expect(gridShapeConfig({ layout: '13-by-4' })).toEqual({ type: '13-by-4', weeks: undefined });
  });

  it('prefers explicit geometry over deprecated flags', () => {
    expect(
      gridShapeConfig({ geometry: 'rectangular', rows: 5, columns: 5, weeks: 7, layout: '13-by-4' } as unknown as never),
    ).toEqual({
      shape: 'rectangular',
      rows: 5,
      columns: 5,
    });
  });

  it('rejects unknown geometry values', () => {
    expect(() => gridShapeConfig({ geometry: 'triangle' } as unknown as never)).toThrow(
      "geometry must be 'rectangular' (square removed",
    );
  });

  it('rejects out-of-bounds days and rows/columns', () => {
    expect(() => gridShapeConfig({ geometry: 'rectangular', days: 400 } as unknown as never)).toThrow(RangeError);
    expect(() => gridShapeConfig({ rows: 0, columns: 10 } as unknown as never)).toThrow(RangeError);
  });
});

describe('resolveDateRange', () => {
  it('derives a 364-day window by default', () => {
    const range = resolveDateRange();
    const span = Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000);
    expect(span).toBe(364);
    expect(range.from.getUTCHours()).toBe(0);
  });

  it('derives a rectangular 7×7 window (49 days, square replacement)', () => {
    const range = resolveDateRange({ rows: 7, columns: 7 } as unknown as never);
    const span = Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000);
    expect(span).toBe(49);
  });

  it('caps legacy week-based windows at 366 days', () => {
    const range = resolveDateRange({ weeks: 52 });
    const span = Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000);
    expect(span).toBe(364); // 52*7=364 days
  });
});

describe('gridShapeConfig cross-mode warnings', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects --size even when resolving a rectangular geometry (FR-017)', () => {
    expect(() => gridShapeConfig({ geometry: 'rectangular', days: 30, size: 8 } as unknown as never)).toThrow(
      /square mode removed/i,
    );
  });

  it('rejects --size even when --days resolves without explicit geometry (FR-017)', () => {
    expect(() => gridShapeConfig({ days: 30, size: 8 } as unknown as never)).toThrow(/square mode removed/i);
  });

  it('stays silent without conflicting dimension flags', () => {
    gridShapeConfig({ geometry: 'rectangular', days: 30 });
    gridShapeConfig({ days: 30 });
    gridShapeConfig({ rows: 7, columns: 7 } as unknown as never);
    expect(console.warn).not.toHaveBeenCalled();
  });
});

describe('CLI renderers are shape-aware', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a 7×7 rectangular grid through the PNG SVG builder (square replacement)', () => {
    const grid = computeGrid(daysEndingAt(49), { shape: 'rectangular', rows: 7, columns: 7 });
    const svg = buildContributionSvg(grid, {} as never, { cellShape: 'circle' });
    expect(svg).toContain('viewBox="0 0 105 105"');
    expect(svg.match(/<circle /g)).toHaveLength(49);
  });

  it('renders a rectangular grid through the PNG SVG builder', () => {
    const grid = computeGrid(daysEndingAt(14), { shape: 'rectangular', days: 14 });
    const svg = buildContributionSvg(grid, {} as never, {});
    expect(svg).toContain('viewBox="0 0 30 105"');
    expect(svg.match(/<rect /g)).toHaveLength(14);
  });

  it('computes identical grids from CLI-resolved configs and library configs', () => {
    const options = { rows: 5, columns: 5 } as unknown as never;
    const gridFromCli = computeGrid(daysEndingAt(25), gridShapeConfig(options));
    expect(gridFromCli.rows).toBe(5);
    expect(gridFromCli.columns).toBe(5);
    expect(gridFromCli.totalContributions).toBe(325); // sum 1..25
  });
});

describe('gridShapeConfig rectangular custom rows/columns (T019)', () => {
  it('--rows 4 --columns 30 → rectangular custom', () => {
    expect(gridShapeConfig({ rows: 4, columns: 30 } as unknown as never)).toEqual({
      shape: 'rectangular',
      rows: 4,
      columns: 30,
    });
  });

  it('--columns 26 alone → 7×26 (rows defaults to 7)', () => {
    expect(gridShapeConfig({ columns: 26 } as unknown as never)).toEqual({
      shape: 'rectangular',
      rows: 7,
      columns: 26,
    });
  });

  it('--rows 4 alone → 4×52 (columns defaults to 52)', () => {
    expect(gridShapeConfig({ rows: 4 } as unknown as never)).toEqual({
      shape: 'rectangular',
      rows: 4,
      columns: 52,
    });
  });

  it('--rows 4 --days 90 → RangeError listing mutually exclusive options', () => {
    expect(() => gridShapeConfig({ rows: 4, days: 90 } as unknown as never)).toThrow(RangeError);
    expect(() => gridShapeConfig({ rows: 4, days: 90 } as unknown as never)).toThrow(
      "'days' cannot be combined with 'rows'/'columns'",
    );
  });

  it('--rows 4 --size 10 → RangeError (ambiguous geometry)', () => {
    expect(() => gridShapeConfig({ rows: 4, size: 10 } as unknown as never)).toThrow(RangeError);
  });

  it('--geometry rectangular --rows 4 valid', () => {
    expect(gridShapeConfig({ geometry: 'rectangular', rows: 4 } as unknown as never)).toEqual({
      shape: 'rectangular',
      rows: 4,
      columns: 52,
    });
  });

  it('resolveDateRange respects custom rows×columns count', () => {
    const range = resolveDateRange({ rows: 4, columns: 30 } as unknown as never);
    const span = Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000);
    expect(span).toBe(120);
  });
});

describe('square mode removal CLI (FR-017 breaking)', () => {
  it('--size 7 → RangeError square removed', () => {
    expect(() => gridShapeConfig({ size: 7 } as unknown as never)).toThrow(RangeError);
    expect(() => gridShapeConfig({ size: 7 } as unknown as never)).toThrow(/square mode removed/i);
  });
  it('--geometry square → RangeError square removed', () => {
    expect(() => gridShapeConfig({ geometry: 'square' } as unknown as never)).toThrow(RangeError);
    expect(() => gridShapeConfig({ geometry: 'square', rows: 7 } as unknown as never)).toThrow(/square mode removed/i);
  });
  it('shape square via code → RangeError', () => {
    expect(() => gridShapeConfig({ geometry: 'square', size: 5 } as unknown as never)).toThrow(RangeError);
  });
});
