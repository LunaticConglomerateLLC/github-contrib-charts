import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ContributionDay, ContributionGrid, ContributionStats } from '../../../src/types.js';

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
  default: vi.fn(() => ({
    png: sharpMock.png,
  })),
}));

import sharp from 'sharp';
import { renderPng, buildContributionSvg } from '../../../src/cli/index.js';

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
      { date: new Date('2025-01-05T00:00:00Z'), dateRange: null, contributionCount: 1, contributionLevel: 'FOURTH_QUARTILE' },
      { date: null, dateRange: null, contributionCount: 0, contributionLevel: 'NONE' },
    ],
  ],
  rows: 1,
  columns: 2,
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

describe('renderPng', () => {
  it('renders a PNG buffer via sharp', async () => {
    sharpMock.png.mockReturnValue({ toBuffer: async () => Buffer.from('imagedata') });
    const buf = await renderPng('octocat', { token: 'tok' });
    expect(buf.toString()).toBe('imagedata');
    expect(sharp).toHaveBeenCalledTimes(1);
    expect(sharpMock.png).toHaveBeenCalledTimes(1);
  });

  it('feeds an SVG string to sharp', async () => {
    await renderPng('octocat', { token: 'tok' });
    const arg = (sharp as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(arg).toBeInstanceOf(Buffer);
    expect(arg.toString()).toContain('<svg');
  });
});

describe('buildContributionSvg', () => {
  it('produces valid SVG with one shape per cell', () => {
    const svg = buildContributionSvg(grid, stats, { token: 'tok' });
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg.match(/<rect /g)?.length).toBe(2);
  });

  it('renders circles when shape is circle', () => {
    const svg = buildContributionSvg(grid, stats, { shape: 'circle' });
    expect(svg.match(/<circle /g)?.length).toBe(2);
    expect(svg).not.toContain('<rect ');
  });

  it('renders rounded-rect when shape is rounded-rect', () => {
    const svg = buildContributionSvg(grid, stats, { shape: 'rounded-rect' });
    expect(svg.match(/<rect /g)?.length).toBe(2);
    expect(svg).toContain('rx=');
  });

  it('applies theme colors', () => {
    const svg = buildContributionSvg(grid, stats, { theme: 'github-dark' });
    // NONE cell -> github-dark zero color
    expect(svg).toContain('#161b22');
  });

  it('honors requested resolution via width/height attributes', () => {
    const svg = buildContributionSvg(grid, stats, { resolution: '1200x800' });
    expect(svg).toContain('width="1200"');
    expect(svg).toContain('height="800"');
  });

  it('renders square cells by default with rx=0', () => {
    const svg = buildContributionSvg(grid, stats, {});
    expect(svg).toContain('<rect ');
    expect(svg).toContain('rx="0"');
  });

  it('uses custom color stops when provided via theme', () => {
    const svg = buildContributionSvg(grid, stats, {
      theme: [
        { level: 'NONE', color: '#000000' },
        { level: 'FIRST_QUARTILE', color: '#111111' },
        { level: 'SECOND_QUARTILE', color: '#222222' },
        { level: 'THIRD_QUARTILE', color: '#333333' },
        { level: 'FOURTH_QUARTILE', color: '#444444' },
      ],
    });
    expect(svg).toContain('#000000');
  });
});