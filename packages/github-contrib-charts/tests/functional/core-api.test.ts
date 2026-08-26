import { describe, it, expect } from 'vitest';
import * as core from '../../src/index.js';

describe('@wearelunatic/github-contrib-charts public API', () => {
  it('exports fetchContributions', () => {
    expect(typeof core.fetchContributions).toBe('function');
  });

  it('exports computeGrid', () => {
    expect(typeof core.computeGrid).toBe('function');
  });

  it('exports computeStats', () => {
    expect(typeof core.computeStats).toBe('function');
  });

  it('exports error classes', () => {
    expect(core.FetchError).toBeTypeOf('function');
    expect(core.AuthenticationError).toBeTypeOf('function');
    expect(core.UserNotFoundError).toBeTypeOf('function');
    expect(core.RateLimitError).toBeTypeOf('function');
    expect(core.NetworkError).toBeTypeOf('function');
  });

  it('error classes form an instanceof hierarchy', () => {
    const err = new core.AuthenticationError();
    expect(err).toBeInstanceOf(core.FetchError);
    expect(err).toBeInstanceOf(Error);
  });
});
describe('public API: custom rectangular configuration', () => {
  const ANCHOR = new Date('2026-06-30T00:00:00Z');

  function day(date: string, count: number): core.ContributionDay {
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

  function buildDays(n: number): core.ContributionDay[] {
    const end = new Date('2026-06-30T00:00:00Z').getTime();
    return Array.from({ length: n }, (_, i) =>
      day(new Date(end - (n - 1 - i) * 86_400_000).toISOString().slice(0, 10), i % 7),
    );
  }

  it('accepts {rows, columns} end-to-end through the documented pipeline', () => {
    const config = { shape: 'rectangular' as const, rows: 4, columns: 30 };
    expect(core.shapeDayCount(config)).toBe(120);
    const window = core.displayWindow(config, ANCHOR);
    expect(Math.round((window.to.getTime() - window.from.getTime()) / 86_400_000)).toBe(120);
    const grid = core.computeGrid(buildDays(120), config);
    expect(grid.rows).toBe(4);
    expect(grid.columns).toBe(30);
    expect(grid.cells.flat()).toHaveLength(120);
  });

  it.each([
    [{ shape: 'rectangular', rows: 0, columns: 30 }, /rows/],
    [{ shape: 'rectangular', rows: 4, columns: -1 }, /columns/],
    [{ shape: 'rectangular', rows: 2.5 }, /rows/],
    [{ shape: 'rectangular', rows: 20, columns: 20 }, /rows \* columns must not exceed 366 days/],
    [{ shape: 'rectangular', days: 90, rows: 4 }, /'days' cannot be combined/],
    [{ shape: 'rectangular', days: 90, columns: 30 }, /'days' cannot be combined/],
  ] as const)('rejects invalid config %j before any fetch (SC-005)', (config, pattern) => {
    expect(() => core.resolveShapeConfig(config)).toThrow(RangeError);
    expect(() => core.resolveShapeConfig(config)).toThrow(pattern);
  });

  it('exports the new validators and dimension constants', () => {
    expect(typeof core.validateRows).toBe('function');
    expect(typeof core.validateColumns).toBe('function');
    expect(core.DEFAULT_ROWS).toBe(7);
    expect(core.DEFAULT_COLUMNS).toBe(52);
    expect(core.MIN_ROWS).toBe(1);
    expect(core.MIN_COLUMNS).toBe(1);
  });
});
