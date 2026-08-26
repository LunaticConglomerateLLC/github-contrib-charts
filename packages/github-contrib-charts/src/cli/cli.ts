import { Command, Option } from 'commander';
import { writeFile } from 'node:fs/promises';
import {
  AuthenticationError,
  UserNotFoundError,
  RateLimitError,
  NetworkError,
} from '../errors.js';
import { renderText } from './render-text.js';
import { renderPng } from './render-png.js';
import type { CliOptions } from './types.js';
import { gridShapeConfig } from './resolve.js';

function stderr(message: string): void {
  process.stderr.write(`${message}\n`);
}

const GLYPH_SHAPES = ['circle', 'square', 'rounded-rect'] as const;

function toCliOptions(raw: Record<string, unknown>): CliOptions {
  const shapeRaw = typeof raw.shape === 'string' ? raw.shape : undefined;
  // --shape doubles as a geometry alias for rectangular/square values.
  const geometryAlias =
    shapeRaw === 'rectangular' || shapeRaw === 'square' ? shapeRaw : undefined;
  const glyph = shapeRaw !== undefined && (GLYPH_SHAPES as readonly string[]).includes(shapeRaw)
    ? (shapeRaw as (typeof GLYPH_SHAPES)[number])
    : undefined;
  return {
    token: typeof raw.token === 'string' ? raw.token : undefined,
    output: typeof raw.output === 'string' ? raw.output : './output',
    geometry:
      typeof raw.geometry === 'string'
        ? (raw.geometry as CliOptions['geometry'])
        : geometryAlias,
    days: raw.days !== undefined ? Number(raw.days) : undefined,
    size: raw.size !== undefined ? Number(raw.size) : undefined,
    weeks: raw.weeks !== undefined ? Number(raw.weeks) : undefined,
    layout: raw.layout === '13-by-4' ? '13-by-4' : raw.layout === 'n-by-7' ? 'n-by-7' : undefined,
    shape: glyph,
    cellShape:
      typeof raw['cell-shape'] === 'string'
        ? (raw['cell-shape'] as CliOptions['cellShape'])
        : (glyph ?? 'square'),
    theme: raw.theme === 'github-dark' ? 'github-dark' : 'github-light',
    resolution: typeof raw.resolution === 'string' ? raw.resolution : '800x600',
  };
}

/**
 * Executes a chart generation run and returns a process exit code.
 * Exported separately from the commander wiring for testability.
 */
export async function run(username: string, raw: Record<string, unknown>): Promise<number> {
  const format = String(raw.format ?? 'both');
  if (format !== 'text' && format !== 'png' && format !== 'both') {
    stderr(`Invalid format: ${format}. Use 'text', 'png', or 'both'.`);
    return 1;
  }
  const formats = format === 'both' ? (['text', 'png'] as const) : [format];
  const options = toCliOptions(raw);

  try {
    gridShapeConfig(options); // eager validation: invalid shape flags exit 1 before any I/O
    if (formats.includes('text')) {
      const text = await renderText(username, options);
      process.stdout.write(`${text}\n`);
    }
    if (formats.includes('png')) {
      const buf = await renderPng(username, options);
      const outPath = `${options.output}-chart.png`;
      await writeFile(outPath, buf);
    }
    return 0;
  } catch (err) {
    if (err instanceof RangeError) {
      stderr(err.message);
      return 1;
    }
    if (err instanceof AuthenticationError) {
      stderr('Authentication failed. Check your GitHub token.');
      return 2;
    }
    if (err instanceof UserNotFoundError) {
      stderr(`User not found: ${username}`);
      return 3;
    }
    if (err instanceof RateLimitError) {
      stderr('Rate limited by GitHub. Try again later.');
      return 4;
    }
    if (err instanceof NetworkError) {
      stderr('Network error. Could not reach GitHub.');
      return 5;
    }
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'EACCES' || code === 'EPERM') {
      stderr('Filesystem error: output path is not writable.');
      return 6;
    }
    throw err;
  }
}

/** Builds the commander program. Exported for testing. */
export function buildCli(): Command {
  const program = new Command();
  program
    .name('github-contribution-chart')
    .description('Generate GitHub contribution charts as text or PNG')
    .version('1.0.0')
    .argument('<username>', 'GitHub username')
    .option('--token <token>', 'GitHub personal access token (defaults to GITHUB_TOKEN env)')
    .option('--format <format>', "output format: 'text', 'png', or 'both' (default 'both')", 'both')
    .option('--output <path>', 'output path prefix for the PNG file (default ./output)')
    .option(
      '--geometry <geometry>',
      "chart geometry: 'rectangular' or 'square' (default rectangular)",
    )
    .option('--days <n>', 'days of history for the rectangular geometry, 1-366 (default 365)')
    .option('--size <n>', 'edge size N for the square geometry, N x N days, 1-19 (default 10)')
    .option('--cell-shape <shape>', "cell glyph shape: 'circle', 'square', or 'rounded-rect' (default square)")
    .option(
      '--shape <shape>',
      "deprecated: alias of --geometry for 'rectangular'/'square', otherwise cell glyph shape",
    )
    .option('--theme <theme>', "theme: 'github-light' or 'github-dark' (default github-light)")
    .option('--resolution <WxH>', 'PNG resolution (default 800x600)')
    .addOption(new Option('--weeks <n>', 'deprecated: use --days instead').hideHelp())
    .addOption(new Option('--layout <layout>', 'deprecated: use --geometry instead').hideHelp())
    .action(async (username: string, opts: Record<string, unknown>) => {
      process.exitCode = await run(username, opts);
    });
  return program;
}

/** Programmatic entry point used by the package bin. */
export async function main(argv: string[]): Promise<void> {
  const program = buildCli();
  await program.parseAsync(argv);
}
