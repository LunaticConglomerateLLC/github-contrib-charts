import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AuthenticationError,
  UserNotFoundError,
  RateLimitError,
  NetworkError,
} from '../../../src/errors.js';

const renderMock = vi.hoisted(() => ({
  renderText: vi.fn(),
  renderPng: vi.fn(),
}));

const fsMock = vi.hoisted(() => ({
  writeFile: vi.fn(),
}));

vi.mock('../../../src/cli/render-text.js', () => ({ renderText: renderMock.renderText }));
vi.mock('../../../src/cli/render-png.js', () => ({ renderPng: renderMock.renderPng }));
vi.mock('node:fs/promises', () => ({ writeFile: fsMock.writeFile }));

import { run, buildCli, main } from '../../../src/cli/cli.js';

const originalExitCode = process.exitCode;
const originalStdout = process.stdout.write;
const originalStderr = process.stderr.write;

afterEach(() => {
  process.exitCode = originalExitCode;
  process.stdout.write = originalStdout;
  process.stderr.write = originalStderr;
  vi.clearAllMocks();
  fsMock.writeFile.mockResolvedValue(undefined);
});

beforeEach(() => {
  renderMock.renderText.mockResolvedValue('summary');
  renderMock.renderPng.mockResolvedValue(Buffer.from('PNG'));
});

describe('run', () => {
  it('returns 0 and writes text summary for text format', async () => {
    const writes: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      writes.push(String(chunk));
      return true;
    });
    const code = await run('octocat', { format: 'text', token: 'tok' });
    expect(code).toBe(0);
    expect(renderMock.renderText).toHaveBeenCalledWith('octocat', expect.any(Object));
    expect(writes.join('')).toContain('summary');
  });

  it('writes a PNG file for png format', async () => {
    const code = await run('octocat', { format: 'png', token: 'tok', output: '/tmp/out' });
    expect(code).toBe(0);
    expect(renderMock.renderPng).toHaveBeenCalledWith('octocat', expect.any(Object));
    expect(fsMock.writeFile).toHaveBeenCalledTimes(1);
    expect(String(fsMock.writeFile.mock.calls[0]![0])).toBe('/tmp/out-chart.png');
  });

  it('produces both text and png by default', async () => {
    const writes: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      writes.push(String(chunk));
      return true;
    });
    const code = await run('octocat', { token: 'tok', output: '/tmp/out' });
    expect(code).toBe(0);
    expect(renderMock.renderText).toHaveBeenCalledTimes(1);
    expect(renderMock.renderPng).toHaveBeenCalledTimes(1);
  });

  it('maps authentication errors to exit code 2', async () => {
    renderMock.renderText.mockRejectedValue(new AuthenticationError('bad'));
    const writes: string[] = [];
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      writes.push(String(chunk));
      return true;
    });
    const code = await run('octocat', { format: 'text', token: 'bad' });
    expect(code).toBe(2);
    expect(writes.join('')).toContain('Authentication');
  });

  it('maps user-not-found errors to exit code 3', async () => {
    renderMock.renderText.mockRejectedValue(new UserNotFoundError('nope'));
    const code = await run('octocat', { format: 'text', token: 'tok' });
    expect(code).toBe(3);
  });

  it('maps rate-limit errors to exit code 4', async () => {
    renderMock.renderText.mockRejectedValue(new RateLimitError(new Date(), 'limited'));
    const code = await run('octocat', { format: 'text', token: 'tok' });
    expect(code).toBe(4);
  });

  it('maps network errors to exit code 5', async () => {
    renderMock.renderText.mockRejectedValue(new NetworkError('offline'));
    const code = await run('octocat', { format: 'text', token: 'tok' });
    expect(code).toBe(5);
  });

  it('maps filesystem errors to exit code 6', async () => {
    renderMock.renderPng.mockResolvedValue(Buffer.from('PNG'));
    fsMock.writeFile.mockRejectedValue(Object.assign(new Error('denied'), { code: 'EACCES' }));
    const code = await run('octocat', { format: 'png', token: 'tok', output: '/root/out' });
    expect(code).toBe(6);
  });

  it('returns 1 for an invalid format value', async () => {
    const code = await run('octocat', { format: 'gif', token: 'tok' });
    expect(code).toBe(1);
  });
});

describe('buildCli', () => {
  it('creates a commander program with the correct name and arguments', () => {
    const program = buildCli();
    expect(program.name()).toBe('github-contribution-chart');
    const args = program.args;
    expect(Array.isArray(args)).toBe(true);
  });
});

describe('main / toCliOptions', () => {
  it('runs via parseAsync and rethrows unmapped errors', async () => {
    renderMock.renderText.mockRejectedValue(new Error('unmapped'));
    await expect(main(['node', 'bin', 'octocat', '--format', 'text'])).rejects.toThrow('unmapped');
  });

  it('maps a valid numeric weeks and github-dark theme through toCliOptions', async () => {
    const code = await run('octocat', {
      format: 'png',
      weeks: '7',
      layout: 'n-by-7',
      shape: 'circle',
      theme: 'github-dark',
      resolution: '1200x800',
    });
    expect(code).toBe(0);
    expect(renderMock.renderPng).toHaveBeenCalledWith('octocat', {
      token: undefined,
      output: './output',
      weeks: 7,
      layout: 'n-by-7',
      shape: 'circle',
      theme: 'github-dark',
      resolution: '1200x800',
    });
  });
});