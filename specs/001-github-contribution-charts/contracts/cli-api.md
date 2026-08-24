# Contract: @wearelunatic/github-contrib-charts-cli — Public API

**Package**: `@wearelunatic/github-contrib-charts` (`/cli` subpath — 2026-08-22 consolidation merged core+react+cli into one package)
**Version**: 1.0.0 (target)
**Type**: CLI tool + programmatic Node.js API
**Dependency**: `@wearelunatic/github-contrib-charts`

## CLI Interface

### Command: `github-contribution-chart`

Invoked as `npx github-contribution-chart` or via package bin.

**Arguments**:

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `<username>` | `string` | Yes | — | GitHub username (positional). |
| `--token <token>` | `string` | Yes* | `$GITHUB_TOKEN` env | GitHub PAT. Falls back to env var. |
| `--format <format>` | `"text" \| "png"` | No | Both | Output format(s). |
| `--output <path>` | `string` | No | `./output` | Output directory or file prefix. |
| `--weeks <N>` | `number` | No | `52` | Number of weeks for N×7 grid. |
| `--layout <layout>` | `"n-by-7" \| "13-by-4"` | No | `"n-by-7"` | Grid layout strategy. |
| `--shape <shape>` | `"circle" \| "square" \| "rounded-rect"` | No | `"square"` | Cell shape. |
| `--theme <theme>` | `"github-light" \| "github-dark" \| "json"` | No | `"github-light"` | Color theme. Use `json` followed by `--theme-file`. |
| `--theme-file <path>` | `string` | No | — | Path to JSON file with custom `ColorStop[]`. Requires `--theme json`. |
| `--resolution <WxH>` | `string` | No | `"800x600"` | Output PNG resolution (e.g., `"1200x800"`). |
| `--help` | flag | No | — | Print help and exit. |
| `--version` | flag | No | — | Print version and exit. |

**Output**:
- `--format text`: prints text summary to stdout.
- `--format png`: writes `{output}-chart.png` to disk.
- Default (neither flag): writes `{output}-chart.png` to disk AND prints text summary to stdout.

**Exit codes**:
- `0`: Success.
- `1`: Usage error (missing required args, invalid format).
- `2`: Authentication error.
- `3`: User not found.
- `4`: Rate limited.
- `5`: Network error.
- `6`: Filesystem error (path not writable).

**Text output format**:
```
GitHub Contribution Chart for {username}
========================================
Period: {from} to {to}

Total Contributions: {total}
  Commits:    {commits}
  PRs:        {prs}
  Issues:     {issues}
  Reviews:    {reviews}
  PR Review %: {pct}%

Grid ({rows}×{cols}, {layout}):
[block-character representation of grid, 2 chars per cell]
```

## Programmatic API

### `renderText(username: string, options: CliOptions): Promise<string>`

Returns the formatted text output as a string (same content as CLI text output). Never writes to disk.

### `renderPng(username: string, options: CliOptions): Promise<Buffer>`

Returns a PNG buffer of the rendered chart. Never writes to disk.

### Type Exports

```typescript
export type {
  CliOptions,              // All CLI options as a typed object
  OutputFormat,            // "text" | "png"
  CliError,                // Union of error types
}
```

## Contract Stability

- MAJOR: Removed/changed CLI flags or programmatic function signatures.
- MINOR: New flags, new programmatic functions, new output format options.
- PATCH: Bug fixes, help text updates, performance improvements.
