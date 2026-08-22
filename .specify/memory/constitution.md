<!--
Sync Impact Report
==================
Version change: 1.0.0 → 1.1.0 → 1.2.0
Modified principles:
  - v1.2.0: I. Monorepo with Separable Packages — single published package delivery
    (2026-08-22 user decision: one npm package with root + /cli entries and bin;
    modular source layout retained)
Added sections:
  - VI. Living Documentation (v1.1.0, new principle)
Removed sections: None
Follow-up TODOs: None — all placeholders resolved
-->

# GitHub Contribution Charts Constitution

## Core Principles

### I. Monorepo with Separable Packages

Every deliverable lives in a single monorepo. Source MUST stay modular with clear, single-
responsibility modules (data fetching/grids/stats, React UI, CLI). Delivery ships as ONE
published npm package whose root entry exposes the data layer and React components, plus a
bin entry for the CLI and a `/cli` subpath for its programmatic API. Internal module
boundaries remain mandatory; no new top-level modules may be introduced without a documented
purpose and spec approval. *(Amended 2026-08-22 from independently publishable packages to
single-package delivery per owner decision.)*

### II. TypeScript Mandatory

All source code MUST be written in TypeScript with strict mode enabled. `any` types are
prohibited except where explicitly justified with a comment and approved in review.
Exported APIs MUST carry explicit type annotations. Configuration files and build scripts
are exempt only when no practical TypeScript integration exists.

### III. Test-First / TDD (NON-NEGOTIABLE)

Test-Driven Development is mandatory for all feature code. The Red-Green-Refactor cycle
MUST be followed:

1. Write a failing test defining the expected behaviour.
2. Confirm the test fails for the expected reason.
3. Write the minimum code to make the test pass.
4. Refactor while keeping tests green.

Tests MUST be committed alongside the implementation in the same changeset. No feature
code may be written without a corresponding test that was seen to fail first.

### IV. Quality Gates

- **Unit test coverage MUST exceed 90%** across every package. Coverage is measured by
  line and branch coverage. Drops below 90% block merge.
- **Functional tests** MUST exist for every package's public API surface. These tests
  exercise the package as a black box from the consumer's perspective.
- **Integration tests** are REQUIRED for: cross-package contract boundaries, the
  GitHub GraphQL data-fetching layer (validated against snapshot responses), and the
  PNG output pipeline (validated via pixel-diff tolerance).
- All tests MUST pass before any merge to `main`. Skipping tests requires an explicit
  `[skip-ci]` marker and an approved waiver documenting why.

### V. Versioning & Automated Publishing

- **Conventional Commits** MUST be used for every commit message. The format is
  `type(scope): description`, where `type` is one of `feat`, `fix`, `chore`, `docs`,
  `test`, `refactor`, `ci`, `build`, `perf`. Breaking changes MUST include `!` after
  the type (e.g., `feat!:`) or a `BREAKING CHANGE:` footer.
- **release-please** manages semantic versioning. Versions MUST be generated as
  plain `vMAJOR.MINOR.PATCH` (e.g., `v1.2.3`) — package name prefixes are disabled.
- **Automated npm publishing** MUST be triggered on every release-please version bump.
  CI/CD MUST publish each changed package to npm with the new version automatically.
  No manual `npm publish` steps are permitted for versioned releases.

### VI. Living Documentation

Every new feature, public API, or behavioural change MUST include up-to-date documentation
merged in the same changeset. Documentation is not a separate phase — it is part of the
feature's definition of done.

- Every package MUST have a README covering purpose, installation, API reference,
  and a minimal working example.
- The monorepo root README MUST clearly state that this project is built using
  **GitHub SpecKit** for specification-driven development and **OpenCode** for
  AI-assisted coding workflows.
- The demo site MUST document every configuration option surfaced to users with
  inline descriptions or a dedicated usage guide.
- CLI help text (`--help`) and API docstrings/TSDoc MUST be kept synchronised with
  implementation. Stale documentation is treated as a bug.

## Technical Standards

- **Runtime**: Node.js 24+ (LTS/Krypton). Code MUST NOT depend on features or APIs
  removed or deprecated in Node 24. CI MUST run against the latest LTS line.
- **Dependency freshness**: Every dependency added MUST be pinned to the latest
  available major version at the time of addition. `package.json` MUST use exact
  versions (`"1.2.3"`, not `"^1.2.3"`) for direct dependencies. Dependabot or
  equivalent MUST be configured for automated updates.
- **Package manager**: pnpm with workspaces for the monorepo. Lockfile
  (`pnpm-lock.yaml`) MUST be committed.
- **Module system**: ESM (`"type": "module"`) for all packages. CommonJS is not
  permitted.
- **License**: MIT for all published packages.

## Development Workflow

- The `main` branch is the source of truth. CI MUST pass on all commits to `main`.
- Feature branches MUST be named `feature/<slug>` and squash-merged into `main`.
- Code review is mandatory before merge. At minimum, a self-review checklist covering
  the Core Principles MUST be completed.
- The demo site (GitHub Pages) MUST be deployed from the `main` branch automatically on
  relevant changes.
- Breaking changes MUST be documented in the release notes and MUST bump the MAJOR
  version via conventional commit syntax.

## Governance

This constitution supersedes all other development practices and conventions for this
project. Any deviation MUST be documented, approved by the maintainer, and recorded as
an amendment or temporary waiver with an expiry date.

Amendments follow this procedure:
1. Propose the change in a tracked issue or PR.
2. Document the rationale, impact analysis, and migration plan (if applicable).
3. Update this file and increment the version according to semantic versioning rules.
4. Ratify by merging the amendment PR.

Compliance is verified at code review time. Every reviewer MUST check that the changes
under review do not violate the Core Principles. Repeated or intentional violations are
grounds to revert.

**Version**: 1.1.0 | **Ratified**: 2026-08-16 | **Last Amended**: 2026-08-16
