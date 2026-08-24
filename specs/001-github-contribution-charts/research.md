# Research: GitHub Contribution Charts Library

**Phase**: 0 — Outline & Research
**Date**: 2026-08-16

## 1. GitHub GraphQL API: `contributionsCollection`

- **Decision**: Use `@octokit/graphql` v9.0.4 as the GraphQL client.
- **Rationale**: Purpose-built for GitHub's API — handles auth headers, rate-limit parsing, and error formatting automatically. Small bundle (~14KB gzipped). Cross-user queries confirmed: `user(login: "otherUser") { contributionsCollection }` returns public contribution data for any user with a token that has no scopes (or minimal public-read access).
- **Key schema findings**:
  - `contributionCalendar.weeks[].contributionDays[]` provides pre-aggregated daily counts (`date`, `contributionCount`, `contributionLevel`). Most efficient way to get the grid data.
  - Aggregate fields available in one query: `totalCommitContributions`, `totalIssueContributions`, `totalPullRequestContributions`, `totalPullRequestReviewContributions`, `totalRepositoryContributions`.
  - From these, PR review % = `totalPullRequestReviewContributions / totalCommitContributions + totalPullRequestContributions + totalIssueContributions + totalPullRequestReviewContributions`.
  - Rate limit: 5,000 points/hour (user token). One combined query costs ~1-2 points. Very safe for typical usage.
  - Maximum range: `from`/`to` span can cover multiple years, but >1 year risks 10-second timeout. Strategy: batch by year.
  - Required scopes: **none** (classic PAT with no scopes, or fine-grained PAT with default permissions, suffices for public data).
  - Token never exposed in query body — passed as `Authorization: bearer <token>` header.
- **Alternatives considered**: Raw `fetch` (works but adds auth/error boilerplate), `graphql-request` (general-purpose, no GitHub-specific helpers).

## 2. SVG-to-PNG Conversion

- **Decision**: Use `sharp` v0.35.4 (latest) for SVG-to-PNG conversion.
- **Rationale**: Explicitly confirmed working on Node 24 (published from Node 24.17.0). Single-step conversion: `sharp(svgBuffer).png().toBuffer()`. Prebuilt binaries for macOS arm64, Linux x64 (glibc + musl), Linux arm64. No system dependencies needed at install time. 75M weekly npm downloads, 32.6k GitHub stars, actively maintained. libvips C engine is SIMD-accelerated — renders a 50KB contribution chart in sub-10ms.
- **Alternatives considered**:
  - `@resvg/resvg-js` v2.6.2: Best SVG spec fidelity (~95% SVG 1.1), but last stable published from Node 18. Node 24 compatibility unconfirmed. For simple rect-based charts, no fidelity advantage.
  - `canvas` (node-canvas) + `canvg`: Two-library pipeline, native build deps (Cairo, Pango), overkill.
  - `satori`: Generates SVG from JSX — wrong direction for converting existing SVG to PNG.

## 3. Monorepo Tooling

- **Decision**: pnpm 11.x workspaces + Turborepo 2.x.
- **Rationale**: pnpm is fast, strict (prevents phantom dependencies), first-class workspace support. Turborepo adds hash-based caching (local + remote), parallel task execution with topological `dependsOn`, and `--filter` for scoping — all with ~15MB overhead. The 3-package + 1-app scale is Turborepo's sweet spot. Config is a single `turbo.json` file.
- **Alternatives considered**:
  - Nx v23: Sophisticated but heavier (~30MB+, complex plugin system). Overkill for 3 packages.
  - Pure pnpm workspaces: Works but no caching — demo site build always re-runs in CI. Caching saves minutes on every CI run.

## 4. Testing Framework

- **Decision**: Vitest 4.x with `@vitest/coverage-v8`.
- **Rationale**: ESM-native, first-class pnpm workspace support, reuses Vite config/transform pipeline (already needed for the demo site). Significantly faster than Jest for TypeScript + ESM. Coverage via V8 native coverage (not Istanbul — faster, more accurate for ESM).
- **Alternatives considered**:
  - Jest 30: ESM still requires `--experimental-vm-modules` flag. Separate config ecosystem (babel/ts-jest). Heavier install (~20MB+).

## 5. CLI Framework

- **Decision**: `commander` v15.0.0.
- **Rationale**: Mature (v15), clean imperative API (`program.option().action()`), built-in choices validation for `--format text|png`, native ESM, small bundle (~8KB gzipped), excellent TypeScript support.
- **Alternatives considered**:
  - `clipanion` v4: Class-based declarative API, type-safe, but rc versioning adds minor risk.
  - `yargs` v18: Feature-rich but heavy (~45KB gzipped) and clunky TypeScript API for simple 5-flag CLI.
  - `cac` v7: Too minimal for production CLI tooling.

## 6. Release & Versioning

- **Decision**: `release-please` v17 with `node-workspace` plugin, `include-component-in-tag: false`, `include-v-in-tag: true`.
- **Rationale**: Generates `v1.2.3` tags (no package-name prefix). `node-workspace` plugin handles inter-package version bumps within the monorepo. Auto-publishing via GitHub Actions gated on release-please output variables (`packages/{pkg}--release_created`). Manifest stored in `.release-please-manifest.json`.
- **Alternatives considered**: Changesets (`@changesets/cli` v3) — simpler for pnpm workspaces but requires manual `changeset add` step per PR. Loses the fully automated "merge → release" workflow this project wants.
