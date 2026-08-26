# Feature Specification: Custom Chart Layouts (Rectangular & Square)

**Feature Branch**: `002-custom-chart-layouts`

**Created**: 2026-08-25

**Status**: Draft

**Input**: User description: "I want to introduce more customization. The github chart could be rectangular or square. When rectangular, which is the default, the user can specify the number of days they want to go back. The default height is 7 boxes and they go back to the number of days. When square, the user can specify the number of squares. Each one is based on days. If the user say 10, the square will be 10x10. The bottom-right is the most recent and the top-left is the least recent."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Render Default Rectangular Chart by Days (Priority: P1)

A developer embeds the contribution chart in a React app or generates it via CLI without specifying a layout mode. The chart renders in the default rectangular mode: exactly 7 rows high, with columns derived from the requested number of days of history. The most recent day appears at the bottom-right cell and the earliest day at the top-left, with chronological ordering left-to-right, top-to-bottom (week-aligned columns).

**Why this priority**: Rectangular is the stated default and covers the existing and most common use case (GitHub-style weekly view). It must continue to work with zero configuration beyond an optional days parameter and is the baseline for backwards compatibility with the previous N×7 behaviour.

**Independent Test**: Can be fully tested by rendering the chart with `mode: rectangular` (or omitting mode) and `days: 30`, then verifying the SVG grid has 7 rows, `ceil(30/7)=5` columns, 35 cells total, with the last 30 cells populated chronologically ending at the most recent date in the bottom-right region.

**Acceptance Scenarios**:

1. **Given** a valid data set of contribution days and `mode=rectangular` with `days=14`, **When** the grid is computed and rendered, **Then** the grid has 7 rows and 2 columns (14 cells), each cell representing one day, ordered chronologically left-to-right top-to-bottom where column 0 contains the earliest 7 days and column 1 the most recent 7 days.
2. **Given** the user omits the `days` parameter in rectangular mode, **When** the chart renders, **Then** it uses the default day window (365 days, yielding 53 columns) and the data fetch covers that window.
3. **Given** `mode=rectangular` and `days=10` (not divisible by 7), **When** the grid is computed, **Then** it has 7 rows and `ceil(10/7)=2` columns (14 cells) where the 4 earliest cells (top of column 0) are empty/zero-level and the remaining 10 cells contain the 10 most recent days in order with the most recent at bottom-right.
4. **Given** `mode=rectangular` with `days=365`, **When** rendered via the React component or CLI PNG, **Then** the visual output matches the existing heatmap styling and scales correctly.

---

### User Story 2 - Render Square Chart by Size (Priority: P2)

A developer wants a compact, symmetric view for a profile badge or dense dashboard. They configure the chart in square mode with a side length N (e.g., 10), producing an N×N grid where each cell is one day. The chart shows N² days total, with the oldest day at the top-left (cell 0,0) and the most recent day at the bottom-right (cell N-1, N-1), filled row-major left-to-right, top-to-bottom.

**Why this priority**: Square mode is the new customization headline and is independent of the rectangular path. It enables distinct aspect ratios not possible with week-aligned layouts and is the second user-visible configuration surface.

**Independent Test**: Can be fully tested by rendering with `mode=square` and `size=10`, verifying the SVG grid has 10 rows, 10 columns, 100 cells, where cell `[0][0]` is the earliest date and cell `[9][9]` is the most recent date, each step incrementing by one day.

**Acceptance Scenarios**:

1. **Given** `mode=square` and `size=10` with 100 days of data, **When** the grid is computed, **Then** it has 10 rows and 10 columns, `cells[0][0]` holds the earliest day and `cells[9][9]` holds the most recent day, with row-major chronological ordering.
2. **Given** `mode=square` and `size=7` with 49 days of data, **When** rendered, **Then** the chart is visually square (equal rows and columns) and each cell's colour reflects its contribution level.
3. **Given** the user changes from rectangular `days=30` to square `size=10` in the demo site or via prop change, **When** the configuration updates, **Then** the chart re-renders immediately with the new geometry without requiring a page reload or additional data fetch beyond the needed date window.
4. **Given** `mode=square` and `size=1`, **When** the grid is computed, **Then** it has 1 row and 1 column showing only the most recent day.

---

### User Story 3 - Configure Layout via CLI and Demo Site (Priority: P3)

