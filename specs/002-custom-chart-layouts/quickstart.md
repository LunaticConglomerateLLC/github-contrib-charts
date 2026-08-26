# Quickstart Validation Guide: Custom Chart Layouts (Rectangular & Square)

**Phase**: 1 — Design & Contracts
**Date**: 2026-08-25

This guide describes runnable validation scenarios that prove the shape customization works end-to-end. Implementation details belong in `tasks.md`.

## Prerequisites

- Node.js 24+ (`node -v` should show `v24.x`)
- pnpm 11.x (`corepack enable && corepack prepare pnpm@11.22.0 --activate`)
- A GitHub PAT (`GITHUB_TOKEN` env var or `--token` flag) for live-fetch scenarios; unit scenarios use mock data

## Setup

```bash
pnpm install
pnpm build        # builds packages/github-contrib-charts + demo
```

## Validation Scenarios

### 1. Unit: Grid Modes (P1/P2) — no token needed

```bash
pnpm --filter @wearelunatic/github-contrib-charts test -- grid --run
```

**Expected**:
- `rectangular days=14` → 7 rows, 2 columns, 14 populated cells, most recent at bottom-right
- `rectangular days=10` → 7 rows, 2 columns, 4 padded NONE cells at top of col 0, 10 populated cells ending at bottom-right
- `rectangular days=365` → 7×53, `days=1` → 7×1 with 6 padded cells
- `square size=10` → 10×10, row-major, `cells[0][0]` earliest, `cells[9][9]` most recent
- `square size=19` → 19×19 (=361), `size=1` → 1×1
- Invalid: `days=0`, `days=400`, `size=0`, `size=50`, `shape='hex'` → `RangeError` with field-specific message
- Deprecated aliases `n-by-7 weeks=4` → maps to `rectangular days=28`; `13-by-4` still renders (warns)

### 2. Core: Fetch Window Derivation (integration, mocked)

```bash
pnpm --filter @wearelunatic/github-contrib-charts test -- fetch --run
```

**Expected**:
- `rectangular days=30` requests `DateRange` of 30 days ending at anchor (most recent day)
- `square size=10` requests 100 days ending at anchor
- Explicit `dateRange` override is honored but validated against shape window length
- Mocked GraphQL responses (snapshots) return arrays of length matching the requested window

### 3. React: Render Both Modes

```bash
pnpm --filter @wearelunatic/github-contrib-charts test -- chart --run
# Or for demo functional tests:
pnpm --filter github-contrib-charts-demo test --run
```

**Expected**:
- `<ContributionChart shape="rectangular" days={14} />` renders SVG with 14 `data-cell` groups, 7-row geometry
- `<ContributionChart shape="square" size={10} />` renders 100 cells, 10×10 geometry, equal width/height proportions
- Hovering a cell shows tooltip with ISO date + count; legend shows 5 levels
- `<ContributionChart gridLayout={{type:'n-by-7',weeks:4}} />` still renders (deprecated path)
- Invalid props (`days=0`, `size=100`) throw with descriptive message (caught by error boundary / test)

### 4. CLI: Text & PNG Output

```bash
# Build CLI
pnpm --filter @wearelunatic/github-contrib-charts build

# Rectangular (default) — text
GITHUB_TOKEN="ghp_..." node packages/github-contrib-charts/dist/cli/index.js octocat --geometry rectangular --days 30 --format text

# Square 10×10 — PNG
GITHUB_TOKEN="ghp_..." node packages/github-contrib-charts/dist/cli/index.js octocat --geometry square --size 10 --format png --output /tmp/out

# Verify PNG
ls /tmp/out-chart.png && file /tmp/out-chart.png   # valid PNG
# Check dimensions roughly: square 10×10 should be ~(10*15+gap) square; rectangular 30 days should be ~5 cols wide, 7 rows tall

# Deprecated compat
GITHUB_TOKEN="ghp_..." node packages/github-contrib-charts/dist/cli/index.js octocat --weeks 4 --layout n-by-7 --format text
```

**Expected**:
- `--geometry rectangular --days 30` → text grid has 7 rows, 5 columns; PNG height matches 7 cells
- `--geometry square --size 10` → text grid has 10 rows, 10 columns; PNG is square-ish
- No flags → defaults to rectangular 365 (7×53)
- Invalid `--days 0` / `--size 100` / `--geometry hex` → stderr validation message + exit 1
- Invalid token → stderr `Authentication failed` + exit 2
- Non-existent user → stderr `User not found: <username>` + exit 3

### 5. Demo Site: Interactive Controls

```bash
pnpm --filter github-contrib-charts-demo dev   # then open http://localhost:5173
```

**Steps**:
1. Enter token + username → default rectangular chart (7 rows) renders
2. Change "Days" to 60 → chart updates to 7×9 within 500ms; code snippet shows `shape="rectangular" days={60}`
3. Toggle shape to "Square", set size to 8 → chart becomes 8×8; snippet shows `shape="square" size={8}`
4. Toggle back to Rectangular → prior days value restored, chart is 7 rows again
5. Resize browser → chart scales proportionally, square remains square

**Expected**:
- Shape toggle + conditional input visible (FR-024)
- Preview updates in real time without reload (FR-025)
- Copy-paste snippet matches current shape (FR-026)
- All controls have accessible labels and validation (min/max)

### 6. Coverage Gate

```bash
pnpm --filter @wearelunatic/github-contrib-charts test:coverage --run
```

**Expected**: Line + branch coverage >90% across `packages/github-contrib-charts` (constitution gate). New branches (rectangular/square, validation, CLI geometry) are covered.
