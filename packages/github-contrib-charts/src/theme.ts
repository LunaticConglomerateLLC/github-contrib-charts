import type { ContributionLevel } from './types.js';
import type { ColorStop } from './ui-types.js';

export type { ColorStop };

/** GitHub light theme colour stops, matching GitHub's contribution palette. */
export const GITHUB_LIGHT: ColorStop[] = [
  { level: 'NONE', color: '#ebedf0' },
  { level: 'FIRST_QUARTILE', color: '#9be9a8' },
  { level: 'SECOND_QUARTILE', color: '#40c463' },
  { level: 'THIRD_QUARTILE', color: '#30a14e' },
  { level: 'FOURTH_QUARTILE', color: '#216e39' },
];

/** GitHub dark theme colour stops, matching GitHub's dark contribution palette. */
export const GITHUB_DARK: ColorStop[] = [
  { level: 'NONE', color: '#161b22' },
  { level: 'FIRST_QUARTILE', color: '#0e4429' },
  { level: 'SECOND_QUARTILE', color: '#006d32' },
  { level: 'THIRD_QUARTILE', color: '#26a641' },
  { level: 'FOURTH_QUARTILE', color: '#39d353' },
];

/**
 * Resolves a colour stop array to the colour for a given contribution level.
 * Falls back to the NONE colour when no matching stop is found.
 */
export function colorFor(stops: ColorStop[], level: ContributionLevel): string {
  const match = stops.find((s) => s.level === level);
  return match?.color ?? stops[0]?.color ?? '#ebedf0';
}

/** Theme option: a built-in preset name or a custom array of colour stops. */
export type ThemeOption = 'github-light' | 'github-dark' | ColorStop[];

/** Resolves a ThemeOption to a concrete array of colour stops. */
export function resolveStops(theme: ThemeOption): ColorStop[] {
  if (theme === 'github-dark') return GITHUB_DARK;
  if (theme === 'github-light') return GITHUB_LIGHT;
  return theme;
}