A CLI user or demo-site visitor configures the chart shape without writing code. CLI flags select the mode and its dimension; the demo site exposes a shape toggle (rectangular/square) plus a numeric control (days or size) and live preview.

**Why this priority**: Exposes the new customization to both programmatic (CLI/CI) and interactive (demo) personas, completing discoverability. Builds on P1/P2 grid computation.

**Independent Test**: Can be fully tested by running the CLI with `--shape rectangular --days 60` and verifying a PNG/text output of 7×9 cells, and by running with `--shape square --size 12` and verifying 12×12 output. Separately, open the demo site, toggle to Square, set size to 8, and verify live preview shows 8×8.

**Acceptance Scenarios**:

1. **Given** the CLI is invoked with `--shape square --size 10`, **When** executed, **Then** it fetches 100 days of data (or uses cached data) and writes a PNG with a 10×10 grid and prints a text grid with 10 rows.
2. **Given** the CLI is invoked with `--shape rectangular --days 90` (or omitting `--shape` which defaults to rectangular), **When** executed, **Then** it fetches 90 days of data and produces a 7×13 grid output.
3. **Given** the CLI is invoked with no shape flags, **When** executed, **Then** it defaults to rectangular with the default day window (365 days).
4. **Given** a visitor on the demo site selects "Square" and drags/inputs size to 15, **When** the control changes, **Then** the preview updates within 500ms and the generated code snippet reflects `shape: 'square', size: 15`.
5. **Given** a visitor switches back to "Rectangular" and enters 60 days, **When** the control changes, **Then** the preview reflects 7 rows and the snippet shows `shape: 'rectangular', days: 60`.

---

### Edge Cases

- What happens when `days` is 0, negative, or non-integer? The system MUST reject the value with a clear validation error indicating `days` must be a positive integer.
- What happens when `size` is 0, negative, non-integer, or exceeds a maximum (e.g., > 52 or > 30)? The system MUST reject with a clear validation error; a reasonable upper bound (e.g., 52 or 365-derived) MUST be enforced to avoid unrenderable or excessively large grids.
- What happens when the requested window (days or size²) exceeds available data (e.g., account is younger than the window, or GitHub returns fewer days)? The system MUST render available days in their chronological positions and fill remaining earliest cells with zero-level (empty) cells without error.
- What happens when `days` is not divisible by 7 in rectangular mode? The system MUST use `columns = ceil(days/7)` and pad the earliest cells in the first column with empty zero-level cells (top-filled), keeping the most recent day at bottom-right.
- What happens when data is empty (no contributions in window)? The system MUST render the full grid geometry with all cells at `NONE` level and stats showing zeros.
- What happens when both `days` and `size` are provided? The system MUST use only the parameter corresponding to the selected mode and ignore the other, or return a validation error if both modes' parameters are required to be mutually exclusive.
- What happens in square mode when N² exceeds the maximum supported date range (e.g., 366 days)? The system MUST cap or error clearly (e.g., square max size = floor(sqrt(maxDays)) = 19 for 366) and document the limit.
- What happens when the CLI or component receives an unknown shape value (e.g., `shape=circle`)? The system MUST error with an enumerated list of valid shapes: `rectangular`, `square`.
- What happens on container resize for square mode? The chart MUST remain square and scale cells proportionally, maintaining equal row/column sizing.

## Requirements *(mandatory)*

### Functional Requirements

**Chart Shape & Mode Selection**

- **FR-001**: The system MUST support two chart shape modes: `rectangular` (default) and `square`, selectable via a single configuration field (e.g., `shape` or `mode`).
- **FR-002**: When no shape is explicitly specified, the system MUST default to `rectangular`.

**Rectangular Mode**

- **FR-003**: In `rectangular` mode, the system MUST accept a `days` parameter specifying the number of days of history to display, where each cell represents one day.
- **FR-004**: `rectangular` mode MUST have a fixed height of 7 rows (one per weekday). The number of columns MUST be `ceil(days / 7)`.
- **FR-005**: `rectangular` mode MUST order cells chronologically left-to-right, top-to-bottom in week-aligned columns (row 0 = Sunday / top, row 6 = Saturday / bottom; column 0 = earliest week, last column = most recent week), with the earliest requested day at the top-left populated cell and the most recent day at the bottom-right cell.
- **FR-006**: When `days` is not divisible by 7, the system MUST pad the earliest positions in the first column with empty zero-level cells so that the most recent day remains at the bottom-right.
- **FR-007**: The system MUST provide a sensible default for `days` when omitted (default: 365 days). The default MUST be documented.
- **FR-008**: The system MUST validate `days` as a positive integer within the supported range (minimum 1, maximum 366 or one-year equivalent) and return a typed validation error otherwise.

