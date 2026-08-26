# Research: Configurable Rectangular Chart Shape

**Branch**: `003-configurable-chart-shape` | **Date**: 2026-08-26 | **Spec**: [spec.md](./spec.md)

All design questions raised during planning are resolved below. No open NEEDS CLARIFICATION items remain.

## D1: Configuration representation & precedence

**Decision**: Extend the existing rectangular variant of `ChartShapeConfig` to
`{ shape: 'rectangular'; days?: number; rows?: number; columns?: number }`. Precedence inside rectangular mode:

1. If `rows` and/or `columns` are present → **custom geometry** path (`days` MUST be absent, else validation error per spec FR-006).
2. Else if `days` is present → legacy **week-aligned** path (unchanged behaviour).
3. Else → default: 7 rows × 52 columns (see D3).

Missing single dimension falls back to its default (rows→7, columns→52) per spec FR-003.

**Rationale**: One union variant keeps the public API small and mirrors how `days`/`size` already coexist across shapes. A hard error on `days` + explicit dimensions follows spec FR-006 and avoids silent-precedence ambiguity.

**Alternatives considered**:
- Separate `{ shape: 'rectangular-custom' }` variant — rejected: leaks an internal distinction into the public API and complicates every switch site.
- Silent precedence (ignore `days` when rows/columns given) — rejected by spec FR-006; ambiguous user intent.

## D2: Cell ordering for custom geometries

**Decision**: Explicit-dimension grids use **column-major chronological ordering** (GitHub week style, `idx = col*rows + row`), top-to-bottom within each column then left-to-right across columns, earliest day at top-left populated cell, most recent at bottom-right pinned. Reduction of rows drops the top row and transposes column-wise (e.g., 7×4 28→6×4 24: 28 21 14 07 top row with 01 bottom-right becomes 24 18 12 06 top row with 01 pinned).

**Rationale**: Spec FR-007 (clarified 2026-08-26) mandates GH week style with bottom-right pinning; the user's table demonstrates column-major transposition (removing a row shifts `28→24`, `21→18` etc., not row-major shift). When dimensions change, the window is recomputed as the last `rows×columns` days anchored at bottom-right and re-rendered column-major, fully transposing as the table shows.

**Alternatives considered**:
- Row-major left-to-right top-to-bottom (generalised square `idx = row*columns + col`) — rejected: contradicts spec FR-007 clarification and the user's 7×4→6×4 pinned transpose example (would shift 28→27 instead of 28→24).
- Week-aligned row-major for custom shapes — rejected: same contradiction.

## D3: Implementing the 7×52 default

**Decision**: Keep the default on the legacy week-aligned pathway and change `DEFAULT_DAYS` from 365 → 364 so `ceil(364/7) = 52` columns exactly. Omitting all options therefore renders a true 7×52 GitHub-style year view.

**Rationale**: The spec's SC-002 requires "default 7×52" while FR-002 describes it as "the standard GitHub-style year view" — which is visually week-aligned. Routing the default through the new custom path would silently change the default chart's cell ordering (row-major instead of Sunday-aligned columns), violating FR-016's zero-regression intent beyond the documented refinement.

**Alternatives considered**:
- Default = custom `{rows:7, columns:52}` — rejected: changes default visual layout (ordering), larger regression surface.
- Keep DEFAULT_DAYS=365 (53 columns) — rejected: contradicts the user's explicit "by default is 7 for 52" and SC-002.

**Impact note**: This is the one intentional, documented behavioural change (spec Assumptions + FR-016). Release notes must call it out; conventional commit may warrant `feat!:` if maintainers deem the default shift breaking (decision deferred to implementation review).

## D4: Validation rules & error strategy

**Decision**: New validators in `errors.ts`, following the existing `RangeError` convention:

- `validateRows(n)` / `validateColumns(n)`: positive integers ≥ 1 (message names the offending parameter explicitly — spec edge case).
- Product bound: `rows × columns ≤ MAX_DAYS (366)` enforced in config-level validation with a message citing the maximum window.
- Conflict detection: `days` together with `rows` or `columns` → RangeError listing accepted alternatives (FR-006).
- All validation runs in `validateChartShapeConfig` before any fetch occurs (SC-005 fail-fast).

**Rationale**: Reuses the established typed-error pattern (`validateDays`); parameter-specific messages satisfy the "report precisely which parameter failed" edge case; no new error class needed since callers already handle `RangeError`. Square's `validateSize` is removed with square (D6).

