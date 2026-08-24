# Feature Specification: GitHub Contribution Charts Library

**Feature Branch**: `001-github-contribution-charts`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "Produce specifications from decision.md — a TypeScript monorepo library for rendering GitHub contribution charts with custom grid dimensions (N×7, 13×4), multiple output formats (SVG, PNG, text), and derived contribution statistics, using authenticated GitHub GraphQL API only."

## Clarifications

### Session 2026-08-17

- Q: How should the three monorepo packages be named under the `@wearelunatic` scope so each package name is clear rather than the misleading `@scope/cli`? → A: Use `@wearelunatic/github-contrib-charts-*` — three separate packages named `@wearelunatic/github-contrib-charts` (core), `@wearelunatic/github-contrib-charts-react`, and `@wearelunatic/github-contrib-charts-cli`. They remain separately publishable (not a monolith); a consumer installs only the package(s) they need.
- Q: Confirm the exact package base names under `@wearelunatic` for the three separate packages (a user installs ONE package at a time; keep them separate, not a monolith)? → A: Use the `github-contributions-*` base naming scheme.

### Session 2026-08-22 (final naming)

- Q: What is the official npm name? → A: `@wearelunatic/github-contrib-charts` (renamed from `github-contributions`; applied across package metadata, imports, docs, release config and workflows).

### Session 2026-08-22

- Q: Root import should be a single entry — `import { fetchContributions, ContributionChart } from '@wearelunatic/github-contrib-charts'` — instead of two packages. How should packaging behave? → A: **One single package.** Everything (data layer + React components + CLI bin) ships as `@wearelunatic/github-contrib-charts`. This supersedes the 2026-08-17 three-package decision; FR-026 is amended accordingly.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Embed a Contribution Chart in a React App (Priority: P1)

A frontend developer wants to display their GitHub contribution chart on a portfolio site. They install the core and React packages, provide a GitHub token and username, configure a 7×7 square grid with custom colors, and render the chart as an SVG component. They also want to see two derived statistics (total contributions, PR review percentage) displayed alongside the chart.

**Why this priority**: This is the primary use case that motivated the project — no existing library can render a legible non-standard grid. It delivers the core value proposition: fetch + compute + render in one flow.

**Independent Test**: Can be fully tested by installing `@wearelunatic/github-contrib-charts` and `@wearelunatic/github-contrib-charts-react` from a local registry, providing a valid GitHub token, and verifying an SVG chart renders in a browser with a 7×7 grid layout and statistics visible.

**Acceptance Scenarios**:

1. **Given** a developer has installed the packages and provides a valid GitHub token and username, **When** they configure a 7×7 grid and render the React component, **Then** a legible SVG heatmap chart displays with 7 columns (weeks) and 7 rows (days), where each cell's colour intensity reflects the day's contribution count.
2. **Given** the chart is rendered with contribution data, **When** the developer inspects the component output, **Then** at least two derived statistics (total contributions and PR review percentage) are displayed alongside or within the chart.
3. **Given** a 13×4 grid configuration is selected, **When** the chart renders, **Then** 13 columns (weeks) and 4 rows (quarterly blocks) display with each cell showing the aggregate contributions for that week.
4. **Given** the developer provides different colour themes (e.g., GitHub dark, custom palette), **When** the chart renders, **Then** cell colours reflect the chosen theme.
5. **Given** the developer selects a custom dot shape (squares instead of circles), **When** the chart renders, **Then** each cell is rendered as the chosen shape.

---

### User Story 2 - Generate Charts from the CLI (Priority: P2)

A developer or CI pipeline wants to generate a contribution chart as a PNG image or text summary without embedding a React application. They run a single CLI command with a token and username, and the tool writes a PNG file and/or prints a text summary of contributions to stdout.

**Why this priority**: This unlocks the second user persona (CLI/CI users) and the output format diversity that no existing library provides. It is independent of the React rendering path.

**Independent Test**: Can be fully tested by running the CLI with a valid token and verifying a PNG file is written to disk and text output contains contribution counts and derived statistics.

**Acceptance Scenarios**:

1. **Given** the CLI package is installed globally or run via `npx`, **When** the user runs the command with a valid token, username, and `--format png`, **Then** a PNG image of the contribution chart is written to the specified output path.
2. **Given** the CLI command is run with `--format text`, **When** the output is captured, **Then** a text summary containing total contributions, contribution breakdown (commits, PRs, reviews, issues), and a textual grid representation is printed to stdout.
3. **Given** the CLI command is run without specifying an output format, **When** it completes, **Then** both PNG and text output are produced by default.
4. **Given** the CLI receives an invalid or expired token, **When** the command runs, **Then** a clear error message is displayed explaining the authentication failure without exposing the token.

