import { describe, it, expect } from 'vitest';
import { buildInstallCommand, buildSnippet } from '../../src/code-snippet';

describe('CodeSnippet', () => {
  it('builds an npm install command for the package', () => {
    expect(buildInstallCommand()).toBe('npm install @wearelunatic/github-contrib-charts');
  });

  it('builds a rectangular snippet driven by days', () => {
    const snippet = buildSnippet({
      username: 'stefano',
      geometry: 'rectangular',
      days: 30,
      theme: 'github-dark',
      shape: 'circle',
    });
    expect(snippet).toContain("const username = 'stefano';");
    expect(snippet).toContain('shape="rectangular"');
    expect(snippet).toContain('days={30}');
    expect(snippet).toContain('from.setDate(from.getDate() - 30);');
    expect(snippet).toContain('colorTheme="github-dark"');
    expect(snippet).toContain('cellShape="circle"');
  });

  it('builds a square snippet driven by size', () => {
    const snippet = buildSnippet({
      username: 'octocat',
      geometry: 'square',
      size: 8,
      theme: 'github-light',
      shape: 'square',
    });
    expect(snippet).toContain('shape="square"');
    expect(snippet).toContain('size={8}');
    expect(snippet).toContain('from.setDate(from.getDate() - 64);');
  });

  it('defaults to a rectangular 365-day snippet', () => {
    const snippet = buildSnippet({ username: 'octocat', theme: 'github-light', shape: 'square' });
    expect(snippet).toContain('shape="rectangular"');
    expect(snippet).toContain('days={365}');
  });
});
