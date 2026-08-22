import { useEffect, useState, type JSX } from 'react';
import { ContributionChart, type CellShape, fetchContributions, type ContributionDay, type GridLayoutConfig } from '@wearelunatic/github-contrib-charts';

export interface PreviewProps {
  token: string;
  username: string;
  layout: string;
  weeks: number;
  theme: string;
  shape: CellShape;
  days: number;
}

export function Preview({ token, username, layout, weeks, theme, shape, days: daysBack }: PreviewProps): JSX.Element {
  const [days, setDays] = useState<ContributionDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !username) {
      setDays(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setDays(null);
    setError(null);
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - daysBack);
    fetchContributions(token, username, { from, to })
      .then((d: ContributionDay[]) => {
        if (!cancelled) setDays(d);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [token, username, daysBack]);

  if (!token || !username) {
    return <p style={{ color: '#777' }}>Enter a token and username to preview the chart.</p>;
  }

  if (error) {
    return <p style={{ color: '#c00' }}>Failed to load: {error}</p>;
  }

  if (days === null) {
    return <p style={{ color: '#777' }}>Loading contributions…</p>;
  }

  const gridLayout: GridLayoutConfig =
    layout === '13-by-4' ? { type: '13-by-4' } : { type: 'n-by-7', weeks };

  return (
    <div data-testid="preview">
      <ContributionChart
        data={days}
        autoFetch={false}
        gridLayout={gridLayout}
        cellShape={shape}
        colorTheme={theme as 'github-light' | 'github-dark'}
        title={`${username}'s contributions`}
      />
    </div>
  );
}