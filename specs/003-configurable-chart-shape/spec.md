# Feature Specification: Configurable Rectangular Chart Shape

**Feature Branch**: `003-configurable-chart-shape`

**Created**: 2026-08-26

**Status**: Draft

**Input**: User description: "the shape of rectangular shart should be configurable. by default is 7 for 52, but I can decide to make it 4 x 30. Add the ability to personalise the rectangular one with a custom number of rows and columns"

## Clarifications

### Session 2026-08-26

- Q: When you reduce rows from 7 to 6, should the day at the top-right corner move to the second-from-bottom row of the last column, keeping the most recent day anchored at the bottom-right and dropping the earliest days? → A: Option A — anchor latest day at bottom-right and re-render the last rows×columns days row-major; reducing dimensions (e.g., 7×52=364 → 6×52=312) drops the earliest days and shifts cells so the former top-right cell moves to second-from-bottom in the last column.
- Q: When a custom rectangular grid changes from 7 rows to 6 rows (e.g., 7×4 → 6×4), should the layout keep GitHub's column-major week alignment with bottom-right pinned so cells transpose column-wise as in your table? → A: Option A — column-major (GitHub week style) with bottom-right pinned, idx=col*rows+row; 7×4 (28 days: 28 21 14 07 top row, 01 bottom-right) becomes 6×4 (24 days: 24 18 12 06 top row, 01 bottom-right pinned, entire grid transposes column-wise).
- Q: Should square functionality be fully removed so a 7×7 rectangular (rows=7 columns=7) replaces the 7×7 square? → A: Option A — square removed entirely (breaking); `shape: 'square'`, `size`/`--size`, `--geometry square` rejected — use `shape: 'rectangular'` with `rows == columns` instead.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Render Rectangular Chart with Custom Rows and Columns (Priority: P1)

A developer wants a contribution chart with a non-default rectangular geometry — for example, a wide, short strip (4 rows × 30 columns) instead of the standard year view. They configure `rows: 4` and `columns: 30` in rectangular mode, and the chart renders exactly 4 rows and 30 columns where every cell represents one day, ordered chronologically column-major (GitHub week style: top-to-bottom within each column, columns left-to-right), with the most recent day at the bottom-right cell.

**Why this priority**: This is the core capability requested — without it the rectangular shape remains locked to a single geometry. It delivers the primary value: personalised rectangular charts of any proportions.

**Independent Test**: Can be fully tested by rendering the chart with `shape: 'rectangular'`, `rows: 4`, `columns: 30`, then verifying the grid has exactly 4 rows and 30 columns (120 day-cells), chronological column-major ordering (idx=col*rows+row), and the most recent date in the bottom-right cell.

**Acceptance Scenarios**:

1. **Given** a valid contribution data set, **When** the chart renders with `rows=4` and `columns=30`, **Then** the grid contains exactly 4 rows and 30 columns, each cell representing one distinct day (120-day window ending at the most recent date).
2. **Given** the same configuration rendered through the React component, CLI PNG, or CLI text output, **When** the output is inspected, **Then** all three surfaces show the identical 4×30 geometry.
3. **Given** an extreme-but-valid configuration such as `rows=1`, `columns=52` (a single-row strip), **When** the chart renders, **Then** it displays 1 row and 52 columns with correct chronology and colour levels.

---

### User Story 2 - Customise One Dimension While Keeping the Other at Default (Priority: P2)

A developer wants to widen or narrow only the time span of the chart — for example, doubling the width (`columns: 104`) while keeping the familiar 7-row weekday height, or shrinking height to 4 rows while keeping a 52-column year width. They supply only one of `rows` or `columns`; the unspecified dimension falls back to its default (rows default 7, columns default 52).

**Why this priority**: Partial personalisation is the most common real-world adjustment (e.g., multi-year strips) and builds directly on P1 without new concepts.

**Independent Test**: Can be fully tested by rendering with only `columns: 26` and verifying the grid has 7 rows (default) and 26 columns, and symmetrically with only `rows: 12` verifying 12 rows and 52 columns.

**Acceptance Scenarios**:

1. **Given** `rows=7` is implied and only `columns=26` is provided, **When** the chart renders, **Then** the grid has 7 rows and 26 columns.
2. **Given** only `rows=12` is provided, **When** the chart renders, **Then** the grid has 12 rows and 52 columns.
3. **Given** no `rows` or `columns` are provided in rectangular mode, **When** the chart renders, **Then** it uses the default 7 rows × 52 columns.

---

### User Story 3 - Configure Rectangular Dimensions via CLI and Demo Site (Priority: P3)