**Alternatives considered**:
- Dedicated `InvalidDimensionsError` class — rejected: breaks consistency with current API error contract for marginal benefit.
- Warnings instead of errors for conflicts — rejected by spec FR-005/FR-006.

## D5: CLI flag semantics

**Decision**: Add `--rows <n>` and `--columns <n>` flags (rectangular-only):

- Presence of either implies rectangular custom geometry; `--geometry` is removed (rectangular is the only shape).
- Combining `--rows`/`--columns` with `--days` → hard error (FR-006/FR-012).
- `--size` / `--geometry square` removed per D6 → hard error (FR-017) explaining square is now `rows==columns`.
- `--help` text documents defaults (7×52), bounds, and exclusivity; no `--size` / `--geometry` flags.

**Rationale**: Hard errors over warnings here match the spec's rejection requirements and CI ergonomics (fail fast in pipelines). Existing warn-and-ignore stays for the pre-existing `--size`-with-rectangular / `--days`-with-square cases to avoid unrelated behaviour changes.

**Alternatives considered**:
- Warn-and-ignore for `--days` + `--rows` — rejected: contradicts FR-012 ("rejecting combinations").
- A combined `--grid RxC` syntax — rejected as additive scope; can be layered later without contract change.

## D6: Square removal (breaking, FR-017)

**Decision**: Square shape removed entirely. `ChartShapeConfig` no longer admits `{ shape:'square' }` / `size`; `NormalizedShapeConfig` loses the `square` branch; CLI `--geometry square` and `--size` are rejected (RangeError); `warnCrossModeParam` for square is deleted. A square is now `rows==columns` under rectangular custom geometry (e.g., 7×7).

**Rationale**: Spec FR-017 clarification 2026-08-26: `rows==columns` already yields a square, so retaining a parallel `square`/`size` path only duplicates code, tests, and docs. Single rectangular path reduces surface and matches GH's rectangular default.

**Alternatives considered**:
- Keep square as deprecated alias — rejected: leaves duplicate geometry and delays breakage.
- Keep square alongside rectangular — rejected: duplicates ordering logic contrary to spec.

## D7: Normalized representation (rectangular-only)

**Decision**: `NormalizedShapeConfig` is rectangular-only with explicit geometry:

```text
{ shape: 'rectangular'; geometry: 'weeks'; days: number }
| { shape: 'rectangular'; geometry: 'custom'; rows: number; columns: number }
```

`shapeDayCount` returns `days` (weeks) or `rows*columns` (custom); `displayWindow`, fetch override checks, and stats windows derive from it unchanged. No `square` branch.

**Rationale**: Downstream consumers (fetch, grid, renderers) get one discriminated union instead of re-running precedence logic; legacy paths keep their exact shape via the `'weeks'` discriminator.

## D8: Rendering surfaces (rectangular-only)

**Decision**:
- Grid computation: rectangular only, column-major `computeDayGrid(days, rows, columns)` (`idx = col*rows + row`, bottom-right pinned, column-wise transpose). No square branch. Legacy week-aligned and 13-by-4 computations remain.
- Text/PNG renderers: iterate `grid.rows`/`grid.columns`; no structural change — 4×30 PNG pixel size scaling (FR-014) verified.
- React `ChartConfig` gains `rows?`/`columns?` props passed through `toShapeConfig` (rectangular only).
- Demo site: numeric inputs for rows/columns shown when rectangular is selected (replacing/augmenting the days input per D1 precedence), live preview + regenerated snippet reflecting the props.

**Rationale**: Maximal reuse; renderer genericity confirmed (`render-text.ts`/`render-png.ts` consume `ContributionGrid` dimensions only). Single rectangular column-major path covers squares via `rows==columns`.

## D9: Testing strategy (TDD mapping)

**Decision**: Red-green-refactor order per constitution III:
1. Unit: `tests/unit/grid-custom.test.ts` (geometry, ordering, padding, extremes 1×N / N×1), extended `grid-edge-cases.test.ts` (validation conflicts), `ui-types.test.ts` (prop mapping).
2. CLI unit: `tests/cli/unit/grid-config.test.ts` additions for `--rows/--columns` resolution and conflict errors; render tests for 4-row text output.
3. Functional: extend `core-api.test.ts` + `cli-api.test.ts` black-box coverage for new config acceptance/rejection (public-surface gate IV).
4. Integration: `fetch.test.ts` — window derivation for rows×columns equals product days; date-range override matching.
5. Demo component tests for controls/snippet update.

Coverage must stay >90% line/branch after the change (gate IV).
