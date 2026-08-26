export interface SnippetConfig {
  username: string;
  /** Defaults to 'rectangular'. */
  geometry?: 'rectangular' | 'square';
  days?: number;
  size?: number;
  theme: string;
  shape: string;
}

export function buildInstallCommand(): string {
  return 'npm install @wearelunatic/github-contrib-charts';
}

export function buildSnippet({
  username,
  geometry = 'rectangular',
  days = 365,
  size = 10,
  theme,
  shape,
}: SnippetConfig): string {
  const fetchDays = geometry === 'square' ? size * size : days;
  const shapeProps =
    geometry === 'square'
      ? ['shape="square"', `      size={${size}}`]
      : ['shape="rectangular"', `      days={${days}}`];
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
    `      ${shapeProps[0]}`,
    `      ${shapeProps[1]}`,
    `      colorTheme="${theme}"`,
    `      cellShape="${shape}"`,
    '    />',
    '  );',
    '}',
  ].join('\n');
}
