import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContributionChart } from '../../../src/chart.js';
import type { ContributionDay, GridCell } from '../../../src/types.js';

function buildDays(): ContributionDay[] {
  // A full week: Sunday 2025-12-28 .. Saturday 2026-01-03 with ascending counts.
  const start = new Date('2025-12-28T00:00:00Z');
  const days: ContributionDay[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(start);
    dt.setUTCDate(start.getUTCDate() + i);
    days.push({
      date: new Date(dt.toISOString().slice(0, 10) + 'T00:00:00Z'),
      contributionCount: i,
      contributionLevel: i === 0 ? 'NONE' : 'FIRST_QUARTILE',
      commitCount: 0,
      pullRequestCount: 0,
      issueCount: 0,
      reviewCount: 0,
    });
  }
  return days;
}

describe('ContributionChart', () => {
  it('renders an SVG chart', () => {
    const { container } = render(
      <ContributionChart
        data={buildDays()}
        autoFetch={false}
        gridLayout={{ type: 'n-by-7', weeks: 1 }}
        cellShape="square"
        colorTheme="github-light"
        showLegend
        showStats={false}
      />,
    );
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders one cell per grid cell (7 for a single week)', () => {
    const { container } = render(
      <ContributionChart
        data={buildDays()}
        autoFetch={false}
        gridLayout={{ type: 'n-by-7', weeks: 1 }}
        cellShape="square"
        colorTheme="github-light"
        showLegend={false}
        showStats={false}
      />,
    );
    expect(container.querySelectorAll('rect')).toHaveLength(7);
  });

  it('renders cells with the chosen shape', () => {
    const { container } = render(
      <ContributionChart
        data={buildDays()}
        autoFetch={false}
        gridLayout={{ type: 'n-by-7', weeks: 1 }}
        cellShape="circle"
        colorTheme="github-light"
        showLegend={false}
        showStats={false}
      />,
    );
    expect(container.querySelectorAll('circle')).toHaveLength(7);
    expect(container.querySelectorAll('rect')).toHaveLength(0);
  });

  it('renders the title when provided', () => {
    render(
      <ContributionChart
        data={buildDays()}
        autoFetch={false}
        gridLayout={{ type: 'n-by-7', weeks: 1 }}
        cellShape="square"
        colorTheme="github-light"
        title="My Contributions"
        showLegend={false}
        showStats={false}
      />,
    );
    expect(screen.getByText('My Contributions')).not.toBeNull();
  });

  it('renders a tooltip on cell hover with date and count', () => {
    render(
      <ContributionChart
        data={buildDays()}
        autoFetch={false}
        gridLayout={{ type: 'n-by-7', weeks: 1 }}
        cellShape="square"
        colorTheme="github-light"
        showLegend={false}
        showStats={false}
      />,
    );
    const rect = document.querySelector('rect');
    expect(rect).not.toBeNull();
    // Before hover, no tooltip group exists.
    expect(document.querySelector('[data-tooltip]')).toBeNull();
    fireEvent.mouseEnter(rect!);
    expect(document.querySelector('[data-tooltip]')).not.toBeNull();
    fireEvent.mouseLeave(rect!);
    expect(document.querySelector('[data-tooltip]')).toBeNull();
  });

  it('invokes onCellClick when a cell is clicked', () => {
    const onClick = vi.fn();
    render(
      <ContributionChart
        data={buildDays()}
        autoFetch={false}
        gridLayout={{ type: 'n-by-7', weeks: 1 }}
        cellShape="square"
        colorTheme="github-light"
        showLegend={false}
        showStats={false}
        onCellClick={onClick}
      />,
    );
    const cellG = document.querySelector('[data-cell]');
    fireEvent.click(cellG!);
    expect(onClick).toHaveBeenCalledTimes(1);
    const cell: GridCell = onClick.mock.calls[0][0];
    expect(cell.contributionCount).toBe(0);
  });

  it('uses the GitHub dark theme when colorTheme is github-dark', () => {
    const { container } = render(
      <ContributionChart
        data={buildDays()}
        autoFetch={false}
        gridLayout={{ type: 'n-by-7', weeks: 1 }}
        cellShape="square"
        colorTheme="github-dark"
        showLegend={false}
        showStats={false}
      />,
    );
    const rects = container.querySelectorAll('rect');
    expect(rects[0]!.getAttribute('fill')).toBe('#161b22');
  });

  it('renders a legend and stats panel by default', () => {
    const { container } = render(
      <ContributionChart
        data={buildDays()}
        autoFetch={false}
        gridLayout={{ type: 'n-by-7', weeks: 1 }}
        cellShape="square"
        colorTheme="github-light"
      />,
    );
    expect(container.querySelector('[data-testid="contribution-stats"]')).not.toBeNull();
    expect(container.textContent).toContain('More');
  });

  it('renders n/a in the tooltip for a null-date cell', () => {
    render(
      <ContributionChart
        data={buildDays()}
        autoFetch={false}
        gridLayout={{ type: 'n-by-7', weeks: 1 }}
        cellShape="square"
        colorTheme="github-light"
        showLegend={false}
        showStats={false}
      />,
    );
    const cellG = document.querySelector('[data-cell]');
    fireEvent.mouseEnter(cellG!);
    const tip = document.querySelector('[data-tooltip]');
    expect(tip).not.toBeNull();
  });
});
