import { describe, it, expect, vi, beforeEach } from 'vitest';

const coreMock = vi.hoisted(() => ({
  fetchContributions: vi.fn(),
  computeStats: vi.fn(),
  computeGrid: vi.fn(),
}));

const sharpMock = vi.hoisted(() => ({
  png: vi.fn(),
}));

vi.mock('../../../src/fetch.js', () => ({ fetchContributions: coreMock.fetchContributions }));
vi.mock('../../../src/grid.js', () => ({ computeGrid: coreMock.computeGrid }));
vi.mock('../../../src/stats.js', () => ({ computeStats: coreMock.computeStats }));

vi.mock('sharp', () => ({
  default: vi.fn(() => ({ png: sharpMock.png })),
}));

import { renderText, renderPng, buildCli } from '../../../src/cli/index.js';

const days = [
  {
    date: new Date('2025-01-01T00:00:00Z'),
    contributionCount: 1,
    contributionLevel: 'FIRST_QUARTILE',
    commitCount: 1,
    pullRequestCount: 0,
    issueCount: 0,
    reviewCount: 0,
  },
];

const stats = {
  totalContributions: 10,
  totalCommits: 5,
  totalPullRequests: 2,
  totalIssues: 1,
  totalReviews: 2,
  pullRequestReviewPercentage: 20,
  activeDays: 4,
  dateRange: { from: new Date('2025-01-01T00:00:00Z'), to: new Date('2026-01-01T00:00:00Z') },
};

const grid = {
  cells: [
    [{ date: new Date('2025-01-05T00:00:00Z'), dateRange: null, contributionCount: 1, contributionLevel: 'FIRST_QUARTILE' }],
  ],
  rows: 1,
  columns: 1,
  layout: 'n-by-7',
  totalContributions: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  coreMock.fetchContributions.mockResolvedValue(days);
  coreMock.computeStats.mockReturnValue(stats);
  coreMock.computeGrid.mockReturnValue(grid);
  sharpMock.png.mockReturnValue({ toBuffer: async () => Buffer.from('PNG') });
});

describe('@wearelunatic/github-contrib-charts CLI public API', () => {
  it('exports renderText as a function', () => {
    expect(typeof renderText).toBe('function');
  });

  it('exports renderPng as a function', () => {
    expect(typeof renderPng).toBe('function');
  });

  it('exports buildCli as a function', () => {
    expect(typeof buildCli).toBe('function');
  });

  it('renderText returns a string', async () => {
    const out = await renderText('octocat', { token: 'tok' });
    expect(typeof out).toBe('string');
  });

  it('renderPng returns a Buffer', async () => {
    const buf = await renderPng('octocat', { token: 'tok' });
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it('renderText with --rows 4 --columns 30 fetches 120-day window and renders 4×30 grid', async () => {
    const customGrid = {
      cells: Array.from({ length: 4 }, () => Array.from({ length: 30 }, () => ({ date: new Date('2025-01-01T00:00:00Z'), dateRange: null, contributionCount: 1, contributionLevel: 'FIRST_QUARTILE' }))),
      rows: 4,
      columns: 30,
      layout: 'rectangular',
      totalContributions: 120,
    };
    coreMock.computeGrid.mockReturnValue(customGrid);
    const out = await renderText('octocat', { token: 'tok', rows: 4, columns: 30 });
    expect(coreMock.fetchContributions).toHaveBeenCalledTimes(1);
    const range = coreMock.fetchContributions.mock.calls[0]![2] as { from: Date; to: Date };
    const span = Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000);
    expect(span).toBe(120);
    expect(coreMock.computeGrid).toHaveBeenCalledWith(expect.anything(), { shape: 'rectangular', rows: 4, columns: 30 });
    expect(out).toContain('Grid (4×30');
  });

  it('rejects --rows with --days as mutually exclusive before fetch', async () => {
    await expect(renderText('octocat', { token: 'tok', rows: 4, days: 90 } as never)).rejects.toThrow(RangeError);
    expect(coreMock.fetchContributions).not.toHaveBeenCalled();
  });

  it('rejects --rows with --size as ambiguous geometry before fetch', async () => {
    await expect(renderText('octocat', { token: 'tok', rows: 4, size: 10 } as never)).rejects.toThrow(RangeError);
    expect(coreMock.fetchContributions).not.toHaveBeenCalled();
  });

  it('applies partial defaults: --columns 26 alone yields 7×26', async () => {
    const grid26 = {
      cells: Array.from({ length: 7 }, () => Array.from({ length: 26 }, () => ({ date: new Date('2025-01-01T00:00:00Z'), dateRange: null, contributionCount: 0, contributionLevel: 'NONE' }))),
      rows: 7,
      columns: 26,
      layout: 'rectangular',
      totalContributions: 0,
    };
    coreMock.computeGrid.mockReturnValue(grid26);
    await renderText('octocat', { token: 'tok', columns: 26 });
    expect(coreMock.computeGrid).toHaveBeenCalledWith(expect.anything(), { shape: 'rectangular', rows: 7, columns: 26 });
  });
});