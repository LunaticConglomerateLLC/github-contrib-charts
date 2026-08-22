import { describe, it, expect } from 'vitest';
import { computeStats } from '../../src/stats.js';
import type { ContributionDay } from '../../src/types.js';

function day(date: string, count: number, extra: Partial<ContributionDay> = {}): ContributionDay {
  return {
    date: new Date(date),
    contributionCount: count,
    contributionLevel: count === 0 ? 'NONE' : 'FIRST_QUARTILE',
    commitCount: 0,
    pullRequestCount: 0,
    issueCount: 0,
    reviewCount: 0,
    ...extra,
  };
}

describe('computeStats', () => {
  it('computes totals, breakdowns, and PR review percentage', () => {
    const days = [
      day('2025-12-28', 10, { commitCount: 4, pullRequestCount: 2, issueCount: 1, reviewCount: 3 }),
      day('2025-12-29', 5, { commitCount: 1, pullRequestCount: 1, issueCount: 1, reviewCount: 2 }),
      day('2025-12-30', 0),
    ];
    const stats = computeStats(days);

    expect(stats.totalContributions).toBe(15);
    expect(stats.totalCommits).toBe(5);
    expect(stats.totalPullRequests).toBe(3);
    expect(stats.totalIssues).toBe(2);
    expect(stats.totalReviews).toBe(5);
    // (5 / 15) * 100 = 33.3
    expect(stats.pullRequestReviewPercentage).toBe(33.3);
    expect(stats.activeDays).toBe(2);
  });

  it('returns 0 percentage when there are no contributions', () => {
    const days = [day('2025-12-28', 0), day('2025-12-29', 0)];
    const stats = computeStats(days);
    expect(stats.totalContributions).toBe(0);
    expect(stats.pullRequestReviewPercentage).toBe(0);
    expect(stats.activeDays).toBe(0);
  });

  it('computes the date range from first to last day', () => {
    const days = [day('2025-12-28', 1), day('2025-12-29', 2), day('2025-12-30', 3)];
    const stats = computeStats(days);
    expect(stats.dateRange.from.toISOString().slice(0, 10)).toBe('2025-12-28');
    expect(stats.dateRange.to.toISOString().slice(0, 10)).toBe('2025-12-30');
  });

  it('returns zeroed stats for an empty array (no error)', () => {
    const stats = computeStats([]);
    expect(stats.totalContributions).toBe(0);
    expect(stats.totalCommits).toBe(0);
    expect(stats.pullRequestReviewPercentage).toBe(0);
    expect(stats.activeDays).toBe(0);
  });

  it('computes date range correctly when days are out of order', () => {
    const days = [day('2025-12-30', 3), day('2025-12-28', 1), day('2025-12-29', 2)];
    const stats = computeStats(days);
    expect(stats.dateRange.from.toISOString().slice(0, 10)).toBe('2025-12-28');
    expect(stats.dateRange.to.toISOString().slice(0, 10)).toBe('2025-12-30');
  });

  it('rounds percentage to one decimal place', () => {
    // 1 review / 3 contributions = 33.33... -> 33.3
    const days = [day('2025-12-28', 3, { reviewCount: 1 })];
    const stats = computeStats(days);
    expect(stats.pullRequestReviewPercentage).toBe(33.3);
  });
});