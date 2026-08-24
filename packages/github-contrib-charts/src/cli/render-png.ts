import { fetchContributions } from '../fetch.js';
import { computeGrid } from '../grid.js';
import { computeStats } from '../stats.js';
import type { ContributionGrid, ContributionStats, GridLayoutConfig } from '../types.js';
import sharp from 'sharp';
import type { CliOptions } from './types.js';
import { parseResolution, resolveDateRange, resolveToken } from './resolve.js';
import { resolveStops, colorFor } from '../theme.js';

const CELL = 12;
const GAP = 3;

function gridConfig(options: CliOptions): GridLayoutConfig {
  if ((options.layout ?? 'n-by-7') === '13-by-4') return { type: '13-by-4' };
  return { type: 'n-by-7', weeks: options.weeks ?? 52 };
}

function cellMarkup(
  shape: NonNullable<CliOptions['shape']>,
  x: number,
  y: number,
  size: number,
  fill: string,
): string {
  if (shape === 'circle') {
    return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}" fill="${fill}"/>`;
  }
  const rx = shape === 'rounded-rect' ? size / 3 : 0;
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${rx}" fill="${fill}"/>`;
}

/** Builds an SVG string of the contribution chart. Exported for testing. */
export function buildContributionSvg(
  grid: ContributionGrid,
  _stats: ContributionStats,
  options: CliOptions,
): string {
  const shape = options.shape ?? 'square';
  const stops = resolveStops(options.theme ?? 'github-light');
  const { width, height } = parseResolution(options.resolution);
  const nativeWidth = grid.columns * (CELL + GAP);
  const nativeHeight = grid.rows * (CELL + GAP);

  const cells: string[] = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.columns; col++) {
      const cell = grid.cells[row]![col]!;
      const x = col * (CELL + GAP);
      const y = row * (CELL + GAP);
      const fill = colorFor(stops, cell.contributionLevel);
      cells.push(cellMarkup(shape, x, y, CELL, fill));
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${nativeWidth} ${nativeHeight}">`,
    cells.join(''),
    '</svg>',
  ].join('');
}

/**
 * Fetches a user's contributions and returns a PNG buffer of the chart.
 * Never writes to disk.
 */
export async function renderPng(username: string, options: CliOptions = {}): Promise<Buffer> {
  const token = resolveToken(options.token);
  const days = await fetchContributions(token, username, resolveDateRange());
  const stats = computeStats(days);
  const grid = computeGrid(days, gridConfig(options));
  const svg = buildContributionSvg(grid, stats, options);
  return sharp(Buffer.from(svg)).png().toBuffer();
}