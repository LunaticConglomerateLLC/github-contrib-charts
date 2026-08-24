import type { DateRange } from '../types.js';

/** Resolves the GitHub token from options or the GITHUB_TOKEN env var. */
export function resolveToken(token?: string): string {
  return token ?? process.env.GITHUB_TOKEN ?? '';
}

/** Default date range: the trailing 366 days (inclusive from, exclusive to). */
export function resolveDateRange(): DateRange {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 366);
  return { from, to };
}

/** Parses a 'WxH' resolution string, falling back to 800x600. */
export function parseResolution(resolution?: string): { width: number; height: number } {
  if (!resolution) return { width: 800, height: 600 };
  const match = /^(\d+)x(\d+)$/i.exec(resolution);
  if (!match) return { width: 800, height: 600 };
  return { width: Number(match[1]), height: Number(match[2]) };
}
