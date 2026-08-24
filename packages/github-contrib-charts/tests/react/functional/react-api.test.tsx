import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ContributionChart, ContributionStats, GITHUB_LIGHT, GITHUB_DARK, colorFor } from '../../../src/index.js';
import type { ContributionDay, ContributionGrid, ContributionStats as Stats } from '../../../src/types.js';

describe('@wearelunatic/github-contrib-charts React public API', () => {
  it('exports ContributionChart as a callable component', () => {
    expect(typeof ContributionChart).toBe('function');
  });

  it('exports ContributionStats as a callable component', () => {
    expect(typeof ContributionStats).toBe('function');
  });

  it('exports colour theme presets and colorFor', () => {
    expect(GITHUB_LIGHT).toHaveLength(5);
    expect(GITHUB_DARK).toHaveLength(5);
    expect(typeof colorFor(GITHUB_LIGHT, 'NONE')).toBe('string');
  });

  it('renders a stats panel from the ContributionStats component', () => {
    const stats: Stats = {
      totalContributions: 10,
      totalCommits: 4,
      totalPullRequests: 2,
      totalIssues: 1,
      totalReviews: 3,
      pullRequestReviewPercentage: 30,
      activeDays: 2,
      dateRange: { from: new Date('2025-12-28'), to: new Date('2026-01-03') },
    };
    const { container } = render(<ContributionStats stats={stats} />);
    expect(container.textContent).toContain('10');
    expect(container.textContent).toContain('30%');
  });
});

describe('re-exports from @wearelunatic/github-contrib-charts', () => {
  it('allows importing core types through the root entry (compile-time)', () => {
    const grid: ContributionGrid = {
      cells: [],
      rows: 0,
      columns: 0,
      layout: 'n-by-7',
      totalContributions: 0,
    };
    const day: ContributionDay = {
      date: new Date(),
      contributionCount: 0,
      contributionLevel: 'NONE',
      commitCount: 0,
      pullRequestCount: 0,
      issueCount: 0,
      reviewCount: 0,
    };
    expect(grid.columns).toBe(0);
    expect(day.contributionCount).toBe(0);
  });
});