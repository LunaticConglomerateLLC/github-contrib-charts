import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';

const { fetchMock, writeTextMock } = vi.hoisted(() => {
  const writeTextMock = vi.fn().mockResolvedValue(undefined);
  return {
    fetchMock: vi.fn().mockResolvedValue([
      { date: new Date('2026-01-01'), contributionCount: 1, contributionLevel: 'FIRST_QUARTILE', commitCount: 1, pullRequestCount: 0, issueCount: 0, reviewCount: 0 },
    ]),
    writeTextMock,
  };
});

vi.mock('@wearelunatic/github-contrib-charts', async () => {
  const actual = await vi.importActual<typeof import('@wearelunatic/github-contrib-charts')>('@wearelunatic/github-contrib-charts');
  return { ...actual, fetchContributions: fetchMock };
});

import { App } from '../../src/app';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });
  });

  it('renders title, config panel and snippet', () => {
    render(<App />);
    expect(screen.getByText('GitHub Contribution Charts')).toBeInTheDocument();
    expect(screen.getByTestId('config-panel')).toBeInTheDocument();
    expect(screen.getByTestId('snippet')).toBeInTheDocument();
  });

  it('updates snippet when username, geometry and theme change', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'stefano' } });
    fireEvent.change(screen.getByTestId('geometry-toggle'), { target: { value: 'square' } });
    fireEvent.change(screen.getByLabelText(/theme/i), { target: { value: 'github-dark' } });
    expect(screen.getByTestId('snippet')).toHaveTextContent('shape="square"');
    expect(screen.getByTestId('snippet')).toHaveTextContent('size={10}');
    expect(screen.getByTestId('snippet')).toHaveTextContent('github-dark');
  });

  it('preserves values when toggling between geometries', () => {
    render(<App />);
    // Square mode: set size to 8
    fireEvent.change(screen.getByTestId('geometry-toggle'), { target: { value: 'square' } });
    fireEvent.change(screen.getByLabelText(/size/i), { target: { value: '8' } });
    expect(screen.getByTestId('snippet')).toHaveTextContent('size={8}');
    // Back to rectangular: history keeps its previous non-default value after edits
    fireEvent.change(screen.getByTestId('geometry-toggle'), { target: { value: 'rectangular' } });
    fireEvent.change(screen.getByLabelText(/history/i), { target: { value: '60' } });
    expect(screen.getByTestId('snippet')).toHaveTextContent('days={60}');
    // To square again: size is still 8 (inactive mode value preserved)
    fireEvent.change(screen.getByTestId('geometry-toggle'), { target: { value: 'square' } });
    expect((screen.getByLabelText(/size/i) as HTMLInputElement).value).toBe('8');
  });

  it('renders preview once token and username are provided', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/token/i), { target: { value: 'tok' } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'stefano' } });
    const svg = await screen.findByTestId('chart-svg');
    expect(svg).toBeInTheDocument();
  });

  it('copies install command and snippet to clipboard', async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'stefano' } });
    fireEvent.click(screen.getByTestId('copy-button'));
    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining('npm install @wearelunatic/github-contrib-charts'),
    );
    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining("const username = 'stefano';"),
    );
    expect(await screen.findByText('Copied!')).toBeInTheDocument();
  });

  it('shows original label when clipboard fails', async () => {
    writeTextMock.mockRejectedValueOnce(new Error('denied'));
    render(<App />);
    fireEvent.click(screen.getByTestId('copy-button'));
    expect(await screen.findByText('Copy code')).toBeInTheDocument();
  });
});