---

### User Story 3 - Configure and Preview Charts Interactively (Priority: P3)

A prospective user visits the demo site to evaluate the library before installing anything. They paste their GitHub token, enter a username, and use interactive controls to adjust grid dimensions, colours, shapes, and date ranges. The chart preview updates in real time as they change settings. They can also copy a ready-to-use code snippet or npm install command from the page.

**Why this priority**: The demo site validates the library's value proposition visually and shortens the adoption funnel. It is self-contained and can be developed last without blocking the npm packages.

**Independent Test**: Can be fully tested by navigating to the published GitHub Pages URL, entering a token, and verifying that configuration changes produce a visible chart preview and that the copy-paste snippet is syntactically correct.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to the demo site, **When** they enter a valid GitHub token and username, **Then** a contribution chart renders with default settings (7-column weekly grid, GitHub green theme).
2. **Given** the chart is rendered, **When** the user changes the grid dimensions dropdown to "7×7 square" or "13×4 condensed", **Then** the chart re-renders immediately with the new layout.
3. **Given** the chart is rendered, **When** the user selects a different theme from the theme picker, **Then** the chart colours update immediately.
4. **Given** the user has configured the chart to their satisfaction, **When** they click a "Copy code" button, **Then** a correct npm install command and a JSX/TypeScript code snippet are copied to their clipboard.

---

### Edge Cases

- What happens when the token is valid but the username does not exist on GitHub? The system MUST return a clear error indicating the user was not found, distinguishing it from an authentication failure.
- What happens when a user has no contributions in the selected date range (e.g., a completely empty year)? The chart MUST render an intact grid with all cells at the zero-contribution colour level, and statistics MUST show zero values rather than errors.
- What happens when the GitHub GraphQL API returns incomplete or partial data (e.g., due to rate limiting or a field being null)? The system MUST handle null/missing fields gracefully, rendering available data and indicating gaps where data is unavailable.
- What happens when the user requests a grid dimension that does not cleanly divide the date range (e.g., 10×5 when data spans 52 weeks)? The system MUST fill the grid left-to-right, top-to-bottom, and leave trailing cells empty or omitted with a clear visual indication.
- What happens when a very large grid (e.g., spanning multiple years) is requested? The system MUST respect reasonable limits and return an error if the requested date range exceeds the maximum supported span.
- What happens when the PNG output path is not writable (permissions, directory does not exist)? The CLI MUST return a clear filesystem error without crashing.
- What happens when the demo site is loaded without a token? The page MUST render all controls in a usable state and display a placeholder or prompt, not an error or broken state.

## Requirements *(mandatory)*

### Functional Requirements

**Data Fetching (Core Package)**

- **FR-001**: The system MUST accept a GitHub personal access token and a username as input for data fetching.
- **FR-002**: The system MUST fetch contribution calendar data from the GitHub GraphQL API (`contributionsCollection` field) using the provided credentials.
- **FR-003**: The system MUST return typed, structured data including daily contribution counts for the requested date range.
- **FR-004**: The system MUST compute at least four derived statistics from the fetched data: total contributions, pull request count, issue count, and code review count. Additionally, the system MUST compute the percentage of PR reviews relative to total contributions.
- **FR-005**: The system MUST handle API errors (invalid token, rate limiting, network failure, user not found) with distinct, user-readable error types.

**Grid Computation (Core Package)**

- **FR-006**: The system MUST support an N×7 grid layout, where N is the number of past weeks and each column represents one week (Sunday–Saturday), producing a grid of N columns × 7 rows.
- **FR-007**: The system MUST support a 13×4 grid layout, where 52 weeks of a year are condensed into 13 columns (each representing one week) and 4 rows (each representing a quarter of the year), with each cell showing aggregate contributions for that week.
- **FR-008**: The system MUST sort cells left-to-right, top-to-bottom in chronological order for all grid layouts.
- **FR-009**: The system MUST return empty/zeroed cells for dates outside the fetched range or with no contributions, rather than omitting them.

**Rendering — SVG (React Package)**

- **FR-010**: The React component MUST render contribution data as an SVG heatmap chart with configurable cell shapes: circle, square, and rounded rectangle.
- **FR-011**: The React component MUST accept a colour theme configuration: built-in presets (GitHub light, GitHub dark) and a custom array of colour stops mapping contribution levels to colours.
- **FR-012**: The React component MUST display tooltips on cell hover/tap showing the date and contribution count.
- **FR-013**: The React component MUST accept an optional title and legend.
- **FR-014**: The React component MUST render legibly at arbitrary container sizes, scaling cell sizes proportionally.

