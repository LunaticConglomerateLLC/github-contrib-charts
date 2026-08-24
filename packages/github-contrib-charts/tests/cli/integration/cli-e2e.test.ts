import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ContributionDay, ContributionGrid, ContributionStats } from '../../../src/types.js';

const coreMock = vi.hoisted(() => ({
  fetchContributions: vi.fn(),
  computeStats: vi.fn(),
  computeGrid: vi.fn(),
}));

const sharpMock = vi.hoisted(() => ({
  png: vi.fn(),
}));

const fsMock = vi.hoisted(() => ({
  writeFile: vi.fn(),
}));

vi.mock('../../../src/fetch.js', () => ({ fetchContributions: coreMock.fetchContributions }));
vi.mock('../../../src/grid.js', () => ({ computeGrid: coreMock.computeGrid }));
vi.mock('../../../src/stats.js', () => ({ computeStats: coreMock.computeStats }));

vi.mock('sharp', () => ({
  default: vi.fn(() => ({ png: sharpMock.png })),
}));

vi.mock('node:fs/promises', () => ({ writeFile: fsMock.writeFile }));

import { run } from '../../../src/cli/cli.js';

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
    [{ date: new Date('2025-01-05T00:00:00Z'), dateRange: null, contributionCount: 1, contributionLevel: 'FIRST_QUARTILE' }],
  ],
  rows: 1,
  columns: 1,
  layout: 'n-by-7',
  totalContributions: 1,
};

const originalStdout = process.stdout.write;
const originalStderr = process.stderr.write;

afterEach(() => {
  process.stdout.write = originalStdout;
  process.stderr.write = originalStderr;
  vi.clearAllMocks();
});

beforeEach(() => {
  coreMock.fetchContributions.mockResolvedValue(days);
  coreMock.computeStats.mockReturnValue(stats);
  coreMock.computeGrid.mockReturnValue(grid);
  sharpMock.png.mockReturnValue({ toBuffer: async () => Buffer.from('PNG') });
  fsMock.writeFile.mockResolvedValue(undefined);
});

describe('CLI end-to-end (mocked data pipeline)', () => {
  it('resolves token from GITHUB_TOKEN env and fetches data', async () => {
    process.env.GITHUB_TOKEN = 'envtok';
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const code = await run('octocat', { format: 'text' });
    expect(code).toBe(0);
    expect(coreMock.fetchContributions).toHaveBeenCalledWith(
      'envtok',
      'octocat',
      expect.any(Object),
    );
    delete process.env.GITHUB_TOKEN;
  });

  it('writes a PNG file with the expected path when format is png', async () => {
    const code = await run('octocat', { format: 'png', token: 'tok', output: '/tmp/chart' });
    expect(code).toBe(0);
    expect(fsMock.writeFile).toHaveBeenCalledWith('/tmp/chart-chart.png', expect.any(Buffer));
  });

  it('prints the text summary to stdout for text format', async () => {
    const writes: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      writes.push(String(chunk));
      return true;
    });
    const code = await run('octocat', { format: 'text', token: 'tok' });
    expect(code).toBe(0);
    expect(writes.join('')).toContain('GitHub Contribution Chart for octocat');
  });
});