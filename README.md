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
