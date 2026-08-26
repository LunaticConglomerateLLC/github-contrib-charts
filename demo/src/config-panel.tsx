import type { JSX } from 'react';
import type { CellShape } from '@wearelunatic/github-contrib-charts';

export interface ConfigPanelProps {
  token: string;
  onTokenChange: (v: string) => void;
  username: string;
  onUsernameChange: (v: string) => void;
  rows: number;
  onRowsChange: (v: number) => void;
  columns: number;
  onColumnsChange: (v: number) => void;
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
  rows,
  onRowsChange,
  columns,
  onColumnsChange,
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
        Rows{' '}
        <span style={{ color: '#666', fontSize: 11 }}>(grid height, default 7)</span>
        <input
          type="number"
          min={1}
          max={366}
          value={rows}
          onChange={(e) => onRowsChange(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </label>
      <label>
        Columns{' '}
        <span style={{ color: '#666', fontSize: 11 }}>(grid width, default 52)</span>
        <input
          type="number"
          min={1}
          max={366}
          value={columns}
          onChange={(e) => onColumnsChange(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </label>
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
