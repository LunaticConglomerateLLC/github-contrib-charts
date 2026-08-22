# Publishing Guide

This project publishes one npm package to the public registry under the
`@wearelunatic` scope. Publishing is **fully automated** via
[release-please](https://github.com/googleapis/release-please) — there is no manual
`npm publish`.

## The package

**`@wearelunatic/github-contrib-charts`** — one package containing:
- root entry: data fetching, grids, statistics, and the React SVG components,
- `github-contribution-chart` bin: the CLI (text/PNG output),
- `/cli` subpath: programmatic CLI rendering API (`renderText`, `renderPng`, …).

React is declared as a peer dependency; `sharp`/`commander` are regular dependencies.

## How a release happens (end to end)

1. **Merge code to `main`** using conventional commits
   (`feat:`, `fix:`, `docs:`, `chore:`, …). Break something? Add `!` or a
   `BREAKING CHANGE:` footer to bump the MAJOR version.

2. **release-please detects the changes** on every push to `main` (see
   `.github/workflows/release.yml`). It opens/updates a **Release PR** that bumps
   version numbers in `package.json`, updates `CHANGELOG.md`, and updates the
   `.release-please-manifest.json`.

3. **Merge the Release PR.** On merge, release-please:
   - creates a **git tag** `v1.2.3` (no package-name prefix),
   - creates a **GitHub Release** with release notes.

4. **The publish job runs.** Still inside the same workflow run, the publish step
   checks the `releases_created` output. When the release was cut, it:
   - runs `pnpm install --frozen-lockfile`,
   - runs `pnpm build` (the `dist/` output is gitignored, so it is produced here),
   - runs `pnpm publish --filter <package> --no-git-checks` with the npm auth token.

## Requirements (one-time setup)

- **GitHub Actions secrets** (Settings → Secrets and variables → Actions):
  - `NPM_TOKEN` — an npm access token with **publish** permissions for the
    `@wearelunatic` scope.
  - `GITHUB_TOKEN` — auto-provided; used by release-please to open PRs, create tags
    and releases.
- **npm scope/package visibility**: the `@wearelunatic` scope must exist on npm
  (the package is created on first publish).
- **`package.json`**: the package declares `"publishConfig": { "access": "public" }`
  because scoped packages default to private on npm.

## Verifying a release

- Watch the **Actions** tab on GitHub: a `Release` run appears on the merge of the
  Release PR. The `Publish …` step is skipped when no release was cut.
- After the run, confirm the new version shows on npmjs.com, e.g.
  `https://www.npmjs.com/package/@wearelunatic/github-contrib-charts`.

## Dry-run publishing locally (optional)

To see what `pnpm publish` would do without publishing, build then dry-run:

```bash
pnpm build
pnpm publish --filter @wearelunatic/github-contrib-charts --no-git-checks --dry-run
```

> Do **not** run `pnpm publish` without `--dry-run` manually — this bypasses the
> automated versioning flow and risks publishing an out-of-sync version.