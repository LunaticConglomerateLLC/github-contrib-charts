# React Example

A minimal, dependency-light example showing how to embed the GitHub contribution chart in a React app using plain JavaScript (`.jsx`).

## Run

```bash
pnpm install
pnpm --filter github-contrib-charts-example dev
```

Then open the printed local URL (default `http://localhost:5173`).

## What it does

- Imports `fetchContributions` from `@wearelunatic/github-contrib-charts` to fetch a user's contribution data.
- Imports `ContributionChart` from `@wearelunatic/github-contrib-charts` to render an SVG heatmap.
- Fetches the last 366 days and renders an N×7 grid (52 weeks) with the GitHub Light theme.

Enter a GitHub personal access token (no specific scopes needed for public data) and a username to render the chart.

## Files

- `main.jsx` — the example page and data-fetching logic.
- `index.html` — host page.
- `vite.config.js` — Vite config with the React plugin.