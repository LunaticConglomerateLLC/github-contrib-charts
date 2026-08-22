import { describe, it, expect } from 'vitest';
import * as core from '../../src/index.js';

describe('@wearelunatic/github-contrib-charts public API', () => {
  it('exports fetchContributions', () => {
    expect(typeof core.fetchContributions).toBe('function');
  });

  it('exports computeGrid', () => {
    expect(typeof core.computeGrid).toBe('function');
  });

  it('exports computeStats', () => {
    expect(typeof core.computeStats).toBe('function');
  });

  it('exports error classes', () => {
    expect(core.FetchError).toBeTypeOf('function');
    expect(core.AuthenticationError).toBeTypeOf('function');
    expect(core.UserNotFoundError).toBeTypeOf('function');
    expect(core.RateLimitError).toBeTypeOf('function');
    expect(core.NetworkError).toBeTypeOf('function');
  });

  it('error classes form an instanceof hierarchy', () => {
    const err = new core.AuthenticationError();
    expect(err).toBeInstanceOf(core.FetchError);
    expect(err).toBeInstanceOf(Error);
  });
});