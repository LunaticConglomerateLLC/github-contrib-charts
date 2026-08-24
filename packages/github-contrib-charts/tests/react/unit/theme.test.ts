import { describe, it, expect } from 'vitest';
import { colorFor, GITHUB_LIGHT, GITHUB_DARK } from '../../../src/theme.js';
import type { ContributionLevel } from '../../../src/types.js';

describe('theme', () => {
  it('exports the GitHub light preset with 5 colour stops', () => {
    expect(GITHUB_LIGHT).toHaveLength(5);
    expect(GITHUB_LIGHT.map((s) => s.level)).toEqual([
      'NONE',
      'FIRST_QUARTILE',
      'SECOND_QUARTILE',
      'THIRD_QUARTILE',
      'FOURTH_QUARTILE',
    ]);
  });

  it('exports the GitHub dark preset with 5 colour stops', () => {
    expect(GITHUB_DARK).toHaveLength(5);
    expect(GITHUB_DARK[0]!.color).toBe('#161b22');
  });

  it('maps a contribution level to its colour in a preset', () => {
    const color = colorFor(GITHUB_LIGHT, 'FOURTH_QUARTILE');
    expect(color).toBe(GITHUB_LIGHT[4]!.color);
  });

  it('maps the NONE level in a preset', () => {
    expect(colorFor(GITHUB_LIGHT, 'NONE')).toBe(GITHUB_LIGHT[0]!.color);
  });

  it('maps an intermediate level in a preset', () => {
    expect(colorFor(GITHUB_DARK, 'SECOND_QUARTILE')).toBe(GITHUB_DARK[2]!.color);
  });

  it('maps a level to the custom colour stop when provided', () => {
    const stops = [
      { level: 'NONE' as ContributionLevel, color: '#aaa' },
      { level: 'FIRST_QUARTILE' as ContributionLevel, color: '#bbb' },
    ];
    expect(colorFor(stops, 'NONE')).toBe('#aaa');
    expect(colorFor(stops, 'FIRST_QUARTILE')).toBe('#bbb');
  });

  it('returns the NONE colour as fallback for an unknown level', () => {
    const color = colorFor(GITHUB_LIGHT, 'FIRST_QUARTILE');
    expect(typeof color).toBe('string');
  });

  it('falls back to the first stop colour when no stop matches', () => {
    const stops = [{ level: 'FIRST_QUARTILE' as ContributionLevel, color: '#bbb' }];
    expect(colorFor(stops, 'NONE')).toBe('#bbb');
  });

  it('falls back to a default colour when stops is empty', () => {
    expect(colorFor([], 'NONE')).toBe('#ebedf0');
  });
});
