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
  /** Chart shape. Defaults to 'rectangular'. Takes precedence over gridLayout. */
  shape?: 'rectangular' | 'square';
  /** Day count for the rectangular shape (1–366). Defaults to 365. */
  days?: number;
  /** Edge size for the square shape (1–19). Defaults to 10. */
  size?: number;
  /**
   * Legacy layout config.
   *
   * @deprecated Use `shape`/`days`/`size` instead.
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
  size,
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
        '[github-contrib-charts] gridLayout is deprecated; use the shape/days/size props instead.',
      );
      return gridLayout;
    }
    if (shape === 'square') return { shape: 'square', size };
    return { shape: shape ?? 'rectangular', days };
  }, [shape, days, size, gridLayout]);

  const grid: ContributionGrid = useMemo(() => computeGrid(daysList, shapeConfig), [daysList, shapeConfig]);
  const stats = useMemo(() => computeStats(daysList), [daysList]);

  const width = grid.columns * (CELL_SIZE + GAP) + GAP;
  const height = grid.rows * (CELL_SIZE + GAP) + GAP;

  const [tooltip, setTooltip] = useState<{ cell: GridCell; x: number; y: number } | null>(null);

  const legend = [0, 1, 2, 3, 4] as const;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {title ? <div style={{ textAlign: 'center', fontWeight: 600, marginBottom: 4 }}>{title}</div> : null}
      <svg
        className={className}
        style={style}
        width={width}
        height={height + (showLegend ? 24 : 0)}
        role="img"
        aria-label="GitHub contribution chart"
        data-testid="chart-svg"
      >
        {grid.cells.map((row, r) =>
          row.map((cell, c) => (
            <g
              key={`${r}-${c}`}
              data-cell
              onClick={() => onCellClick?.(cell)}
              onMouseEnter={() => setTooltip({ cell, x: c * (CELL_SIZE + GAP), y: r * (CELL_SIZE + GAP) })}
              onMouseLeave={() => setTooltip(null)}
            >
              <CellShapeRenderer
                shape={cellShape}
                x={c * (CELL_SIZE + GAP)}
                y={r * (CELL_SIZE + GAP)}
                size={CELL_SIZE}
                fill={colorFor(stops, cell.contributionLevel)}
              />
            </g>
          )),
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
        {tooltip ? (
          <g data-tooltip transform={`translate(${tooltip.x + 2}, ${tooltip.y + 2})`}>
            <rect x={-2} y={-2} width={110} height={24} rx={4} fill="#24292e" opacity={0.9} />
            <text x={0} y={14} fontSize={9} fill="#fff">
              {tooltip.cell.date ? tooltip.cell.date.toISOString().slice(0, 10) : 'n/a'} ·{' '}
              {tooltip.cell.contributionCount}
            </text>
          </g>
        ) : null}
      </svg>
      {showStats ? <ContributionStats stats={stats} /> : null}
    </div>
  );
}
