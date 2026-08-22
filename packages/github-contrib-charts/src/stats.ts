import type { ContributionDay, ContributionStats } from './types.js';

/**
 * Computes aggregate statistics from contribution data.
 * Returns zeroed stats (not an error) for an empty array.
 */
export function computeStats(days: ContributionDay[]): ContributionStats {
  let totalContributions = 0;
  let totalCommits = 0;
  let totalPullRequests = 0;
  let totalIssues = 0;
  let totalReviews = 0;
  let activeDays = 0;

  let firstDate: Date | null = null;
  let lastDate: Date | null = null;

  for (const d of days) {
    totalContributions += d.contributionCount;
    totalCommits += d.commitCount;
    totalPullRequests += d.pullRequestCount;
    totalIssues += d.issueCount;
    totalReviews += d.reviewCount;
    if (d.contributionCount > 0) activeDays++;
    if (firstDate === null || d.date < firstDate) firstDate = d.date;
    if (lastDate === null || d.date > lastDate) lastDate = d.date;
  }

  const percentage =
    totalContributions > 0 ? Math.round((totalReviews / totalContributions) * 1000) / 10 : 0;

  return {
    totalContributions,
    totalCommits,
    totalPullRequests,
    totalIssues,
    totalReviews,
    pullRequestReviewPercentage: percentage,
    activeDays,
    dateRange: {
      from: firstDate ?? new Date(0),
      to: lastDate ?? new Date(0),
    },
  };
}