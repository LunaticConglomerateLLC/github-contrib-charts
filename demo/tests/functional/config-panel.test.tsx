import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigPanel } from '../../src/config-panel';

function renderPanel(overrides: Partial<Parameters<typeof ConfigPanel>[0]> = {}) {
  const props: Parameters<typeof ConfigPanel>[0] = {
    token: '',
    onTokenChange: () => {},
    username: '',
    onUsernameChange: () => {},
    rows: 7,
    onRowsChange: () => {},
    columns: 52,
    onColumnsChange: () => {},
    theme: 'github-light',
    onThemeChange: () => {},
    shape: 'square',
    onShapeChange: () => {},
    ...overrides,
  };
  return render(<ConfigPanel {...props} />);
}

describe('ConfigPanel', () => {
  it('renders Rows and Columns inputs with defaults', () => {
    renderPanel();
    expect(screen.getByLabelText(/^Rows/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Columns/i)).toBeInTheDocument();
  });

  it('bounds the rows/columns inputs between 1 and 366', () => {
    renderPanel();
    const rows = screen.getByLabelText(/^Rows/i) as HTMLInputElement;
    const cols = screen.getByLabelText(/^Columns/i) as HTMLInputElement;
    expect(rows.min).toBe('1');
    expect(rows.max).toBe('366');
    expect(cols.min).toBe('1');
    expect(cols.max).toBe('366');
  });

  it('calls callbacks when values change', () => {
    const calls: string[] = [];
    renderPanel({
      onThemeChange: (v) => calls.push(`theme:${v}`),
      onShapeChange: (v) => calls.push(`shape:${v}`),
    });

    fireEvent.change(screen.getByLabelText(/theme/i), { target: { value: 'github-dark' } });
    fireEvent.change(screen.getByLabelText(/shape/i), { target: { value: 'circle' } });

    expect(calls).toEqual(['theme:github-dark', 'shape:circle']);
  });

  it('calls onRowsChange/onColumnsChange when inputs change', () => {
    let rowsReceived = 0;
    let colsReceived = 0;
    renderPanel({ onRowsChange: (v) => (rowsReceived = v), onColumnsChange: (v) => (colsReceived = v) });
    fireEvent.change(screen.getByLabelText(/^Rows/i), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText(/^Columns/i), { target: { value: '30' } });
    expect(rowsReceived).toBe(4);
    expect(colsReceived).toBe(30);
  });
});
