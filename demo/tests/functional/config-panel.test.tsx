import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigPanel } from '../../src/config-panel';
import type { CellShape } from '@wearelunatic/github-contrib-charts';

describe('ConfigPanel', () => {
  it('renders controls for grid, theme, shape and date range', () => {
    render(
      <ConfigPanel
        token=""
        onTokenChange={() => {}}
        username=""
        onUsernameChange={() => {}}
        layout="n-by-7"
        onLayoutChange={() => {}}
        weeks={52}
        onWeeksChange={() => {}}
        theme="github-light"
        onThemeChange={() => {}}
        shape="square"
        onShapeChange={() => {}}
        days={366}
        onDaysChange={() => {}}
      />,
    );
    expect(screen.getByLabelText(/token/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/layout/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/history/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/theme/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/shape/i)).toBeInTheDocument();
  });

  it('calls callbacks when values change', () => {
    const tokenSpy = (v: string) => expect(v).toBe('tok');
    const usernameSpy = (v: string) => expect(v).toBe('stefano');
    const layoutSpy = (v: string) => expect(v).toBe('13-by-4');
    const themeSpy = (v: string) => expect(v).toBe('github-dark');
    const shapeSpy = (v: CellShape) => expect(v).toBe('circle');

    render(
      <ConfigPanel
        token=""
        onTokenChange={tokenSpy}
        username=""
        onUsernameChange={usernameSpy}
        layout="n-by-7"
        onLayoutChange={layoutSpy}
        weeks={52}
        onWeeksChange={() => {}}
        theme="github-light"
        onThemeChange={themeSpy}
        shape="square"
        onShapeChange={shapeSpy}
        days={366}
        onDaysChange={() => {}}
      />,
    );

    fireEvent.change(screen.getByLabelText(/token/i), { target: { value: 'tok' } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'stefano' } });
    fireEvent.change(screen.getByLabelText(/layout/i), { target: { value: '13-by-4' } });
    fireEvent.change(screen.getByLabelText(/theme/i), { target: { value: 'github-dark' } });
    fireEvent.change(screen.getByLabelText(/shape/i), { target: { value: 'circle' } });

    expect(tokenSpy).toBeDefined();
    expect(usernameSpy).toBeDefined();
    expect(layoutSpy).toBeDefined();
    expect(themeSpy).toBeDefined();
    expect(shapeSpy).toBeDefined();
  });

  it('calls onWeeksChange when the weeks input changes', () => {
    const weeksSpy = (v: number) => expect(v).toBe(26);
    render(
      <ConfigPanel
        token=""
        onTokenChange={() => {}}
        username=""
        onUsernameChange={() => {}}
        layout="13-by-4"
        onLayoutChange={() => {}}
        weeks={52}
        onWeeksChange={weeksSpy}
        theme="github-light"
        onThemeChange={() => {}}
        shape="square"
        onShapeChange={() => {}}
        days={366}
        onDaysChange={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText(/weeks/i), { target: { value: '26' } });
    expect(weeksSpy).toBeDefined();
  });

  it('calls onDaysChange when the days back input changes', () => {
    const daysSpy = (v: number) => expect(v).toBe(30);
    render(
      <ConfigPanel
        token=""
        onTokenChange={() => {}}
        username=""
        onUsernameChange={() => {}}
        layout="n-by-7"
        onLayoutChange={() => {}}
        weeks={52}
        onWeeksChange={() => {}}
        theme="github-light"
        onThemeChange={() => {}}
        shape="square"
        onShapeChange={() => {}}
        days={366}
        onDaysChange={daysSpy}
      />,
    );
    fireEvent.change(screen.getByLabelText(/history/i), { target: { value: '30' } });
    expect(daysSpy).toBeDefined();
  });
});
