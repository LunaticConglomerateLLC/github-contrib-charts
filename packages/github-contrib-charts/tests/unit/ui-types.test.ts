import { describe, it, expect } from 'vitest';
import { toShapeConfig } from '../../src/ui-types.js';

describe('toShapeConfig', () => {
  it('defaults to rectangular when nothing is set', () => {
    expect(toShapeConfig({})).toEqual({ shape: 'rectangular', days: undefined });
  });

  it('passes rectangular days through', () => {
    expect(toShapeConfig({ shape: 'rectangular', days: 30 })).toEqual({
      shape: 'rectangular',
      days: 30,
    });
  });

  it('passes square size through', () => {
    expect(toShapeConfig({ shape: 'square', size: 8 })).toEqual({ shape: 'square', size: 8 });
  });

  it('maps legacy n-by-7 gridLayout when no shape is given', () => {
    expect(toShapeConfig({ gridLayout: { type: 'n-by-7', weeks: 4 } })).toEqual({
      type: 'n-by-7',
      weeks: 4,
    });
  });

  it('prefers shape over deprecated gridLayout', () => {
    expect(
      toShapeConfig({ shape: 'square', size: 5, gridLayout: { type: 'n-by-7', weeks: 4 } }),
    ).toEqual({ shape: 'square', size: 5 });
  });
});
