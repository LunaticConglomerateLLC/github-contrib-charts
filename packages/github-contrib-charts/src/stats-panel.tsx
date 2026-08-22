import type { JSX } from 'react';
import type { ContributionStats } from './types.js';

/** Renders derived contribution statistics as a compact panel. */
export function ContributionStats({ stats }: { stats: ContributionStats }): JSX.Element {
  return (
    <div data-testid="contribution-stats" style={{ marginTop: 8, fontSize: 12, lineHeight: 1.5 }}>
      <div>
        <strong>{stats.totalContributions}</strong> contributions in the last year
      </div>
      <div>
        Commits: {stats.totalCommits} · PRs: {stats.totalPullRequests} · Issues: {stats.totalIssues} · Reviews:{' '}
        {stats.totalReviews}
      </div>
      <div>PR review: {stats.pullRequestReviewPercentage}% of contributions</div>
    </div>
  );
}