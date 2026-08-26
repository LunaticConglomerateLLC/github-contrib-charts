import { useState, type JSX } from 'react';
import { ConfigPanel } from './config-panel';
import { Preview } from './preview';
import { buildInstallCommand, buildSnippet } from './code-snippet';
import type { CellShape } from '@wearelunatic/github-contrib-charts';

export function App(): JSX.Element {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [rows, setRows] = useState(7);
  const [columns, setColumns] = useState(52);
  const [theme, setTheme] = useState('github-light');
  const [shape, setShape] = useState<CellShape>('square');
  const [copied, setCopied] = useState(false);

  const snippet = buildSnippet({ username: username || 'octocat', rows, columns, theme, shape });

  async function copySnippet(): Promise<void> {
    try {
      await navigator.clipboard.writeText(`${buildInstallCommand()}\n\n${snippet}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <h1>GitHub Contribution Charts</h1>
      <p>
        Configure a chart below. Your token is used only in this browser tab and is never sent anywhere else.
      </p>
      <p style={{ color: '#a00' }}>Warning: do not paste a token with access to sensitive repositories.</p>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <ConfigPanel
          token={token}
          onTokenChange={setToken}
          username={username}
          onUsernameChange={setUsername}
          rows={rows}
          onRowsChange={setRows}
          columns={columns}
          onColumnsChange={setColumns}
          theme={theme}
          onThemeChange={setTheme}
          shape={shape}
          onShapeChange={setShape}
        />
        <Preview
          token={token}
          username={username}
          rows={rows}
          columns={columns}
          theme={theme}
          shape={shape}
        />
      </div>
      <section style={{ marginTop: 24 }}>
        <h2>Copy this code</h2>
        <p>
          <strong>Install:</strong> <code>{buildInstallCommand()}</code>
        </p>
        <pre data-testid="snippet" style={{ background: '#f6f8fa', padding: 16, overflowX: 'auto' }}>
          {snippet}
        </pre>
        <button type="button" data-testid="copy-button" onClick={copySnippet}>
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </section>
    </div>
  );
}
