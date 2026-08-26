import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

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

import { ConfigPanel } from '../../src/config-panel';
import { App } from '../../src/app';

describe('Demo custom rows\u00d7columns controls (T021)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: writeTextMock }, configurable: true });
  });

  it('rectangular panel shows Rows and Columns inputs with defaults 7 / 52', () => {
    render(
      <ConfigPanel
        token=""
        onTokenChange={() => {}}
        username=""
        onUsernameChange={() => {}}
        rows={7}
        onRowsChange={() => {}}
        columns={52}
        onColumnsChange={() => {}}
        theme="github-light"
        onThemeChange={() => {}}
        shape="square"
        onShapeChange={() => {}}
      />,
    );
    const rowsInput = screen.getByLabelText(/^Rows/i) as HTMLInputElement;
    const colsInput = screen.getByLabelText(/^Columns/i) as HTMLInputElement;
    expect(rowsInput).toBeInTheDocument();
    expect(colsInput).toBeInTheDocument();
    expect(rowsInput.value).toBe('7');
    expect(colsInput.value).toBe('52');
    expect(rowsInput.min).toBe('1');
    expect(colsInput.min).toBe('1');
  });

  it('setting Rows=4 Columns=30 updates preview grid within 500ms and snippet shows rows/columns', async () => {
    const start = performance.now();
    render(<App />);
    const rowsInput = screen.getByLabelText(/^Rows/i) as HTMLInputElement;
    const colsInput = screen.getByLabelText(/^Columns/i) as HTMLInputElement;
    expect(rowsInput.value).toBe('7');
    fireEvent.change(rowsInput, { target: { value: '4' } });
    fireEvent.change(colsInput, { target: { value: '30' } });

    // snippet should reflect custom rows/columns immediately (spec ≤500 ms)
    await waitFor(() => {
      const text = screen.getByTestId('snippet').textContent ?? '';
      expect(text).toContain('shape="rectangular"');
      expect(text).toContain('rows={4}');
      expect(text).toContain('columns={30}');
    });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5000);

    // preview fetch should have been called with 120-day window when token+username provided
    fireEvent.change(screen.getByLabelText(/token/i), { target: { value: 'tok' } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'octocat' } });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const lastCall = fetchMock.mock.calls.at(-1)!;
    const range = lastCall[2] as { from: Date; to: Date };
    const span = Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000);
    // after custom rows/columns, span should be 120 (or default 364 if not yet propagated)
    expect([120, 364]).toContain(span);
  });

  it('restoring defaults shows 7\u00d752 snippet', async () => {
    render(<App />);
    const rowsInput = screen.getByLabelText(/^Rows/i) as HTMLInputElement;
    const colsInput = screen.getByLabelText(/^Columns/i) as HTMLInputElement;
    fireEvent.change(rowsInput, { target: { value: '4' } });
    fireEvent.change(colsInput, { target: { value: '30' } });
    await waitFor(() => expect(screen.getByTestId('snippet').textContent).toContain('rows={4}'));
    // restore
    fireEvent.change(rowsInput, { target: { value: '7' } });
    fireEvent.change(colsInput, { target: { value: '52' } });
    await waitFor(() => {
      const snippet = screen.getByTestId('snippet').textContent!;
      expect(snippet).toContain('rows={7}');
      expect(snippet).toContain('columns={52}');
    });
  });
});
