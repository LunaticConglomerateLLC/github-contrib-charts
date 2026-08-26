import { useMemo, useState, type CSSProperties, type JSX } from 'react';
import { computeGrid } from './grid.js';
import { computeStats } from './stats.js';
import type { ChartShapeConfig, ContributionDay, ContributionGrid, GridCell, GridLayoutConfig } from './types.js';
import { colorFor, GITHUB_DARK, GITHUB_LIGHT } from './theme.js';
import type { CellShape, ColorStop, ThemePreset } from './ui-types.js';
import { CellShapeRenderer } from './shapes.js';
import { ContributionStats } from './stats-panel.js';

const CELL_SIZE = 12;
const GAP = 3;

export interface ContributionChartProps {
  data?: ContributionDay[];
  autoFetch?: boolean;
  /** Chart shape — rectangular only (square removed per FR-017; use rows==columns for 7×7). Defaults to 'rectangular'. */
  shape?: 'rectangular';
  /** Week-aligned day count for the rectangular shape (1–366). Defaults to 364 (7×52). Mutually exclusive with rows/columns. */
  days?: number;
  /** Custom rectangular grid height (integer ≥ 1). Defaults to 7 when only `columns` is given. */
  rows?: number;
  /** Custom rectangular grid width (integer ≥ 1). Defaults to 52 when only `rows` is given; `rows × columns` must not exceed 366. */
  columns?: number;
  /**
   * Legacy layout config.
   *
   * @deprecated Use `shape`/`days`/rows/columns instead.
   */
  gridLayout?: GridLayoutConfig;
  cellShape: CellShape;
  colorTheme: ThemePreset | ColorStop[];
  title?: string;
  showLegend?: boolean;
  showStats?: boolean;
  onCellClick?: (cell: GridCell) => void;
  className?: string;
  style?: CSSProperties;
}

/** Renders a GitHub-style contribution heatmap as an SVG chart. */
export function ContributionChart({
  data,
  autoFetch = true,
  shape,
  days,
  rows,
  columns,
  gridLayout,
  cellShape,
  colorTheme,
  title,
  showLegend = true,
  showStats = true,
  onCellClick,
  className,
  style,
}: ContributionChartProps): JSX.Element {
  const daysList = data ?? [];
  if (!autoFetch && daysList.length === 0) throw new RangeError('data must not be empty when autoFetch is disabled');

  const stops: ColorStop[] =
    typeof colorTheme === 'string' ? (colorTheme === 'github-dark' ? GITHUB_DARK : GITHUB_LIGHT) : colorTheme;

  const shapeConfig: ChartShapeConfig = useMemo(() => {
    if (gridLayout && !shape) {
      console.warn(
        '[github-contrib-charts] gridLayout is deprecated; use the shape/days/rows/columns props instead.',
      );
      return gridLayout;
    }
    if ((shape as string) === 'square') {
      throw new RangeError(
        "square mode removed: use { shape: 'rectangular', rows: N, columns: N } (e.g. rows: 7, columns: 7 for 7×7)",
      );
    }
    return { shape: shape ?? 'rectangular', days, rows, columns };
  }, [shape, days, rows, columns, gridLayout]);

  const grid: ContributionGrid = useMemo(() => computeGrid(daysList, shapeConfig), [daysList, shapeConfig]);
  const stats = useMemo(() => computeStats(daysList), [daysList]);

  const width = grid.columns * (CELL_SIZE + GAP) + GAP;
  const height = grid.rows * (CELL_SIZE + GAP) + GAP;

  const [tooltip, setTooltip] = useState<{ cell: GridCell; row: number; col: number; x: number; y: number } | null>(null);

  const legend = [0, 1, 2, 3, 4] as const;

  // Clamp tooltip so it never leaves the SVG bounds (≈110×24). Keep 4px inset.
  const tooltipPos = tooltip
    ? {
        left: Math.min(Math.max(4, tooltip.x + CELL_SIZE / 2 - 55), width - 110 - 4),
        top: Math.min(Math.max(4, tooltip.y - 28), height - 24 - 4),
      }
    : null;

  return (
    <div style={{ display: 'inline-block', overflow: 'visible' }}>
      {title ? <div style={{ textAlign: 'center', fontWeight: 600, marginBottom: 4 }}>{title}</div> : null}
      <div style={{ position: 'relative', display: 'inline-block', overflow: 'visible' }}>
        <svg
          className={className}
          style={{ ...style, overflow: 'visible', display: 'block' }}
          width={width}
          height={height + (showLegend ? 24 : 0)}
          role="img"
          aria-label="GitHub contribution chart"
          data-testid="chart-svg"
        >
        {grid.cells.map((row, r) =>
          row.map((cell, c) => {
            const isHovered = tooltip?.row === r && tooltip?.col === c;
            const cx = c * (CELL_SIZE + GAP);
            const cy = r * (CELL_SIZE + GAP);
            return (
              <g
                key={`${r}-${c}`}
                data-cell
                data-hovered={isHovered ? 'true' : undefined}
                onClick={() => onCellClick?.(cell)}
                onMouseEnter={() => setTooltip({ cell, row: r, col: c, x: cx, y: cy })}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'pointer' }}
              >
                <CellShapeRenderer
                  shape={cellShape}
                  x={cx}
                  y={cy}
                  size={CELL_SIZE}
                  fill={colorFor(stops, cell.contributionLevel)}
                />
                {isHovered ? (
                  cellShape === 'circle' ? (
                    <circle
                      cx={cx + CELL_SIZE / 2}
                      cy={cy + CELL_SIZE / 2}
                      r={CELL_SIZE / 2 + 1.5}
                      fill="none"
                      stroke="#1f2328"
                      strokeWidth={1.5}
                      pointerEvents="none"
                    />
                  ) : (
                    <rect
                      x={cx - 1}
                      y={cy - 1}
                      width={CELL_SIZE + 2}
                      height={CELL_SIZE + 2}
                      rx={cellShape === 'rounded-rect' ? CELL_SIZE / 3 : 2}
                      fill="none"
                      stroke="#1f2328"
                      strokeWidth={1.5}
                      pointerEvents="none"
                    />
                  )
                ) : null}
              </g>
            );
          }),
        )}
        {showLegend ? (
          <g transform={`translate(${GAP}, ${height + 4})`}>
            <text x={0} y={10} fontSize={9} fill="#767676">
              Less
            </text>
            {legend.map((lvl) => (
              <CellShapeRenderer
                key={lvl}
                shape={cellShape}
                x={30 + lvl * (CELL_SIZE + GAP)}
                y={0}
                size={CELL_SIZE}
                fill={colorFor(stops, (['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'] as const)[lvl])}
              />
            ))}
            <text x={30 + 5 * (CELL_SIZE + GAP) + 4} y={10} fontSize={9} fill="#767676">
              More
            </text>
          </g>
        ) : null}
      </svg>
      {tooltip && tooltipPos ? (
        <div
          data-tooltip
          role="tooltip"
          style={{
            position: 'absolute',
            left: tooltipPos.left,
            top: tooltipPos.top,
            minWidth: 110,
            height: 24,
            padding: '4px 6px',
            borderRadius: 4,
            background: '#24292e',
            color: '#fff',
            fontSize: 11,
            lineHeight: '16px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {tooltip.cell.date ? tooltip.cell.date.toISOString().slice(0, 10) : 'n/a'} · {tooltip.cell.contributionCount}
        </div>
      ) : null}
      </div>
      {showStats ? <ContributionStats stats={stats} /> : null}
    </div>
  );
}
