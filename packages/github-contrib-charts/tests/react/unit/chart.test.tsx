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

describe('ContributionChart rectangular shape (US1)', () => {
  function days14(): ContributionDay[] {
    const start = new Date('2023-12-24T00:00:00Z'); // Sunday
    return Array.from({ length: 14 }, (_, i) => {
      const dt = new Date(start);
      dt.setUTCDate(start.getUTCDate() + i);
      return {
        date: dt,
        contributionCount: i,
        contributionLevel: 'FIRST_QUARTILE',
        commitCount: 0,
        pullRequestCount: 0,
        issueCount: 0,
        reviewCount: 0,
      };
    });
  }

  const baseProps = {
    cellShape: 'square',
    colorTheme: 'github-light',
    showLegend: false,
    showStats: false,
  } as const;

  it('renders exactly 14 cells in 7-row geometry for days=14', () => {
    const { container } = render(
      <ContributionChart {...baseProps} data={days14()} autoFetch={false} shape="rectangular" days={14} />,
    );
    expect(container.querySelectorAll('[data-cell]')).toHaveLength(14);
    const svg = container.querySelector('[data-testid="chart-svg"]')!;
    // height = rows*(CELL+GAP)+GAP = 7*15+3 = 108 (legend hidden)
    expect(svg.getAttribute('height')).toBe('108');
  });

  it('shows a tooltip with ISO date and count on hover', () => {
    const { container } = render(
      <ContributionChart {...baseProps} data={days14()} autoFetch={false} shape="rectangular" days={14} />,
    );
    const cells = container.querySelectorAll('[data-cell]');
    fireEvent.mouseEnter(cells[13]!);
    const tip = document.querySelector('[data-tooltip]')!;
    expect(tip.textContent).toContain('2024-01-06');
    expect(tip.textContent).toContain('13');
  });

  it('renders the legend when showLegend is true', () => {
    const { container } = render(
      <ContributionChart
        data={days14()}
        autoFetch={false}
        shape="rectangular"
        days={14}
        cellShape="square"
        colorTheme="github-light"
        showStats={false}
      />,
    );
    expect(container.textContent).toContain('More');
    expect(container.textContent).toContain('Less');
  });

  it('still renders legacy gridLayout props with a deprecation warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const start = new Date('2025-12-28T00:00:00Z');
    const data28 = Array.from({ length: 28 }, (_, i) => {
      const dt = new Date(start);
      dt.setUTCDate(start.getUTCDate() + i);
      return {
        date: dt,
        contributionCount: i,
        contributionLevel: 'FIRST_QUARTILE' as const,
        commitCount: 0,
        pullRequestCount: 0,
        issueCount: 0,
        reviewCount: 0,
      };
    });
    const { container } = render(
      <ContributionChart
        {...baseProps}
        data={data28}
        autoFetch={false}
        gridLayout={{ type: 'n-by-7', weeks: 4 }}
      />,
    );
    expect(container.querySelectorAll('[data-cell]')).toHaveLength(28);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('prefers shape over deprecated gridLayout when both are given', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <ContributionChart
        {...baseProps}
        data={days14()}
        autoFetch={false}
        shape="rectangular"
        days={14}
        gridLayout={{ type: 'n-by-7', weeks: 1 }}
      />,
    );
    expect(container.querySelectorAll('[data-cell]')).toHaveLength(14);
    warn.mockRestore();
  });

  it('throws a RangeError for out-of-bounds days', () => {
    expect(() =>
      render(
        <ContributionChart {...baseProps} data={days14()} autoFetch={false} shape="rectangular" days={400} />,
      ),
    ).toThrow(/days must be an integer between 1 and 366/);
  });
});

describe('ContributionChart rectangular 7×7 via rows/columns (FR-017: square removed, use rows==columns)', () => {
  function days49(): ContributionDay[] {
    const start = new Date('2023-09-29T00:00:00Z');
    return Array.from({ length: 49 }, (_, i) => {
      const dt = new Date(start);
      dt.setUTCDate(start.getUTCDate() + i);
      return {
        date: dt,
        contributionCount: i,
        contributionLevel: 'FIRST_QUARTILE',
        commitCount: 0,
        pullRequestCount: 0,
        issueCount: 0,
        reviewCount: 0,
      };
    });
  }

  it('renders 49 cells with 7×7 proportions for rows=7 columns=7 (square replacement)', () => {
    const { container } = render(
      <ContributionChart
        data={days49()}
        autoFetch={false}
        shape="rectangular"
        rows={7}
        columns={7}
        cellShape="square"
        colorTheme="github-light"
        showLegend={false}
        showStats={false}
      />,
    );
    expect(container.querySelectorAll('[data-cell]')).toHaveLength(49);
    const svg = container.querySelector('[data-testid="chart-svg"]')!;
    expect(svg.getAttribute('width')).toBe(svg.getAttribute('height'));
    expect(svg.getAttribute('width')).toBe('108'); // 7*(12+3)+3
  });

  it('throws a RangeError for square shape (removed per FR-017)', () => {
    expect(() =>
      render(
        // @ts-expect-error square removed per FR-017
        <ContributionChart
          data={days49()}
          autoFetch={false}
          shape="square"
          cellShape="square"
          colorTheme="github-light"
          showLegend={false}
          showStats={false}
        />,
      ),
    ).toThrow(/square mode removed/i);
  });
});

describe('ContributionChart: custom rectangular props', () => {
  it('renders exactly rows × columns cells for rows=4 columns=30', () => {
    const days = buildDays();
    // Pad to 30 trailing days so the 4×30 window has data at its end.
    const start = new Date('2025-12-28T00:00:00Z').getTime();
    const full = Array.from({ length: 120 }, (_, i) => {
      const iso = new Date(start + (i + 90) * 86_400_000).toISOString().slice(0, 10);
      return (
        days[i % 7] ?? {
          date: new Date(`${iso}T00:00:00Z`),
          contributionCount: i,
          contributionLevel: 'FIRST_QUARTILE' as const,
          commitCount: 0,
          pullRequestCount: 0,
          issueCount: 0,
          reviewCount: 0,
        }
      );
    });
    const { container } = render(
      <ContributionChart
        data={full}
        autoFetch={false}
        shape="rectangular"
        rows={4}
        columns={30}
        cellShape="square"
        colorTheme="github-light"
        showLegend
        showStats={false}
      />,
    );
    expect(container.querySelectorAll('[data-cell]')).toHaveLength(120);
    const svg = container.querySelector('svg')!;
    // width = columns * (12+3) + 3; height = rows * (12+3) + 3 (+24 legend)
    expect(svg.getAttribute('width')).toBe(String(30 * 15 + 3));
    expect(svg.getAttribute('height')).toBe(String(4 * 15 + 3 + 24));
  });

  it('keeps tooltips and legend behaviour with custom geometry', () => {
    const { container } = render(
      <ContributionChart
        data={buildDays()}
        autoFetch={false}
        shape="rectangular"
        rows={1}
        columns={7}
        cellShape="square"
        colorTheme="github-light"
        showLegend
        showStats={false}
      />,
    );
    expect(container.querySelectorAll('[data-cell]')).toHaveLength(7);
    expect(container.textContent).toContain('Less');
  });
});
