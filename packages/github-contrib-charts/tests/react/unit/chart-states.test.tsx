import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ContributionChart } from '../../../src/chart.js';
import type { ContributionDay } from '../../../src/types.js';

function emptyDays(): ContributionDay[] {
  const start = new Date('2025-12-28T00:00:00Z');
  const days: ContributionDay[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(start);
    dt.setUTCDate(start.getUTCDate() + i);
    days.push({
      date: new Date(dt.toISOString().slice(0, 10) + 'T00:00:00Z'),
      contributionCount: 0,
      contributionLevel: 'NONE',
      commitCount: 0,
      pullRequestCount: 0,
      issueCount: 0,
      reviewCount: 0,
    });
  }
  return days;
}

describe('ContributionChart states', () => {
  it('renders a full grid with all cells at NONE level for empty data', () => {
    const { container } = render(
      <ContributionChart
        data={emptyDays()}
        autoFetch={false}
        gridLayout={{ type: 'n-by-7', weeks: 1 }}
        cellShape="square"
        colorTheme="github-light"
        showLegend={false}
        showStats={false}
      />,
    );
    const rects = container.querySelectorAll('rect');
    expect(rects).toHaveLength(7);
    rects.forEach((r) => expect(r.getAttribute('fill')).toBe('#ebedf0'));
  });

  it('throws a RangeError when data is empty and no autoFetch', () => {
    expect(() =>
      render(
        <ContributionChart
          data={[]}
          autoFetch={false}
          gridLayout={{ type: 'n-by-7', weeks: 1 }}
          cellShape="square"
          colorTheme="github-light"
          showLegend={false}
          showStats={false}
        />,
      ),
    ).toThrow(RangeError);
  });
});
