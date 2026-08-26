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
      <Preview token="" username="" geometry="rectangular" days={365} size={10} theme="github-light" shape="square" />,
    );
    expect(container.textContent).toMatch(/enter a token and username/i);
  });

  it('renders a loading message before data resolves', () => {
    const { container } = render(
      <Preview token="tok" username="stefano" geometry="rectangular" days={30} size={10} theme="github-light" shape="square" />,
    );
    expect(container.textContent).toMatch(/loading/i);
  });

  it('fetches exactly `days` days for rectangular charts', async () => {
    render(
      <Preview token="tok" username="stefano" geometry="rectangular" days={30} size={10} theme="github-light" shape="square" />,
    );
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    const range = fetchMock.mock.calls[0]![2] as { from: Date; to: Date };
    const span = Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000);
    expect(span).toBe(30);
  });

  it('fetches N² days for square charts', async () => {
    render(
      <Preview token="tok" username="stefano" geometry="square" days={365} size={8} theme="github-light" shape="square" />,
    );
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    const range = fetchMock.mock.calls[0]![2] as { from: Date; to: Date };
    const span = Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000);
    expect(span).toBe(64);
  });

  it('renders the chart with the square shape config', async () => {
    const { container } = render(
      <Preview token="tok" username="stefano" geometry="square" days={365} size={10} theme="github-light" shape="circle" />,
    );
    await waitFor(() => {
      expect(container.querySelector('[data-testid="chart-svg"]')).toBeInTheDocument();
    });
  });

  it('renders an error message when fetching fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('boom'));
    const { container } = render(
      <Preview token="tok" username="stefano" geometry="rectangular" days={30} size={10} theme="github-light" shape="square" />,
    );
    await waitFor(() => {
      expect(container.textContent).toMatch(/failed to load: boom/i);
    });
  });
});
