import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ContributionDay, ContributionGrid, ContributionStats } from '../../../src/types.js';

const coreMock = vi.hoisted(() => ({
  fetchContributions: vi.fn(),
  computeStats: vi.fn(),
  computeGrid: vi.fn(),
}));

vi.mock('../../../src/fetch.js', () => ({ fetchContributions: coreMock.fetchContributions }));
vi.mock('../../../src/grid.js', () => ({ computeGrid: coreMock.computeGrid }));
vi.mock('../../../src/stats.js', () => ({ computeStats: coreMock.computeStats }));

import { renderText, formatText } from '../../../src/cli/index.js';

const days: ContributionDay[] = [
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

const stats: ContributionStats = {
  totalContributions: 10,
  totalCommits: 5,
  totalPullRequests: 2,
  totalIssues: 1,
  totalReviews: 2,
  pullRequestReviewPercentage: 20,
  activeDays: 4,
  dateRange: { from: new Date('2025-01-01T00:00:00Z'), to: new Date('2026-01-01T00:00:00Z') },
};

const grid: ContributionGrid = {
  cells: [
    [
      { date: new Date('2025-01-05T00:00:00Z'), dateRange: null, contributionCount: 1, contributionLevel: 'FIRST_QUARTILE' },
      { date: null, dateRange: null, contributionCount: 0, contributionLevel: 'NONE' },
    ],
  ],
  rows: 1,
  columns: 2,
  layout: 'n-by-7',
  totalContributions: 1,
};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
afterEach(() => {
  if (GITHUB_TOKEN === undefined) delete process.env.GITHUB_TOKEN;
  else process.env.GITHUB_TOKEN = GITHUB_TOKEN;
});

beforeEach(() => {
  vi.clearAllMocks();
  coreMock.fetchContributions.mockResolvedValue(days);
  coreMock.computeStats.mockReturnValue(stats);
  coreMock.computeGrid.mockReturnValue(grid);
});

describe('renderText', () => {
  it('returns a summary containing the username and totals', async () => {
    const out = await renderText('octocat', { token: 'tok' });
    expect(out).toContain('octocat');
    expect(out).toContain('Total Contributions: 10');
    expect(out).toContain('Commits:');
    expect(out).toContain('PRs:');
    expect(out).toContain('Issues:');
    expect(out).toContain('Reviews:');
    expect(out).toContain('20%');
  });

  it('calls fetchContributions with resolved token and date range', async () => {
    process.env.GITHUB_TOKEN = 'envtok';
    await renderText('octocat');
    expect(coreMock.fetchContributions).toHaveBeenCalledTimes(1);
    const [token, username] = coreMock.fetchContributions.mock.calls[0]!;
    expect(token).toBe('envtok');
    expect(username).toBe('octocat');
  });

  it('builds a grid representation with one glyph per cell', async () => {
    const out = await renderText('octocat', { token: 'tok' });
    // 1 row x 2 cols, two characters per cell
    expect(out).toContain('Grid (1×2, n-by-7):');
  });

  it('uses a rectangular 365-day chart by default and keeps deprecated layouts working', async () => {
    await renderText('octocat', { token: 'tok' });
    expect(coreMock.computeGrid).toHaveBeenCalledWith(days, { shape: 'rectangular', days: 365 });
    await renderText('octocat', { token: 'tok', layout: '13-by-4' });
    expect(coreMock.computeGrid).toHaveBeenLastCalledWith(days, {
      type: '13-by-4',
      weeks: undefined,
    });
  });

  it('applies the weeks option for n-by-7 layout', async () => {
    await renderText('octocat', { token: 'tok', weeks: 7 });
    expect(coreMock.computeGrid).toHaveBeenCalledWith(days, { type: 'n-by-7', weeks: 7 });
  });

  it('propagates fetch errors', async () => {
    coreMock.fetchContributions.mockRejectedValue(new Error('boom'));
    await expect(renderText('octocat', { token: 'tok' })).rejects.toThrow('boom');
  });
});

describe('formatText glyphs', () => {
  it('renders one glyph style per contribution level plus empty and zero cells', () => {
    const gridAll: ContributionGrid = {
      cells: [
        [
          { date: null, dateRange: null, contributionCount: 0, contributionLevel: 'NONE' },
          { date: new Date('2025-01-01T00:00:00Z'), dateRange: null, contributionCount: 0, contributionLevel: 'NONE' },
          { date: new Date('2025-01-02T00:00:00Z'), dateRange: null, contributionCount: 1, contributionLevel: 'FIRST_QUARTILE' },
          { date: new Date('2025-01-03T00:00:00Z'), dateRange: null, contributionCount: 2, contributionLevel: 'SECOND_QUARTILE' },
          { date: new Date('2025-01-04T00:00:00Z'), dateRange: null, contributionCount: 3, contributionLevel: 'THIRD_QUARTILE' },
          { date: new Date('2025-01-05T00:00:00Z'), dateRange: null, contributionCount: 4, contributionLevel: 'FOURTH_QUARTILE' },
        ],
      ],
      rows: 1,
      columns: 6,
      layout: 'n-by-7',
      totalContributions: 10,
    };
    const out = formatText('octocat', stats, gridAll);
    expect(out).toContain('  ');
    expect(out).toContain('··');
    expect(out).toContain('░░');
    expect(out).toContain('▒▒');
    expect(out).toContain('▓▓');
    expect(out).toContain('██');
    expect(out).toContain('Period: 2025-01-01 to 2026-01-01');
  });
});