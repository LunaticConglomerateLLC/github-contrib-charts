export interface SnippetConfig {
  username: string;
  rows?: number;
  columns?: number;
  theme: string;
  shape: string;
}

export function buildInstallCommand(): string {
  return 'npm install @wearelunatic/github-contrib-charts';
}

export function buildSnippet({
  username,
  rows = 7,
  columns = 52,
  theme,
  shape,
}: SnippetConfig): string {
  const fetchDays = rows * columns;
  const shapeProps = ['shape="rectangular"', `rows={${rows}}`, `columns={${columns}}`];
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
    ...shapeProps.map((p) => `      ${p}`),
    `      colorTheme="${theme}"`,
    `      cellShape="${shape}"`,
    '    />',
    '  );',
    '}',
  ].join('\n');
}
