import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigPanel } from '../../src/config-panel';

function renderPanel(overrides: Partial<Parameters<typeof ConfigPanel>[0]> = {}) {
  const props: Parameters<typeof ConfigPanel>[0] = {
    token: '',
    onTokenChange: () => {},
    username: '',
    onUsernameChange: () => {},
    geometry: 'rectangular',
    onGeometryChange: () => {},
    days: 365,
    onDaysChange: () => {},
    size: 10,
    onSizeChange: () => {},
    theme: 'github-light',
    onThemeChange: () => {},
    shape: 'square',
    onShapeChange: () => {},
    ...overrides,
  };
  return render(<ConfigPanel {...props} />);
}

describe('ConfigPanel', () => {
  it('renders a geometry toggle with rectangular and square options', () => {
    renderPanel();
    const toggle = screen.getByTestId('geometry-toggle');
    expect(toggle).toBeInTheDocument();
    const options = toggle.querySelectorAll('option');
    expect(options).toHaveLength(2);
    expect(options[0]!.textContent).toMatch(/rectangular/i);
    expect(options[1]!.textContent).toMatch(/square/i);
  });

  it('shows the days input only in rectangular mode', () => {
    renderPanel({ geometry: 'rectangular' });
    expect(screen.getByLabelText(/history/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/size/i)).not.toBeInTheDocument();
  });

  it('shows the size input only in square mode', () => {
    renderPanel({ geometry: 'square' });
    expect(screen.getByLabelText(/size/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/history/i)).not.toBeInTheDocument();
  });

  it('bounds the days input between 1 and 366', () => {
    renderPanel({ geometry: 'rectangular' });
    const input = screen.getByLabelText(/history/i) as HTMLInputElement;
    expect(input.min).toBe('1');
    expect(input.max).toBe('366');
  });

  it('bounds the size input between 1 and 19', () => {
    renderPanel({ geometry: 'square' });
    const input = screen.getByLabelText(/size/i) as HTMLInputElement;
    expect(input.min).toBe('1');
    expect(input.max).toBe('19');
  });

  it('calls callbacks when values change', () => {
    const calls: string[] = [];
    renderPanel({
      onGeometryChange: (v) => calls.push(`geometry:${v}`),
      onThemeChange: (v) => calls.push(`theme:${v}`),
      onShapeChange: (v) => calls.push(`shape:${v}`),
    });

    fireEvent.change(screen.getByTestId('geometry-toggle'), { target: { value: 'square' } });
    fireEvent.change(screen.getByLabelText(/theme/i), { target: { value: 'github-dark' } });
    fireEvent.change(screen.getByLabelText(/shape/i), { target: { value: 'circle' } });

    expect(calls).toEqual(['geometry:square', 'theme:github-dark', 'shape:circle']);
  });

  it('calls onDaysChange when the history input changes', () => {
    let received = 0;
    renderPanel({ geometry: 'rectangular', onDaysChange: (v) => (received = v) });
    fireEvent.change(screen.getByLabelText(/history/i), { target: { value: '30' } });
    expect(received).toBe(30);
  });

  it('calls onSizeChange when the size input changes', () => {
    let received = 0;
    renderPanel({ geometry: 'square', onSizeChange: (v) => (received = v) });
    fireEvent.change(screen.getByLabelText(/size/i), { target: { value: '8' } });
    expect(received).toBe(8);
  });
});
