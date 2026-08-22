import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CellShapeRenderer } from '../../../src/shapes.js';
import { GITHUB_LIGHT } from '../../../src/theme.js';

describe('CellShapeRenderer', () => {
  it('renders a circle when shape is circle', () => {
    const { container } = render(
      <svg>
        <CellShapeRenderer shape="circle" x={0} y={0} size={10} fill="#ebedf0" />
      </svg>,
    );
    expect(container.querySelector('circle')).not.toBeNull();
  });

  it('renders a square when shape is square', () => {
    const { container } = render(
      <svg>
        <CellShapeRenderer shape="square" x={0} y={0} size={10} fill="#ebedf0" />
      </svg>,
    );
    const rect = container.querySelector('rect');
    expect(rect).not.toBeNull();
    expect(rect!.getAttribute('rx')).toBeFalsy();
  });

  it('renders a rounded rectangle when shape is rounded-rect', () => {
    const { container } = render(
      <svg>
        <CellShapeRenderer shape="rounded-rect" x={0} y={0} size={10} fill="#ebedf0" />
      </svg>,
    );
    const rect = container.querySelector('rect');
    expect(rect).not.toBeNull();
    expect(rect!.getAttribute('rx')).toBeTruthy();
  });

  it('uses the provided fill colour', () => {
    const { container } = render(
      <svg>
        <CellShapeRenderer shape="square" x={0} y={0} size={10} fill={GITHUB_LIGHT[4]!.color} />
      </svg>,
    );
    expect(container.querySelector('rect')!.getAttribute('fill')).toBe(GITHUB_LIGHT[4]!.color);
  });
});
