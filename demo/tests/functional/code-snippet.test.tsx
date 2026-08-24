import { describe, it, expect } from 'vitest';
import { buildInstallCommand, buildSnippet } from '../../src/code-snippet';

describe('CodeSnippet', () => {
  it('builds an npm install command for both packages', () => {
    expect(buildInstallCommand()).toBe('npm install @wearelunatic/github-contrib-charts');
  });

  it('builds a JSX snippet with the configured layout, theme and shape', () => {
    const snippet = buildSnippet({
      username: 'stefano',
      layout: '13-by-4',
      theme: 'github-dark',
      shape: 'circle',
    });
    expect(snippet).toContain("const username = 'stefano';");
    expect(snippet).toContain('gridLayout={{ type: "13-by-4" }}');
    expect(snippet).toContain('colorTheme="github-dark"');
    expect(snippet).toContain('cellShape="circle"');
  });

  it('builds a JSX snippet with the default n-by-7 layout', () => {
    const snippet = buildSnippet({ username: 'octocat', layout: 'n-by-7', theme: 'github-light', shape: 'square' });
    expect(snippet).toContain("const username = 'octocat';");
    expect(snippet).toContain('gridLayout={{ type: "n-by-7", weeks: 53 }}');
  });
});