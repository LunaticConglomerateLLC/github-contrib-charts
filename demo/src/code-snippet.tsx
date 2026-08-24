export interface SnippetConfig {
  username: string;
  layout: string;
  weeks?: number;
  theme: string;
  shape: string;
  days?: number;
}

export function buildInstallCommand(): string {
  return 'npm install @wearelunatic/github-contrib-charts';
}

export function buildSnippet({ username, layout, weeks = 52, theme, shape, days = 366 }: SnippetConfig): string {
  // N×7 is day-driven: weeks derived from days; 13×4 is week-driven: days = weeks*7
  const derivedWeeks = Math.max(1, Math.ceil(days / 7));
  const gridLayout =
    layout === '13-by-4'
      ? 'gridLayout={{ type: "13-by-4" }}'
      : `gridLayout={{ type: "n-by-7", weeks: ${derivedWeeks} }}`;
  const fetchDays = layout === '13-by-4' ? weeks * 7 : days;
  return [
    'import { fetchContributions, ContributionChart } from "@wearelunatic/github-contrib-charts";',
    '',
    `const username = '${username}';`,
    '',
    'export function MyChart() {',
    '  const [days, setDays] = useState(null);',
    '',
    '  useEffect(() => {',
    '    const to = new Date();',
    '    const from = new Date();',
    `    from.setDate(from.getDate() - ${fetchDays});`,
    '    fetchContributions(process.env.GITHUB_TOKEN, username, { from, to })',
    '      .then(setDays);',
    '  }, []);',
    '',
    '  if (!days) return null;',
    '',
    '  return (',
    '    <ContributionChart',
    '      data={days}',
    '      autoFetch={false}',
    `      ${gridLayout}`,
    `      colorTheme="${theme}"`,
    `      cellShape="${shape}"`,
    '    />',
    '  );',
    '}',
  ].join('\n');
}