**Square Mode**

- **FR-009**: In `square` mode, the system MUST accept a `size` parameter (integer N) specifying the square dimension, producing an N×N grid where each cell is one day.
- **FR-010**: `square` mode MUST display exactly N² days, where `size=N` yields N rows and N columns.
- **FR-011**: `square` mode MUST order cells chronologically row-major left-to-right, top-to-bottom, with the earliest day at `cells[0][0]` (top-left) and the most recent day at `cells[N-1][N-1]` (bottom-right), each successive cell incrementing by one day.
- **FR-012**: The system MUST provide a sensible default for `size` when omitted in square mode (default: 10 or 7) or require it explicitly — default MUST be documented and require user to set size via configuration.
- **FR-013**: The system MUST validate `size` as a positive integer within a bounded range (minimum 1, maximum constrained by max date window, e.g., floor(sqrt(366))=19) and return a typed validation error otherwise.
- **FR-014**: When the square window (N² days) is requested, the data-fetching layer MUST fetch exactly N² days ending at the most recent date (inclusive), not a week-aligned window.

**Grid Computation (Shared)**

- **FR-015**: The grid computation MUST replace or extend the existing `GridLayoutConfig` type to support the new shape modes while maintaining backwards compatibility or providing a documented migration path for existing `n-by-7` / `13-by-4` consumers.
- **FR-016**: Each `GridCell` MUST continue to carry `date`, `contributionCount`, and `contributionLevel`; aggregated week cells (previous `13-by-4`) are not used in the new modes — each cell maps to exactly one day or is empty.
- **FR-017**: Empty/padded cells MUST have `contributionCount=0`, `contributionLevel='NONE'`, and `date=null` (or the implied calendar date if within the requested window but with no GitHub data), handled consistently across both modes.
- **FR-018**: Contribution level mapping (NONE / quartiles) MUST be computed identically for both modes based on the max count in the requested window.

**Rendering (React Component, CLI PNG, CLI Text)**

- **FR-019**: The React component (`ContributionChart`) MUST accept the new shape configuration and render both rectangular (7×ceil(days/7)) and square (N×N) SVG grids with correct dimensions.
- **FR-020**: The CLI MUST expose flags for shape selection (`--shape rectangular|square`) and dimension (`--days <n>` for rectangular, `--size <n>` for square), with `rectangular` as default and mutually exclusive handling.
- **FR-021**: The CLI text renderer MUST render both modes as a textual grid (rectangular: 7 rows; square: N rows) using block/Unicode characters consistent with the SVG colour mapping.
- **FR-022**: The PNG renderer MUST produce an image whose pixel dimensions reflect the grid geometry (cell size + gap scaled by rows/columns) for both modes, visually matching the SVG output.
- **FR-023**: Tooltips/legends (React) MUST continue to work for both modes, showing date and contribution count per cell.

**Demo Site**

- **FR-024**: The demo site MUST provide a shape toggle (Rectangular / Square) and dynamically show the relevant dimension control: a numeric input for `days` when rectangular, and a numeric input for `size` when square.
- **FR-025**: The demo site MUST update the preview in real time when switching shapes or changing `days`/`size`, without requiring manual refresh.
- **FR-026**: The demo site MUST generate and display a copyable code snippet reflecting the current shape configuration (e.g., `<ContributionChart shape="square" size={10} .../>` or equivalent API).

**Data Fetching**

- **FR-027**: The data-fetching function MUST derive its date range from the shape configuration: rectangular window = `days` ending at today; square window = `size*size` days ending at today, inclusive. If a date range is explicitly provided, it SHOULD be used as override but MUST be validated against the shape window.
- **FR-028**: No breaking change to authentication: existing token/username handling, error types, and unauthenticated-request prohibition remain.

### Key Entities