**Rendering — Text Output (CLI Package)**

- **FR-015**: The CLI MUST produce a human-readable text summary including: total contribution count, breakdown by contribution type (commits, PRs, issues, reviews), and a textual representation of the contribution grid using block or Unicode characters.
- **FR-016**: The CLI MUST support `--format text` to output text only, `--format png` for PNG only, and produce both by default.

**Rendering — PNG Output (CLI Package)**

- **FR-017**: The CLI MUST produce a PNG image of the contribution chart at a configurable resolution.
- **FR-018**: The PNG output MUST visually match the SVG rendering (same grid layout, colours, shapes).

**Demo Site**

- **FR-019**: The demo site MUST allow visitors to enter a GitHub token and username and see a live contribution chart preview.
- **FR-020**: The demo site MUST provide interactive controls for: grid dimensions (selectable presets: N×7 with configurable N, 13×4), colour theme, dot shape, and date range.
- **FR-021**: The demo site MUST update the chart preview in real time as configuration changes.
- **FR-022**: The demo site MUST display a copyable npm install command and a JSX/TypeScript code snippet reflecting the current configuration.
- **FR-023**: The demo site MUST be deployable as a static site to GitHub Pages.

**Cross-Cutting**

- **FR-024**: The system MUST NOT make unauthenticated HTTP requests to any external service — all data fetching requires a valid token.
- **FR-025**: The system MUST NOT log, persist, or transmit the user's GitHub token in any form outside of the in-memory API call.
- **FR-026**: The three packages MUST be published to npm under the scope `@wearelunatic` with the base name `github-contributions`, one per package: `@wearelunatic/github-contrib-charts` (core), `@wearelunatic/github-contrib-charts-react` (React), and `@wearelunatic/github-contrib-charts-cli` (CLI). The packages MUST remain separately installable and publishable (not a monolith); consumers install only the package(s) they need.

### Key Entities

- **ContributionDay**: A single day's contribution data — date, total contribution count, and breakdown by type (commits, pull requests, issues, code reviews).
- **ContributionGrid**: A computed matrix derived from `ContributionDay` data, organised by the requested layout (e.g., N×7, 13×4). Each cell maps to zero or more days and carries an aggregate contribution count and intensity level.
- **ContributionStats**: Computed aggregate statistics — total contributions, PR count, issue count, review count, and percentage ratios (e.g., PR reviews as a percentage of total contributions).
- **ChartConfig**: User-facing configuration — grid dimensions, colour theme, cell shape, date range, and output format.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can render a legible 7×7 contribution square from their GitHub data in 5 lines of code or fewer (after package installation and token setup), as verified by counting lines in a documented minimal example.
- **SC-002**: The library surfaces at least 5 derived statistics (total contributions, PR count, issue count, review count, and PR review percentage) alongside the visual chart, verified by inspecting the output of the core package's statistics function.
- **SC-003**: The CLI generates a correctly-sized PNG file in under 10 seconds for a full year of contribution data on standard hardware, verified by timing end-to-end execution.
- **SC-004**: The demo site allows a first-time visitor to configure and preview a custom chart in under 2 minutes from page load (including token entry), verified by user testing.
- **SC-005**: All three packages install and import without errors on Node.js 24 LTS (Krypton), verified by automated CI testing.
- **SC-006**: Unit test coverage exceeds 90% across every package, measured by line and branch coverage in CI.

## Assumptions

- The GitHub GraphQL API's `contributionsCollection` field returns data for any public username when queried with a valid token (not limited to the token owner). If this is self-only, scope is reduced to the authenticated user's own data.
- The maximum supported date range is 366 days (one full year including leap years). Multi-year spans are deferred to a future version.
- The demo site uses Vite + React and deploys to GitHub Pages as a static site, consistent with the monorepo's tech stack.
- The PNG output pipeline uses a pure-JS or native-binding SVG-to-PNG converter that functions on Node 24 without a headless browser.
- The library's npm scope and exact package names are `@wearelunatic/github-contrib-charts`, `@wearelunatic/github-contrib-charts-react`, and `@wearelunatic/github-contrib-charts-cli`, finalised on 2026-08-17.
- Visitors to the demo site manage their own token security — the site runs entirely client-side, sends no data to any backend, and explicitly warns against entering tokens for production repositories.
