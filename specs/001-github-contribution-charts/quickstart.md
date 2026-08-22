# Quickstart Validation Guide

**Phase**: 1 — Design & Contracts
**Date**: 2026-08-16

This guide describes runnable validation scenarios that prove the feature works end-to-end. Use it to verify the implementation against the specification. Detailed implementation belongs in `tasks.md` and the implementation phase.

## Prerequisites

- Node.js 24+ (LTS/Krypton)
- pnpm 11.x installed globally: `corepack enable && corepack prepare pnpm@11.22.0 --activate`
- A GitHub personal access token (no specific scopes needed for public data; classic PAT with no scopes works)
- A GitHub username to test against (your own or any public user)

## Setup

```bash
pnpm install         # Installs all workspace dependencies
pnpm build           # Builds all packages (core → react → cli → demo)
```

## Validation Scenarios

### 1. Core Package: Fetch and Compute (P1)

**Goal**: Verify the core package fetches real data and computes stats/grid correctly.

```bash
# Run core package functional test against live API (requires token)
GITHUB_TOKEN="ghp_..." pnpm --filter @wearelunatic/github-contrib-charts test:functional
```

**Expected outcomes**:
- `fetchContributions` returns an array of `ContributionDay` objects for the last 365 days
- Each object has non-negative `contributionCount` and a valid `ContributionLevel`
- `computeStats` returns `ContributionStats` with totals matching the sum of daily counts
- `computeGrid` with `{ type: "n-by-7", weeks: 7 }` produces 7×7 = 49 cells
- `computeGrid` with `{ type: "13-by-4" }` produces 13×4 = 52 cells
- `pullRequestReviewPercentage` is in range [0, 100]

### 2. React Package: Render Chart (P1)

**Goal**: Verify the React component renders a correct SVG chart.

```bash
pnpm --filter @wearelunatic/github-contrib-charts-react test
```

**Expected outcomes**:
- `<ContributionChart autoFetch={false} data={mockData} />` renders an SVG element
- Cell count matches `rows × columns` from grid config
- Cell shape matches the `cellShape` prop (circle, square, rounded-rect)
- Cell colours reflect the `colorTheme` (validated by inspecting fill attributes)
- Hovering a cell shows a tooltip with date and contribution count
- `<ContributionStats stats={mockStats} />` renders total, breakdown, and percentage

### 3. CLI Package: Text and PNG Output (P2)

**Goal**: Verify the CLI produces correct text and PNG output.

```bash
# Text output
GITHUB_TOKEN="ghp_..." pnpm --filter @wearelunatic/github-contrib-charts-cli exec github-contribution-chart <username> --format text

# PNG output
GITHUB_TOKEN="ghp_..." pnpm --filter @wearelunatic/github-contrib-charts-cli exec github-contribution-chart <username> --format png --output ./test-output

# Verify PNG was created and has correct dimensions
# Expected: test-output-chart.png exists, resolution matches --resolution flag
```

**Expected outcomes**:
- `--format text` prints a formatted summary to stdout with totals, breakdown, and grid
- `--format png` writes a valid PNG file to the output path
- Invalid token: exits with code 2 and prints "Authentication failed" to stderr
- Non-existent username: exits with code 3 and prints "User not found" to stderr
- Missing required args: exits with code 1 and prints usage to stderr

### 4. Error Handling (Cross-Cutting)

**Goal**: Verify error states behave correctly across all packages.

```bash
# Core: invalid token
GITHUB_TOKEN="invalid" pnpm --filter @wearelunatic/github-contrib-charts test:errors

# Core: non-existent user
GITHUB_TOKEN="ghp_..." pnpm --filter @wearelunatic/github-contrib-charts test:errors --user="this-user-definitely-does-not-exist-12345"

# React: empty data (no contributions)
pnpm --filter @wearelunatic/github-contrib-charts-react test -- --grep "empty data"

# CLI: rate limit handling (run CLI in a loop to trigger, or mock)
pnpm --filter @wearelunatic/github-contrib-charts-cli test:errors
```

**Expected outcomes**:
- Invalid token → `AuthenticationError` with descriptive message (no token in message)
- Non-existent user → `UserNotFoundError` with "User not found: {username}"
- Empty data → Full grid rendered with all cells at contribution level NONE
- Network timeout → `NetworkError` with retry guidance

### 5. Demo Site (P3)

**Goal**: Verify the demo site renders and is interactive.

```bash
pnpm --filter demo dev
# Open http://localhost:5173
```

**Expected outcomes**:
- Page loads without token → shows empty token input and all controls in usable state
- Enter valid token + username → chart renders with default 52-week grid (7 columns)
- Change grid to "7×7" → chart updates immediately to 7×7 layout
- Change grid to "13×4" → chart updates to 13×4 layout
- Change theme to "GitHub Dark" → cell colours change to dark palette
- Change shape to "square" → cells render as squares
- Click "Copy code" → clipboard contains correct `npm install` command and JSX snippet
- `pnpm --filter demo build` produces a static site in `demo/dist/`

### 6. Coverage & Quality Gates

**Goal**: Verify all quality gates from the constitution pass.

```bash
pnpm test               # Run all unit + functional tests across all packages
pnpm test:coverage       # Generate coverage report
```

**Expected outcomes**:
- All tests pass (zero failures)
- Line coverage > 90% for every package
- Branch coverage > 90% for every package
- No unhandled TypeScript errors (`pnpm typecheck` passes)
