import type { JSX } from 'react';
import type { CellShape } from './ui-types.js';

export interface CellShapeRendererProps {
  shape: CellShape;
  x: number;
  y: number;
  size: number;
  fill: string;
}

/** Renders a single contribution cell using the configured shape. */
export function CellShapeRenderer({ shape, x, y, size, fill }: CellShapeRendererProps): JSX.Element {
  const r = shape === 'circle' ? size / 2 : undefined;
  if (shape === 'circle') {
    return <circle cx={x + size / 2} cy={y + size / 2} r={r} fill={fill} />;
  }
  const rx = shape === 'rounded-rect' ? size / 3 : undefined;
  return <rect x={x} y={y} width={size} height={size} rx={rx} fill={fill} />;
}
