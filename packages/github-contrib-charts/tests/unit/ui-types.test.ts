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

  it('rejects square shape (removed per FR-017)', () => {
    expect(() => toShapeConfig({ shape: 'square', size: 8 } as any)).toThrow(RangeError);
    expect(() => toShapeConfig({ shape: 'square', size: 8 } as any)).toThrow(/square mode removed/i);
  });

  it('maps legacy n-by-7 gridLayout when no shape is given', () => {
    expect(toShapeConfig({ gridLayout: { type: 'n-by-7', weeks: 4 } })).toEqual({
      type: 'n-by-7',
      weeks: 4,
    });
  });

  it('prefers shape over deprecated gridLayout', () => {
    expect(
      toShapeConfig({ shape: 'rectangular', days: 30, gridLayout: { type: 'n-by-7', weeks: 4 } } as any),
    ).toEqual({ shape: 'rectangular', days: 30 });
  });
});

describe('toShapeConfig: custom rectangular props', () => {
  it('passes rows/columns through for rectangular', () => {
    expect(toShapeConfig({ shape: 'rectangular', rows: 4, columns: 30 })).toEqual({
      shape: 'rectangular',
      days: undefined,
      rows: 4,
      columns: 30,
    });
  });

  it('passes rows/columns through when shape defaults to rectangular', () => {
    expect(toShapeConfig({ rows: 7, columns: 26 })).toEqual({
      shape: 'rectangular',
      days: undefined,
      rows: 7,
      columns: 26,
    });
  });

  it('passes a single dimension through for rectangular', () => {
    expect(toShapeConfig({ columns: 12 })).toEqual({
      shape: 'rectangular',
      days: undefined,
      columns: 12,
    });
  });

  it('rejects square even when rows/columns are present (FR-017)', () => {
    expect(() => toShapeConfig({ shape: 'square', size: 9, rows: 4, columns: 30 } as any)).toThrow(
      /square mode removed/i,
    );
  });
});