- **ChartShapeConfig**: Union configuration selecting the chart geometry. Variants: `RectangularConfig { shape: 'rectangular', days: number }` (default 365, 7 rows, columns = ceil(days/7)) and `SquareConfig { shape: 'square', size: number }` (N×N, N² days, row-major ordering). This replaces or supersedes prior `GridLayoutConfig` (`n-by-7`, `13-by-4`).
- **ContributionDay**: Unchanged — single day's data with `date`, `contributionCount`, `contributionLevel`, `commitCount`, `pullRequestCount`, `issueCount`, `reviewCount`.
- **ContributionGrid**: Computed matrix `cells[row][col]` with `rows`, `columns`, `layout` (now `'rectangular' | 'square'`), `totalContributions`. Each `GridCell` maps to one day (or empty padded cell) with `date`, `contributionCount`, `contributionLevel`.
- **DisplayWindow**: Derived date range `[from, to)` computed from shape config (days or N²) anchored at the most recent date; used by fetch layer and stats computation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can render the default rectangular chart covering the last 365 days with zero shape configuration (only token/username required), and can switch to a square 10×10 chart by setting two fields (`shape='square', size=10`) — verified by inspecting rendered SVG grid dimensions (7×53 vs 10×10).
- **SC-002**: Rectangular mode correctly handles any `days` value from 1 to 366: for 5 random values (e.g., 1, 10, 14, 60, 365) the grid has exactly 7 rows and `ceil(days/7)` columns, with the most recent day in the bottom-right populated cell — verified by unit tests.
- **SC-003**: Square mode correctly handles any `size` from 1 to 19: for 3 representative sizes (e.g., 5, 10, 19) the grid is exactly N×N with row-major chronological ordering and the most recent day at bottom-right — verified by unit tests.
- **SC-004**: The CLI generates correct PNG and text output for both modes: `rectangular --days 30` produces a 7-row textual grid and a PNG whose height corresponds to 7 cells; `square --size 10` produces a 10-row textual grid and a PNG whose width/height correspond to 10 cells — verified by file existence and dimension checks.
- **SC-005**: The demo site allows a first-time visitor to toggle between rectangular (adjust days) and square (adjust size) and see the chart update within 500ms, and to copy a code snippet that reproduces the current shape — verified by manual or end-to-end test.
- **SC-006**: Existing contribution level colour mapping and tooltip behaviour are preserved across both modes: cells with identical contribution counts receive identical colours regardless of shape — verified by visual regression or colour-mapping unit tests.
- **SC-007**: Validation rejects invalid inputs with clear messages for 100% of invalid test cases (`days=0`, `days=-5`, `days=1000`, `size=0`, `size=100`, `shape='hex'`) without crashing — verified by error-handling tests.

## Assumptions

- The `days` window and `size²` window are anchored at the most recent day available in the fetched dataset (effectively "today" or the latest `ContributionDay` date), not at a user-supplied arbitrary end date unless the existing `dateRange` override is used.
- Default rectangular window is 365 days (one year), matching the prior maximum single-year behaviour. Alternative considered is 53 weeks = 371 days; 365 is chosen for intuitive "one year back" semantics.
- Default square size, when square is selected but no size is provided, is 10 (yielding 100 days, ~3 months), as per the user's example (`10 → 10×10`). If strict explicitness is preferred, the implementation may require `size` when shape is square.
- Rectangular height is fixed at 7 and is not user-configurable; only the horizontal extent (days) varies.
- Square cells are always single days; no weekly aggregation occurs in either new mode (aggregation was specific to the deprecated `13-by-4` layout).
- The maximum supported window is 366 days (leap-year inclusive). This constrains square's maximum size to floor(sqrt(366)) = 19 and rectangular's maximum days to 366; multi-year windows are out of scope.
- The existing `n-by-7` (`weeks`) and `13-by-4` grid types will be deprecated or mapped: `n-by-7` maps to `rectangular` with `days = weeks * 7`, and `13-by-4` is retained for backwards compatibility or deprecated with a migration note. Plan phase will decide deprecation vs dual support.
- Private implementation details (exact flag names `--days`/`--size`, prop names `shape`/`days`/`size`, or `ChartConfig` field names) may be adjusted during planning as long as the user-facing semantics (rectangular days, square N×N, defaults, ordering) are preserved.
- Timezone handling remains UTC-based as in the existing implementation; no new timezone customization is introduced.

