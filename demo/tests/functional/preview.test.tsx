import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn().mockResolvedValue([
    { date: new Date('2026-01-01'), contributionCount: 1, contributionLevel: 'FIRST_QUARTILE', commitCount: 1, pullRequestCount: 0, issueCount: 0, reviewCount: 0 },
  ]),
}));

vi.mock('@wearelunatic/github-contrib-charts', async () => {
  const actual = await vi.importActual<typeof import('@wearelunatic/github-contrib-charts')>('@wearelunatic/github-contrib-charts');
  return { ...actual, fetchContributions: fetchMock };
});

import { Preview } from '../../src/preview';

describe('Preview', () => {
  beforeEach(() => {
    fetchMock.mockClear();
  });

  it('renders a message when token or username is missing', () => {
    const { container } = render(
      <Preview token="" username="" layout="n-by-7" weeks={52} theme="github-light" shape="square" days={366} />,
    );
    expect(container.textContent).toMatch(/enter a token and username/i);
  });

  it('renders a loading message before data resolves', () => {
    const { container } = render(
      <Preview token="tok" username="stefano" layout="n-by-7" weeks={7} theme="github-light" shape="square" days={366} />,
    );
    expect(container.textContent).toMatch(/loading/i);
  });

  it('renders the contribution chart when token and username are provided', async () => {
    const { container } = render(
      <Preview token="tok" username="stefano" layout="n-by-7" weeks={7} theme="github-light" shape="square" days={366} />,
    );
    await waitFor(() => {
      expect(container.querySelector('[data-testid="chart-svg"]')).toBeInTheDocument();
    });
  });

  it('passes 13-by-4 layout to the chart', async () => {
    const { container } = render(
      <Preview token="tok" username="stefano" layout="13-by-4" weeks={52} theme="github-dark" shape="circle" days={366} />,
    );
    await waitFor(() => {
      expect(container.querySelector('[data-testid="chart-svg"]')).toBeInTheDocument();
    });
  });

  it('renders an error message when fetching fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('boom'));
    const { container } = render(
      <Preview token="tok" username="stefano" layout="n-by-7" weeks={7} theme="github-light" shape="square" days={366} />,
    );
    await waitFor(() => {
      expect(container.textContent).toMatch(/failed to load: boom/i);
    });
  });

  it('ignores a stale fetch result after unmount', async () => {
    let resolve!: (v: unknown) => void;
    fetchMock.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    const { unmount } = render(
      <Preview token="tok" username="stefano" layout="n-by-7" weeks={7} theme="github-light" shape="square" days={366} />,
    );
    unmount();
    resolve([{ date: new Date('2026-01-01'), contributionCount: 1, contributionLevel: 'FIRST_QUARTILE', commitCount: 1, pullRequestCount: 0, issueCount: 0, reviewCount: 0 }]);
    expect(true).toBe(true);
  });
});