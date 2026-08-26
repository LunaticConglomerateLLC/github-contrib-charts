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
| `rectangular` (default, week-aligned) | `{ shape: 'rectangular', days }` | 7 rows × ceil(days/7) week-aligned columns, Sunday first row, most recent day bottom-right | `days` days (1–366, default 364 = 52 full weeks) |
| `rectangular` (custom) | `{ shape: 'rectangular', rows, columns }` | rows × columns column-major GitHub-week cells (`idx=col*rows+row`), bottom-right pinned (7×4 28 →6×4 24 transpose, 01 pinned), 1 day per cell | `rows × columns` days (each ≥1, product ≤366; defaults 7×52 when one dimension omitted) |

```jsx
<ContributionChart data={days} shape="rectangular" days={30} />
<ContributionChart data={days} shape="rectangular" rows={4} columns={30} /> // 4×30 = 120 days, column-major bottom-right pinned
<ContributionChart data={days} shape="rectangular" rows={7} columns={7} /> // 7×7 = 49 days replaces square
```

CLI equivalents: `--geometry rectangular --days 30` / `--rows 4 --columns 30` (custom, `--rows`/`--columns` imply rectangular, partial dimension defaults to 7×52). Mixing `--days` with `--rows`/`--columns` is rejected pre-fetch. `--size`/`--geometry square` were removed in v1.1 (FR-017): use `rows==columns` (e.g. `--rows 7 --columns 7`).

> **Default change (v1.1)**: `rectangular` week-aligned default is now **364 days (7×52)** instead of 365, so the default renders a true year view without a 53rd padding column. See `specs/003-configurable-chart-shape`.

**Custom fetch windows**: `deriveDateRange(config, anchor?, override?)` accepts an explicit
`{ from, to }` range that is used as-is when its day-span matches the shape window
(`days` or `rows×columns`) — a mismatching or invalid override throws a `RangeError`.

**Migration**: the old `gridLayout={{ type: 'n-by-7' | '13-by-4' }}` props and CLI
`--weeks`/`--layout` flags are deprecated but still work — `n-by-7` maps to an equivalent
rectangular grid of `weeks * 7` days. Prefer `shape`/`days`/`rows`/`columns`. `square`/`size`/`--size` were removed — use `rows==columns`.

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
