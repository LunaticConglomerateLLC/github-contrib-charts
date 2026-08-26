# GitHub Contribution Charts — Demo

Interactive playground for `@wearelunatic/github-contrib-charts`. Enter a token and username to
preview a chart; the token stays in the browser tab.

## Shape controls

- **Geometry** toggles between the two chart shapes:
  - **Rectangular (7 rows)**: GitHub-style week-aligned grid. The *History (days)* input
    (1–366) controls how far back the chart goes.
  - **Square (N×N)**: compact row-major badge. The *Size* input (1–19) sets N; the window is
    N² days.
- Switching geometry preserves the values of the inactive mode.
- The code snippet under "Copy this code" always reflects the current shape.

## Development

```bash
pnpm install
pnpm --filter github-contrib-charts-demo dev     # vite dev server
pnpm --filter github-contrib-charts-demo test    # functional tests
pnpm --filter github-contrib-charts-demo build   # production build
```
