import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { fetchContributions, ContributionChart } from '@wearelunatic/github-contrib-charts';

function App() {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('octocat');
  const [days, setDays] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setDays(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 366);
    fetchContributions(token, username, { from, to })
      .then((d) => {
        if (!cancelled) setDays(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, username]);

  const chart = useMemo(
    () =>
      days && (
        <ContributionChart
          data={days}
          autoFetch={false}
          gridLayout={{ type: 'n-by-7', weeks: 52 }}
          cellShape="square"
          colorTheme="github-light"
          title={`${username}'s contributions`}
        />
      ),
    [days, username],
  );

  return (
    <section className="card">
      <label>
        GitHub token
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ghp_..."
          autoComplete="off"
        />
      </label>
      <label>
        Username
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <div>
        {loading && <p>Loading contributions…</p>}
        {error && <p style={{ color: '#cf222e' }}>Failed to load: {error}</p>}
        {!token && <p>Enter a GitHub token to render the chart.</p>}
        {chart}
      </div>
    </section>
  );
}

createRoot(document.getElementById('root')).render(<App />);