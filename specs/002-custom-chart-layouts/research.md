# Research: Custom Chart Layouts (Rectangular & Square)

**Phase**: 0 — Outline & Research
**Date**: 2026-08-25

## 1. New Shape Modes vs Backwards Compatibility

- **Decision**: Introduce `ChartShapeConfig` as a discriminated union `{ shape: 'rectangular', days: number } | { shape: 'square', size: number }` and **retain** the old `GridLayoutConfig` (`n-by-7`, `13-by-4`) as deprecated aliases that map through an adapter in `grid.ts:computeGrid`.
- **Rationale**: User explicitly wants rectangular (default, days-based) and square (size-based) as first-class UX; old `weeks`-based `n-by-7` is strictly less expressive (`days = weeks*7` is a subset). Removing it outright would be a breaking change for any consumer using `weeks` or the demo's prior `layout=13-by-4`. Adapter keeps tests passing and lets us emit deprecation warnings and a migration guide while satisfying FR-015.
- **Mapping rules**:
  - `n-by-7` with `weeks=W` → `rectangular` with `days=W*7`
  - `13-by-4` with `weeks=W` (default 52) → retained as deprecated; optionally mapped to `rectangular` with `days=W*7` for rendering, or preserved for consumers who rely on weekly aggregation semantics. Recommendation: keep `13-by-4` implementation temporarily, mark `@deprecated` in TSDoc.
- **Alternatives considered**:
  - Hard break (remove old types): simplest but violates governance on breaking changes without `BREAKING CHANGE:` + major bump and offers no grace period.
  - Rename `GridLayoutConfig` entirely to `ChartShapeConfig` and delete old: requires codemod and docs churn; deferred to next major.
  - Keep both side-by-side with no adapter: duplicates logic and confuses consumers about which to import.

## 2. Rectangular Grid Computation & Padding

- **Decision**: `rectangular` uses `columns = ceil(days / 7)`, 7 rows fixed, week-aligned columns (row 0 = Sunday). Anchored at the most recent Sunday-aligned week so the most recent day is always at bottom-right. When `days % 7 != 0`, pad earliest cells at the top of column 0 with empty (`NONE`, `date=null` or implied date, `count=0`) cells. Ordering is column-major weeks: `date = sunday + col*7 + row`.
- **Rationale**: Reuses existing `computeNBy7` geometry (already Sunday-aligned, left-to-right chronological) but parameterised by `days` instead of `weeks`. Padding at the start (not the end) preserves FR-005/FR-006 invariant that bottom-right is most recent. `ceil` minimizes empty cells.
- **Alternatives considered**:
  - Pad at end (trailing empty cells after most recent): simpler but violates spec "top-left least recent, bottom-right most recent" for non-divisible windows.
  - Variable row count (e.g., `rows = min(7, days)` for `days<7`): breaks fixed-height promise; with `days=5` would produce 5×1 instead of 7×1 with 2 padded cells. Spec says *default height is 7 boxes* — so keep 7 rows even for small windows.
  - Start window on exact `today - (days-1)` instead of Sunday-aligned: would shift week boundaries day-by-day and misalign weekday rows. Sunday alignment keeps rows semantically weekday-stable.

## 3. Square Grid Computation

- **Decision**: `square` with `size=N` computes `total = N*N` days, `rows=N`, `columns=N`, row-major left-to-right top-to-bottom. Anchored at `lastDate` (most recent `ContributionDay`): window is `[lastDate - (N*N -1) days, lastDate]` inclusive. No Sunday alignment. Each cell maps to exactly one `ContributionDay` looked up by ISO date string; missing dates become `NONE` cells. Colour level computed via existing `levelFor(count, max)` over the window's max.
- **Rationale**: Spec example: `10 → 10×10`, bottom-right most recent, top-left least recent — uniquely identifies row-major ordering. No weekly aggregation, so Sunday alignment is unnecessary and would waste a dimension.
- **Alternatives considered**:
  - Column-major (weeks-like) for square: would confuse users expecting reading-order (row-major is standard for dense matricies).
  - Center the window on today: spec says bottom-right is most recent, so anchor must be at end, not centered.

## 4. Validation Bounds & Error Handling