A CLI user generates a 4×30 PNG with command-line flags; a demo-site visitor adjusts rows and columns spinners and sees the live preview and copyable code snippet update immediately.

**Why this priority**: Exposes P1/P2 capability to non-coding personas, completing discoverability across all configuration surfaces.

**Independent Test**: Can be fully tested by running the CLI with rectangular shape plus `--rows 4 --columns 30` and verifying a 4-row text/PNG output with 30 columns; separately, on the demo site, setting rows to 4 and columns to 30 and verifying the preview and code snippet reflect the configuration within 500 ms.

**Acceptance Scenarios**:

1. **Given** the CLI invoked with `--rows 4 --columns 30`, **When** it executes, **Then** it fetches 120 days of data and writes a PNG whose grid is 4 rows × 30 columns and prints a 4-row textual grid.
2. **Given** a demo-site visitor sets rows to 4 and columns to 30 in rectangular mode, **When** the controls change, **Then** the preview updates within 500 ms without page reload and the generated snippet reflects the custom dimensions.
3. **Given** the CLI invoked with no dimension flags, **When** it executes, **Then** output uses the default 7×52 geometry.

---

### Edge Cases

- What happens when `rows` or `columns` is 0, negative, or non-integer? The system MUST reject the value with a clear validation error stating both dimensions must be positive integers.
- What happens when `rows × columns` exceeds the maximum supported window (366 days, one-year data availability)? The system MUST return a validation error citing the maximum, rather than rendering a truncated or misleading chart.
- What happens when explicit `rows`/`columns` are combined with the legacy `days` parameter in rectangular mode? The system MUST treat these as conflicting specifications and return a validation error explaining the mutually exclusive options.
- What happens when the account is younger than the requested rows × columns window (e.g., 20-day-old account requesting 4×30)? The system MUST place available days in their chronological positions ending at bottom-right and pad the earliest cells with empty zero-level cells (no date, count 0, level NONE) without error.
- What happens when there are zero contributions in the window? The system MUST render the full rows × columns geometry with all cells at NONE level and statistics showing zeros.
- What happens when only one of `rows`/`columns` is invalid? The system MUST report precisely which parameter failed validation.
- What happens on container resize with a custom aspect ratio (e.g., 4×30)? The chart MUST scale proportionally, preserving the custom rows-to-columns ratio.
- What happens when an out-of-range value such as `rows=10000` is passed? The system MUST enforce the documented maximum-window bound and fail fast with an actionable message before any network request.

## Requirements *(mandatory)*

### Functional Requirements

**Custom Rectangular Dimensions**

- **FR-001**: The rectangular chart configuration MUST accept two optional integer parameters, `rows` and `columns`, specifying the exact grid height and width.
- **FR-002**: When neither `rows` nor `columns` is specified in rectangular mode, the system MUST default to 7 rows × 52 columns (the standard GitHub-style year view).
- **FR-003**: When only `rows` is specified, the system MUST use the default column count (52); when only `columns` is specified, the system MUST use the default row count (7).
- **FR-004**: When both `rows` and `columns` are specified, the grid MUST contain exactly `rows` rows and `columns` columns, and the effective display window MUST be `rows × columns` days ending at the most recent date (inclusive), with each cell representing exactly one day. When `rows` or `columns` change, the window is recomputed as the last `rows×columns` days and re-rendered column-major (GitHub week style, idx=col*rows+row) anchored at bottom-right; the entire grid transposes column-wise (e.g., 7×4=28 days with top row 28 21 14 07 and bottom-right 01 becomes 6×4=24 days with top row 24 18 12 06 and bottom-right 01 pinned; similarly 7×52=364 → 6×52=312 drops earliest days).
- **FR-005**: The system MUST validate `rows` and `columns` as positive integers whose product does not exceed the maximum supported display window (366 days), returning a typed validation error identifying the offending parameter otherwise.
- **FR-006**: Explicit `rows`/`columns` MUST be mutually exclusive with the legacy `days` parameter in rectangular mode; providing both MUST produce a validation error listing the accepted alternatives.
- **FR-007**: Cells MUST be ordered chronologically column-major (GitHub week style: top-to-bottom within each column, columns left-to-right, idx=col*rows+row), with the earliest day at the top-left populated cell and the most recent day at the bottom-right cell. This bottom-right anchoring governs transposition when `rows` or `columns` change — removal of a row drops the top row and shifts column-wise (e.g., bottom-right 01 pinned, 28 21 14 07 → 24 18 12 06).
- **FR-008**: When fewer days of data exist than the requested `rows × columns` cells (e.g., young account), the system MUST pad the earliest positions (top of the first column, proceeding forward) with empty cells carrying `contributionCount=0`, `contributionLevel='NONE'`, and no date, preserving bottom-right recency.
- **FR-009**: The data-fetching layer MUST derive its date range from the effective geometry: `rows × columns` days ending today when dimensions are explicit, preserving existing behaviour otherwise.
- **FR-010**: Derived statistics (total contributions and breakdowns) MUST be computed over the effective display window regardless of the chosen dimensions.

