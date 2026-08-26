import { fetchContributions } from '../fetch.js';
import { computeGrid } from '../grid.js';
import { computeStats } from '../stats.js';
import type { ContributionGrid, ContributionStats } from '../types.js';
import type { CliOptions } from './types.js';
import { gridShapeConfig, resolveDateRange, resolveToken } from './resolve.js';

/** Builds the grid shape config from options. Alias of {@link gridShapeConfig}. */
export const gridConfig = gridShapeConfig;

/** Renders the block-character grid representation (two characters per cell). */
function gridGlyphs(grid: ContributionGrid): string {
  const lines: string[] = [];
  for (let row = 0; row < grid.rows; row++) {
    let line = '';
    for (let col = 0; col < grid.columns; col++) {
      const cell = grid.cells[row]![col]!;
      if (cell.date === null && cell.contributionCount === 0 && cell.dateRange === null) {
        line += '  ';
      } else if (cell.contributionCount === 0) {
        line += '··';
      } else if (cell.contributionLevel === 'FIRST_QUARTILE') {
        line += '░░';
      } else if (cell.contributionLevel === 'SECOND_QUARTILE') {
        line += '▒▒';
      } else if (cell.contributionLevel === 'THIRD_QUARTILE') {
        line += '▓▓';
      } else {
        line += '██';
      }
    }
    lines.push(line);
  }
  return lines.join('\n');
}

/** Formats a text summary of the chart. */
export function formatText(username: string, stats: ContributionStats, grid: ContributionGrid): string {
  const from = stats.dateRange.from.toISOString().slice(0, 10);
  const to = stats.dateRange.to.toISOString().slice(0, 10);
  return [
    `GitHub Contribution Chart for ${username}`,
    '========================================',
    `Period: ${from} to ${to}`,
    '',
    `Total Contributions: ${stats.totalContributions}`,
    `  Commits:    ${stats.totalCommits}`,
    `  PRs:        ${stats.totalPullRequests}`,
    `  Issues:     ${stats.totalIssues}`,
    `  Reviews:    ${stats.totalReviews}`,
    `  PR Review %: ${stats.pullRequestReviewPercentage}%`,
    '',
    `Grid (${grid.rows}×${grid.columns}, ${grid.layout}):`,
    gridGlyphs(grid),
  ].join('\n');
}

/**
 * Fetches a user's contributions and returns a formatted text summary.
 * Never writes to disk.
 */
export async function renderText(username: string, options: CliOptions = {}): Promise<string> {
  const token = resolveToken(options.token);
  const days = await fetchContributions(token, username, resolveDateRange(options));
  const stats = computeStats(days);
  const grid = computeGrid(days, gridShapeConfig(options));
  return formatText(username, stats, grid);
}