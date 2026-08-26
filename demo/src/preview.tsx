import { useEffect, useState, type JSX } from 'react';
import {
  ContributionChart,
  type CellShape,
  fetchContributions,
  type ChartShapeConfig,
  type ContributionDay,
  deriveDateRange,
} from '@wearelunatic/github-contrib-charts';

export interface PreviewProps {
  token: string;
  username: string;
  rows: number;
  columns: number;
  theme: string;
  shape: CellShape;
}

export function Preview({ token, username, rows, columns, theme, shape }: PreviewProps): JSX.Element {
  const [data, setData] = useState<ContributionDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shapeConfig: ChartShapeConfig = { shape: 'rectangular', rows, columns };

  useEffect(() => {
    if (!token || !username) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setData(null);
    setError(null);
    const range = deriveDateRange(shapeConfig);
    fetchContributions(token, username, range)
      .then((d: ContributionDay[]) => {
        if (!cancelled) setData(d);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [token, username, rows, columns]);

  if (!token || !username) {
    return <p style={{ color: '#777' }}>Enter a token and username to preview the chart.</p>;
  }

  if (error) {
    return <p style={{ color: '#c00' }}>Failed to load: {error}</p>;
  }

  if (data === null) {
    return <p style={{ color: '#777' }}>Loading contributions…</p>;
  }

  return (
    <div data-testid="preview" style={{ overflow: 'visible', flex: '1 1 520px', minWidth: 0 }}>
      <ContributionChart
        data={data}
        autoFetch={false}
        {...shapeConfig}
        cellShape={shape}
        colorTheme={theme as 'github-light' | 'github-dark'}
        title={`${username}'s contributions`}
      />
    </div>
  );
}
