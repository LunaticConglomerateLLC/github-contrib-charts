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
  it('defaults to rectangular with 365 days', () => {
    expect(gridShapeConfig({})).toEqual({ shape: 'rectangular', days: 365 });
  });

  it('maps --geometry square --size 8 to a square config', () => {
    expect(gridShapeConfig({ geometry: 'square', size: 8 })).toEqual({ shape: 'square', size: 8 });
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
    expect(gridShapeConfig({ geometry: 'square', size: 5, weeks: 7, layout: '13-by-4' })).toEqual({
      shape: 'square',
      size: 5,
    });
  });

  it('rejects unknown geometry values', () => {
    expect(() => gridShapeConfig({ geometry: 'triangle' })).toThrow(
      "geometry must be 'rectangular' or 'square'",
    );
  });

  it('rejects out-of-bounds days and sizes', () => {
    expect(() => gridShapeConfig({ geometry: 'rectangular', days: 400 })).toThrow(RangeError);
    expect(() => gridShapeConfig({ geometry: 'square', size: 2.5 })).toThrow(RangeError);
  });
});

describe('resolveDateRange', () => {
  it('derives a 365-day window by default', () => {
    const range = resolveDateRange();
    const span = Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000);
    expect(span).toBe(365);
    expect(range.from.getUTCHours()).toBe(0);
  });

  it('derives an N²-day window for square charts', () => {
    const range = resolveDateRange({ geometry: 'square', size: 10 });
    const span = Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000);
    expect(span).toBe(100);
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

  it("warns that --days is ignored when resolving a square geometry", () => {
    const config = gridShapeConfig({ geometry: 'square', size: 8, days: 30 });
    expect(config).toEqual({ shape: 'square', size: 8 });
    expect(console.warn).toHaveBeenCalledWith(
      "[github-contrib-charts] 'days' is ignored for square shapes; use 'size'.",
    );
  });

  it("warns that --size is ignored when resolving a rectangular geometry", () => {
    const config = gridShapeConfig({ geometry: 'rectangular', days: 30, size: 8 });
    expect(config).toEqual({ shape: 'rectangular', days: 30 });
    expect(console.warn).toHaveBeenCalledWith(
      "[github-contrib-charts] 'size' is ignored for rectangular shapes; use 'days'.",
    );
  });

  it("warns that --size is ignored when --days resolves without explicit geometry", () => {
    const config = gridShapeConfig({ days: 30, size: 8 });
    expect(config).toEqual({ shape: 'rectangular', days: 30 });
    expect(console.warn).toHaveBeenCalledWith(
      "[github-contrib-charts] 'size' is ignored for rectangular shapes; use 'days'.",
    );
  });

  it('stays silent without conflicting dimension flags', () => {
    gridShapeConfig({ geometry: 'square', size: 8 });
    gridShapeConfig({ geometry: 'rectangular', days: 30 });
    gridShapeConfig({ days: 30 });
    gridShapeConfig({ geometry: 'square' });
    expect(console.warn).not.toHaveBeenCalled();
  });
});

describe('CLI renderers are shape-aware', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an N×N square grid through the PNG SVG builder', () => {
    const grid = computeGrid(daysEndingAt(100), { shape: 'square', size: 10 });
    const svg = buildContributionSvg(grid, {} as never, { cellShape: 'circle' });
    expect(svg).toContain('viewBox="0 0 150 150"');
    expect(svg.match(/<circle /g)).toHaveLength(100);
  });

  it('renders a rectangular grid through the PNG SVG builder', () => {
    const grid = computeGrid(daysEndingAt(14), { shape: 'rectangular', days: 14 });
    const svg = buildContributionSvg(grid, {} as never, {});
    expect(svg).toContain('viewBox="0 0 30 105"');
    expect(svg.match(/<rect /g)).toHaveLength(14);
  });

  it('computes identical grids from CLI-resolved configs and library configs', () => {
    const options = { geometry: 'square' as const, size: 5 };
    const gridFromCli = computeGrid(daysEndingAt(25), gridShapeConfig(options));
    expect(gridFromCli.rows).toBe(5);
    expect(gridFromCli.columns).toBe(5);
    expect(gridFromCli.totalContributions).toBe(325); // sum 1..25
  });
});
