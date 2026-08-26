# GitHub Contribution Charts

A TypeScript monorepo for rendering GitHub contribution charts with custom grid dimensions, multiple output formats, and derived statistics.

This project is built using **GitHub SpecKit** for specification-driven development and **OpenCode** for AI-assisted coding workflows.

## Package

| npm install | Description |
|-------------|-------------|
| `npm i @wearelunatic/github-contrib-charts` | Everything in one package: fetch contribution data, compute grids/statistics, render React SVG charts, and the `github-contribution-chart` CLI (text/PNG) |

One import gives you the data layer and the React component:

```js
import { fetchContributions, ContributionChart } from '@wearelunatic/github-contrib-charts';
```

The CLI ships in the same package (`npx github-contribution-chart <username>`); its programmatic
rendering API lives at the `/cli` subpath. See [PUBLISHING.md](./PUBLISHING.md) for how versions
and npm releases work.

## Chart shapes

`ContributionChart`, `computeGrid`, and the CLI accept two shapes via `ChartShapeConfig`:

| Shape | Config | Grid | Window |
|-------|--------|------|--------|
| `rectangular` (default) | `{ shape: 'rectangular', days }` | 7 rows × ceil(days/7) week-aligned columns, Sunday first row, most recent day bottom-right | `days` days (1–366, default 365) |
| `square` | `{ shape: 'square', size }` | size × size row-major cells, oldest top-left → newest bottom-right | `size²` days (size 1–19, default 10) |

```jsx
<ContributionChart data={days} shape="rectangular" days={30} />
<ContributionChart data={days} shape="square" size={10} />
```

CLI equivalents: `--geometry rectangular --days 30` / `--geometry square --size 10`.

**Custom fetch windows**: `deriveDateRange(config, anchor?, override?)` accepts an explicit
`{ from, to }` range that is used as-is when its day-span matches the shape window
(`days`, or `size²`) — a mismatching or invalid override throws a `RangeError`.

**Migration**: the old `gridLayout={{ type: 'n-by-7' | '13-by-4' }}` props and CLI
`--weeks`/`--layout` flags are deprecated but still work — `n-by-7` maps to an equivalent
rectangular grid of `weeks * 7` days. Prefer `shape`/`days`/`size`.

## Demo

Interactive demo site (GitHub Pages): [link coming after first deploy]

## Examples

- [`examples/react`](./examples/react) — a minimal plain-JS (`jsx`) Vite page that renders a
  contribution chart with a single import from
  `@wearelunatic/github-contrib-charts`.

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## License

MIT
