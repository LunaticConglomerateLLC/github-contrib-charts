# Contract: CLI — `github-contribution-chart`

**Module**: `packages/github-contrib-charts/src/cli/cli.ts`
**Bin**: `github-contribution-chart`
**Date**: 2026-08-25

## Synopsis

```bash
github-contribution-chart <username> [options]
```

## Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--shape <shape>` | `rectangular \| square` | `rectangular` | Chart geometry. Choices validation via commander. |
| `--days <n>` | `integer 1–366` | `365` | Rectangular only: days of history. Ignored when `--shape square` (warn if explicitly set). |
| `--size <n>` | `integer 1–19` | `10` (when square) | Square only: side length N (N×N days). Ignored when `--shape rectangular` (warn if explicitly set). |
| `--token <token>` | `string` | `GITHUB_TOKEN` env | GitHub PAT. |
| `--format <format>` | `text \| png \| both` | `both` | Output format. |
| `--output <path>` | `string` | `./output` | PNG output path prefix (actual file: `<prefix>-chart.png`). |
| `--theme <theme>` | `github-light \| github-dark` | `github-light` | Colour theme. |
| `--shape-cell <shape>` | `circle \| square \| rounded-rect` | `square` | Cell glyph shape (existing `--shape` conflict → rename glyph flag to `--cell-shape` if needed; otherwise `--shape` is geometry and glyph flag is `--cell-shape` or keep existing `--shape` for glyph and rename geometry flag to `--geometry`. **Plan decision: geometry flag is `--shape` (rectangular/square), glyph flag is `--cell-shape` or keep `--shape` backward-compat alias — resolve in impl to avoid break). |
| `--resolution <WxH>` | `string` | `800x600` | PNG resolution hint. |
| `--weeks <n>` | `integer` | *(deprecated)* | Hidden deprecated alias → maps to `--days = weeks*7`. |
| `--layout <layout>` | `n-by-7 \| 13-by-4` | *(deprecated)* | Hidden deprecated alias → maps to `--shape`. |

**Note on `--shape` naming collision**: Prior CLI had `--shape` for cell glyph (`circle|square|rounded-rect`). To avoid breaking, plan mandates: keep glyph flag as `--cell-shape` preferred and accept `--shape` as alias for glyph when value is a glyph; geometry flag is `--geometry` OR `--shape` with geometry choices. **Recommended**: introduce `--geometry rectangular|square` for grid geometry and keep `--shape` for glyph, or overload `--shape` to accept both sets with disambiguation and deprecation warning. Contract documents the intended surface; implementation chooses the least-breaking name and documents it in `--help`.

Resolving: **Implemented contract** will expose:
- `--geometry <rectangular|square>` (preferred) **or** `--shape <rectangular|square>` for grid geometry — choose one and alias the other.
- `--cell-shape <circle|square|rounded-rect>` for glyph (accept legacy `--shape` when glyph value).

## Behavior

- Default invocation (`<username>` only) → `rectangular` with `days=365`, format `both`.
- `--geometry square --size 10` → fetches `100` days ending at today, renders `10×10` grid to PNG/text.
- `--geometry rectangular --days 30` → `7×5` grid (ceil 30/7=5).
- `--geometry square` without `--size` → uses default `size=10`.
- Mutually exclusive validation: providing `--days` when `geometry=square` and value is non-default → stderr warning or exit 1 with message `size is used for square; days is ignored`.
- Invalid `days`/`size` → exit 1, stderr `days must be an integer between 1 and 366` / `size must be an integer between 1 and 19`.
- Invalid `geometry` → commander choices error, exit 1 listing valid values.

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Invalid arguments / validation error |
| 2 | AuthenticationError |
| 3 | UserNotFoundError |
| 4 | RateLimitError |
| 5 | NetworkError |
| 6 | Filesystem error (output not writable) |

## Examples

```bash
# Default rectangular (365 days)
github-contribution-chart octocat

# Rectangular 30 days, text only
github-contribution-chart octocat --geometry rectangular --days 30 --format text

# Square 10×10, PNG only
github-contribution-chart octocat --geometry square --size 10 --format png --output ./out

# Deprecated compat (still works, warns)
github-contribution-chart octocat --weeks 4 --layout n-by-7
```

## Help Text Snippet

```
Options:
  --geometry <rectangular|square>  chart geometry (default: rectangular)
  --days <n>                       days for rectangular (1-366, default: 365)
  --size <n>                       size for square N×N (1-19, default: 10)
  --cell-shape <shape>             cell glyph: circle, square, rounded-rect (default: square)
  --theme <theme>                  github-light | github-dark (default: github-light)
  --format <format>                text, png, or both (default: both)
  --output <path>                  output prefix for PNG (default: ./output)
```
