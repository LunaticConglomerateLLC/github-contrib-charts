import { describe, it, expect } from 'vitest';
import { buildInstallCommand, buildSnippet } from '../../src/code-snippet';

describe('CodeSnippet', () => {
  it('builds an npm install command for the package', () => {
    expect(buildInstallCommand()).toBe('npm install @wearelunatic/github-contrib-charts');
  });

  it('builds a rectangular snippet driven by rows/columns', () => {
    const snippet = buildSnippet({
      username: 'stefano',
      rows: 4,
      columns: 30,
      theme: 'github-dark',
      shape: 'circle',
    });
    expect(snippet).toContain("const username = 'stefano';");
    expect(snippet).toContain('shape="rectangular"');
    expect(snippet).toContain('rows={4}');
    expect(snippet).toContain('columns={30}');
    expect(snippet).toContain('from.setDate(from.getDate() - 120);');
    expect(snippet).toContain('colorTheme="github-dark"');
    expect(snippet).toContain('cellShape="circle"');
  });

  it('defaults to a rectangular 364-day (7×52) snippet', () => {
    const snippet = buildSnippet({ username: 'octocat', theme: 'github-light', shape: 'square' });
    expect(snippet).toContain('shape="rectangular"');
    expect(snippet).toContain('rows={7}');
    expect(snippet).toContain('columns={52}');
    expect(snippet).toContain('from.setDate(from.getDate() - 364);');
  });
});