- **Decision**: `days` ∈ [1, 366] inclusive (integer). `size` ∈ [1, 19] inclusive (integer), because `19*19=361 ≤ 366 < 20*20=400`. Reject with `RangeError` (or typed `ValidationError` if already defined in `errors.ts`) with message naming the field, valid range, and valid `shape` enum (`rectangular`, `square`). CLI maps these to exit code 1 and stderr.
- **Rationale**: 366 is the documented max window (leap-year inclusive) and caps both GraphQL fetch and grid size. Deriving square max from it keeps fetch invariant consistent. Integer-only avoids sub-day ambiguity.
- **Alternatives considered**:
  - Allow up to 731 days (2 years): doubles GraphQL cost and exceeds one `contributionsCollection` year-safe batch; out of scope per Assumptions.
  - Allow square up to 30 (900 days): exceeds 366 max, would require multi-year fetch batching not planned here.

## 5. CLI Flag Design

- **Decision**: `--shape <rectangular|square>` (default `rectangular`), `--days <n>` (rectangular only, default 365), `--size <n>` (square only, default 10 when shape is square). `commander` choices validation for `--shape`. Custom validation: if `shape=rectangular` and `--size` provided → warning + ignore or error; if `shape=square` and `--days` provided → likewise. Recommend **warn-and-ignore** with explicit message for ergonomics, but FR implies either is acceptable; choose strict **error** if both are explicitly set to non-default values.
- **Rationale**: Mirrors spec phrasing (`--shape square --size 10`, `--shape rectangular --days 90`). Keeping `--weeks` and `--layout` as deprecated hidden options via `commander` preserves backwards compat for scripts.
- **Alternatives considered**:
  - Single `--dimension` flag interpreted by shape: ambiguous in help text; two explicit flags are self-documenting.
  - Separate subcommands (`chart rect` / `chart square`): heavier CLI surface for a two-mode toggle.

## 6. Demo Site Controls

- **Decision**: Add a `shape` toggle (radio or segmented control: Rectangular / Square) at the top of `config-panel.tsx`. Conditionally render either a `days` number input (1–366) when `shape=rectangular` or a `size` number input (1–19) when `shape=square`. `app.tsx` holds `shape` state and derives the correct `ChartShapeConfig`; changing shape preserves the other mode's value in state (so toggling back restores prior input). Code-snippet generator switches between `shape="rectangular" days={...}` and `shape="square" size={10}`.
- **Rationale**: FR-024/FR-025 require dynamic control visibility and real-time preview. Preserving inactive mode's value avoids data loss on toggle. Integer inputs with min/max leverage browser validation + TS validation fallback.
- **Alternatives considered**:
  - Two separate toggles (layout + shape): redundant; new `shape` subsumes old `layout`.

## 7. Fetch Window Derivation

- **Decision**: `fetch.ts:fetchContributions` derives `DateRange` from `ChartShapeConfig` when the caller does not provide an explicit `dateRange`:
  - `rectangular: { from: lastDate - (days-1) days, to: lastDate + 1 day }`
  - `square: { from: lastDate - (size*size-1) days, to: lastDate + 1 day }`
  If the caller provides `dateRange`, it takes precedence but is validated that its day count matches `days` or `size²` (or a warning is emitted).
- **Rationale**: FR-027. Existing fetch already takes `DateRange`; this change centralizes window logic in `resolve.ts`/`fetch.ts` so callers (React, CLI, demo) pass only shape config.
- **Alternatives considered**:
  - Require callers to compute `DateRange` themselves: leaks logic and duplicates code across React/CLI/demo.

## 8. Shared Grid Concerns (Levels, Empty Cells, PNG/Text)

- **Decision**: No change to `levelFor` (quartile mapping) — shared across both modes, computed from window max. Empty/padded cells keep `date=null` (or implied calendar date if within window but no contribution), `count=0`, `level=NONE`. PNG `render-png.ts` computes dimensions as `width = columns*(CELL_SIZE+GAP)+GAP`, `height = rows*(CELL_SIZE+GAP)+GAP` — works for both modes without change. Text `render-text.ts` iterates `cells[row][col]` row-by-row and maps levels to block characters — already shape-agnostic.
- **Rationale**: Minimizes churn; only `grid.ts` needs mode-specific branching.

## 9. Monorepo Tooling (Re-confirmed from Feature 001)

- **Decision**: Reuse existing stack — `pnpm` workspaces, `turbo`, `vitest` 4.x, `sharp`, `commander`, `vite` for demo. No new dependencies needed.
- **Rationale**: Feature is additive; no new tooling required. Keeps exact-version pinning discipline and Node 24 LTS target.
