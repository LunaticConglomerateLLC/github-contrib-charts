import type { JSX } from 'react';
import type { CellShape } from '@wearelunatic/github-contrib-charts';

export interface ConfigPanelProps {
  token: string;
  onTokenChange: (v: string) => void;
  username: string;
  onUsernameChange: (v: string) => void;
  geometry: 'rectangular' | 'square';
  onGeometryChange: (v: 'rectangular' | 'square') => void;
  days: number;
  onDaysChange: (v: number) => void;
  size: number;
  onSizeChange: (v: number) => void;
  theme: string;
  onThemeChange: (v: string) => void;
  shape: CellShape;
  onShapeChange: (v: CellShape) => void;
}

export function ConfigPanel({
  token,
  onTokenChange,
  username,
  onUsernameChange,
  geometry,
  onGeometryChange,
  days,
  onDaysChange,
  size,
  onSizeChange,
  theme,
  onThemeChange,
  shape,
  onShapeChange,
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
        Geometry{' '}
        <select
          data-testid="geometry-toggle"
          value={geometry}
          onChange={(e) => onGeometryChange(e.target.value as 'rectangular' | 'square')}
          style={{ width: '100%' }}
        >
          <option value="rectangular">Rectangular (7 rows)</option>
          <option value="square">Square (N×N)</option>
        </select>
      </label>
      {geometry === 'rectangular' ? (
        <label>
          History (days){' '}
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
          Size (N×N days){' '}
          <span style={{ color: '#666', fontSize: 11 }}>(each dot = one day, N rows × N columns)</span>
          <input
            type="number"
            min={1}
            max={19}
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
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
