# GitHub Contribution Charts — Demo

Interactive playground for `@wearelunatic/github-contrib-charts`. Enter a token and username to
preview a chart; the token stays in the browser tab.

## Shape controls

- **Rectangular** — two modes: *week-aligned* (GitHub-style, *History (days)* 1–366, default 364 = 52 weeks) and *custom* (*Rows* 1–366 default 7, *Columns* 1–366 default 52; product ≤366, partial dimension defaults to 7×52, e.g. 4×30 = 120 days). Custom grids are column-major GitHub-week (`idx=col*rows+row`) bottom-right pinned (7×4 28 →6×4 24 transpose, 01 pinned), 1 day per cell. Use `rows==columns` (e.g. 7×7) to replace the removed square mode.
- Changing *Rows*/*Columns* updates the preview within 500 ms and regenerates the snippet (e.g. `<ContributionChart shape="rectangular" rows={4} columns={30} />`).
- The code snippet under "Copy this code" always reflects the current shape.

## Development

```bash
pnpm install
pnpm --filter github-contrib-charts-demo dev     # vite dev server
pnpm --filter github-contrib-charts-demo test    # functional tests
pnpm --filter github-contrib-charts-demo build   # production build
```
