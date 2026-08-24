import type { JSX } from 'react';
import type { CellShape } from '@wearelunatic/github-contrib-charts';

export interface ConfigPanelProps {
  token: string;
  onTokenChange: (v: string) => void;
  username: string;
  onUsernameChange: (v: string) => void;
  layout: string;
  onLayoutChange: (v: string) => void;
  weeks: number;
  onWeeksChange: (v: number) => void;
  theme: string;
  onThemeChange: (v: string) => void;
  shape: CellShape;
  onShapeChange: (v: CellShape) => void;
  days: number;
  onDaysChange: (v: number) => void;
}

export function ConfigPanel({
  token,
  onTokenChange,
  username,
  onUsernameChange,
  layout,
  onLayoutChange,
  weeks,
  onWeeksChange,
  theme,
  onThemeChange,
  shape,
  onShapeChange,
  days,
  onDaysChange,
}: ConfigPanelProps): JSX.Element {
  return (
    <form
      data-testid="config-panel"
      style={{ display: 'grid', gap: 10, maxWidth: 360, fontSize: 14 }}
    >
      <label>
        Token{' '}
        <input
          type="password"
          value={token}
          placeholder="ghp_..."
          onChange={(e) => onTokenChange(e.target.value)}
          style={{ width: '100%' }}
        />
      </label>
      <label>
        Username{' '}
        <input
          value={username}
          placeholder="octocat"
          onChange={(e) => onUsernameChange(e.target.value)}
          style={{ width: '100%' }}
        />
      </label>
      <label>
        Layout{' '}
        <select value={layout} onChange={(e) => onLayoutChange(e.target.value)} style={{ width: '100%' }}>
          <option value="n-by-7">N×7 (weekly)</option>
          <option value="13-by-4">13×4 (condensed)</option>
        </select>
      </label>
      {layout === 'n-by-7' ? (
        <label>
          History (days back){' '}
          <span style={{ color: '#666', fontSize: 11 }}>(each dot = one day, 7 rows = days of week)</span>
          <input
            type="number"
            min={1}
            max={366}
            value={days}
            onChange={(e) => onDaysChange(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
      ) : (
        <label>
          Weeks to display{' '}
          <span style={{ color: '#666', fontSize: 11 }}>(each dot = one week, 4 rows = weeks vertically)</span>
          <input
            type="number"
            min={1}
            max={52}
            value={weeks}
            onChange={(e) => onWeeksChange(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </label>
      )}
      <label>
        Theme{' '}
        <select value={theme} onChange={(e) => onThemeChange(e.target.value)} style={{ width: '100%' }}>
          <option value="github-light">GitHub Light</option>
          <option value="github-dark">GitHub Dark</option>
        </select>
      </label>
      <label>
        Shape{' '}
        <select
          value={shape}
          onChange={(e) => onShapeChange(e.target.value as CellShape)}
          style={{ width: '100%' }}
        >
          <option value="square">Square</option>
          <option value="circle">Circle</option>
          <option value="rounded-rect">Rounded rectangle</option>
        </select>
      </label>
    </form>
  );
}