**Rendering Surfaces**

- **FR-011**: The React component MUST accept `rows` and `columns` props for rectangular mode and render an SVG grid of exactly those dimensions, with tooltips and legend functioning identically to the default geometry.
- **FR-012**: The CLI MUST expose `--rows <n>` and `--columns <n>` flags for rectangular mode, rejecting combinations with `--days`.
- **FR-013**: The CLI text renderer MUST output exactly `rows` lines of `columns` cell characters for custom rectangular configurations.
- **FR-014**: The PNG renderer MUST produce an image whose pixel dimensions scale with the configured rows and columns, visually matching the SVG output for the same configuration.

**Demo Site & Consistency**

- **FR-015**: The demo site MUST provide numeric controls for rows and columns when rectangular mode is selected, updating the live preview within 500 ms and regenerating the copyable code snippet to reflect the current configuration.
- **FR-016**: Existing valid rectangular (`days`-based) configurations MUST continue to behave identically to prior behaviour, except for the documented default refinement (unspecified rectangular now 7×52) and the removal of square mode per FR-017.
- **FR-017**: Square functionality is removed (breaking change) — the system MUST reject `shape: 'square'`, `size`/`--size`, and `--geometry square` with a validation error; a square is now expressed as rectangular with `rows == columns` (e.g., `rows: 7 columns: 7` replaces a 7×7 square).

### Key Entities *(include if feature involves data)*

- **RectangularConfig** (extends the existing `ChartShapeConfig` union): `{ shape: 'rectangular', rows?: number, columns?: number, days?: number }` — optional custom geometry; `days` retained for backwards compatibility and mutually exclusive with explicit `rows`/`columns`. Defaults: rows 7, columns 52.
- **ContributionGrid**: Unchanged structure (`cells[row][col]`, `totalContributions`) but its `rows`/`columns` now reflect the custom configuration; each `GridCell` maps to exactly one day or an empty padded cell.
- **DisplayWindow**: Derived date range anchored at the most recent date, now sized `rows × columns` days when explicit dimensions are supplied; consumed by the fetch layer and statistics computation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A chart configured as 4×30 renders with exactly 4 rows, 30 columns, and 120 day-cells, with the most recent date at the bottom-right, verified across SVG, PNG, and text output.
- **SC-002**: Omitting all dimension settings produces the default 7×52 chart identically across all rendering surfaces.
- **SC-003**: Supplying a single dimension (e.g., `columns: 104`) keeps the other at its documented default (7 rows) with zero manual compensation required.
- **SC-004**: Demo-site previews reflect a changed rows/columns value within 500 ms, and the displayed code snippet matches the rendered configuration 100% of the time.
- **SC-005**: 100% of invalid inputs (zero, negative, non-integer, product above 366, conflicts with `days`, and legacy square/`size` usage per FR-017) are rejected with a specific, actionable error before any data fetch occurs.
- **SC-006**: Previously valid rectangular (`days`-based) configurations produce visually identical output to the prior release, confirming zero regressions apart from the documented 7×52 default refinement and FR-017 square removal.

## Assumptions

- The stated default of 7 rows × 52 columns intentionally refines spec 002's `days=365` default (which yielded 53 columns); the user's explicit "7 for 52" governs the new baseline and is treated as a documented, intentional refinement rather than a regression.
- Every cell in a custom rectangular grid represents exactly one calendar day; no week-alignment or aggregation is applied to custom geometries.
- The maximum display window remains 366 days (one year of contribution data availability), so `rows × columns ≤ 366`.
- Chronological ordering conventions match spec 002: column-major (GitHub week style, idx=col*rows+row), earliest top-left, most recent bottom-right, bottom-right pinned; when dimensions change, the last `rows×columns` days are re-rendered with that anchoring and transpose column-wise (e.g., 7×4 top row 28 21 14 07 with bottom-right 01 becomes 6×4 top row 24 18 12 06 with bottom-right 01 pinned).
- Explicit `rows`/`columns` and legacy `days` are mutually exclusive; an error is preferred over silent precedence to avoid ambiguous intent.
- Upper-bound enforcement exists to prevent unrenderable grids and to respect the one-year data source limitation; exact numeric caps are finalised during planning.
