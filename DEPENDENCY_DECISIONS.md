# Dependency Decisions

Rationale for every entry in the root `pnpm.overrides` block. Every override
forces a single version of a (potentially transitive) dependency across the
entire workspace, so each one is a load-bearing decision and needs a reason.

If you add, change, or remove an override, also update this file in the same
commit. PRs touching `package.json` overrides without a matching change here
should fail review.

## Format

Each entry records:

- **Package** and pinned version
- **Why**: the actual reason the override exists
- **Added**: approximate date the override was introduced
- **Revisit**: when this override can be reconsidered (typically when an
  upstream consumer updates its declared range)

## Active overrides

### `hono`: `4.12.18`

- **Why**: Transitive dep pulled in by Better Auth's request handling. Pinned
  to a single exact version so installs cannot drift onto an unreviewed 4.x
  release. (Was a `^4.12.2` caret; tightened to exact 2026-05-23 per project
  rule `feedback_pin_exact_versions`.)
- **Added**: pre-2026; pinned exact 2026-05-23.
- **Revisit**: when bumping Better Auth, drop the override and re-test.

### `valibot`: `1.4.2`

- **Why**: Transitive pin to keep a single major version across the workspace
  (originally added during the spec-021 parallel-app migration to stop the two
  apps resolving different valibot trees). The migration is complete and
  `savepoint-app/` is gone; the override is now a defensive single-version pin
  for the remaining transitive consumers. (Was a `^1.2.0` caret; tightened to
  exact 2026-05-23 — the caret already resolved to 1.2.0, so this is a no-tree
  change that removes future re-resolution drift.) Bumped to `1.4.2`
  2026-11-12 for Dependabot alert #183 (`record()` issue paths break
  `flatten()`).
- **Added**: spec 021 era; pinned exact 2026-05-23.
- **Revisit**: drop if no transitive consumer pulls valibot after a dependency
  sweep.

### `js-yaml`: `4.1.1`

- **Why**: CVE-driven (CVE-2019-10744 / CVE-2024-37890 family). Old YAML
  parsers still appear in transitive trees via legacy build tooling; pin
  forces them onto a patched line. (Was a `^4.1.1` caret; tightened to exact
  2026-05-23.)
- **Added**: pre-2026; pinned exact 2026-05-23.
- **Revisit**: only if upstream consumers move to a hard `^5` pin.

### `fast-xml-parser`: `5.12.0`

- **Why**: Pinned exactly (per project rule `feedback_pin_exact_versions`) to
  the version that the AWS SDK currently resolves. Earlier versions had RCE
  CVEs (CVE-2024-41818). Replacing the previous open-ended `>=5.3.8` so future
  installs cannot drift quietly into a version we haven't reviewed.
- **Added**: original CVE remediation pre-2026; tightened to `5.4.1` 2026-05-18,
  bumped to `5.7.3` to track the AWS SDK's resolved version, then to `5.12.0`
  2026-11-12 for Dependabot alert #315 (quadratic CPU on unterminated tags).
- **Revisit**: when the AWS SDK or other primary consumers declare a tighter
  range that includes `5.12.0` or later.

### `fast-xml-builder`: `1.2.0`

- **Why**: Companion to the `fast-xml-parser` pin — the AWS SDK XML codec pulls
  both. Exact pin keeps the builder on the reviewed version alongside the parser.
- **Added**: pre-2026.
- **Revisit**: together with `fast-xml-parser` when the AWS SDK tightens its range.

### `fast-uri`: `3.1.2`

- **Why**: Defensive single-version pin for a transitive URI parser (pulled via
  the AWS SDK / Ajv chains). Older releases had ReDoS-class issues; exact pin
  forces a single patched version across the tree.
- **Added**: pre-2026.
- **Revisit**: when all consumers declare a range that includes `3.1.2` or later.

### `handlebars`: `4.7.10`

- **Why**: Defensive against older versions with prototype-pollution CVEs
  (CVE-2019-19919 family). Exact pin. Bumped from `4.7.9` 2026-11-12: 4.7.9
  itself is vulnerable to JS injection (Dependabot alerts #239, #240, #242).
- **Added**: pre-2026

### `lodash`: `4.18.1`

- **Why**: Defensive against the prototype-pollution and ReDoS CVE history
  in older lodash releases. Exact pin.
- **Added**: pre-2026

### `defu`: `6.1.6`

- **Why**: Prototype-pollution fix (GHSA-4pf7-mxf2-jhh7). Exact pin.
- **Added**: pre-2026

### `picomatch`: `4.0.4`

- **Why**: ReDoS fix. Exact pin.
- **Added**: pre-2026

### `path-to-regexp`: `8.4.2`

- **Why**: ReDoS fix (CVE-2024-45296). Exact pin.
- **Added**: pre-2026

### `brace-expansion`: `2.1.7`

- **Why**: ReDoS fix in shell-style brace expansion. Exact pin. Bumped from
  `2.0.2` 2026-11-12: the 2.0.x line has six DoS advisories fixed across
  2.0.3–2.1.7 (Dependabot alerts #74, #185, #197, #199, #268–#270).
- **Added**: pre-2026

### `smol-toml`: `1.6.1`

- **Why**: DoS fix on malformed TOML input. Exact pin.
- **Added**: pre-2026

### `yaml`: `2.8.3`

- **Why**: Prototype-pollution and DoS fixes; complements the `js-yaml`
  override to cover the modern `yaml` package family. Exact pin.
- **Added**: pre-2026

### `@tanstack/router-core>seroval-plugins`: `1.7.7`

- **Why**: Scoped pin to keep the `seroval-plugins` that router-core uses
  compatible with the root `seroval` 1.7.2 pin. A lockfile refresh let it
  resolve to `seroval-plugins` 1.8.0, which imports `seroval/shared` (a path
  only seroval ^1.8.0 exports). That broke `vite build` with `"./shared" is
  not exported ... from package seroval`. Scoped to router-core so other
  consumers (solid-js → 1.5.6) are untouched.
- **Added**: 2026-11-12 (PR #390).
- **Revisit**: lift together with the `seroval` pin once seroval 1.8.x and
  seroval-plugins 1.8.x are both past the 7-day quarantine.

### `eslint-plugin-react-hooks>@babel/core`: `7.29.7`

- **Why**: Dependabot alert #156 (arbitrary file read via `sourceMappingURL`,
  fixed in 7.29.6). eslint-plugin-react-hooks 6.1.1 resolved `@babel/core`
  7.28.5; its declared range is `^7.24.4`, so 7.29.7 is in-range. Scoped to
  this one consumer because an unscoped `@babel/core` refresh previously broke
  the TanStack Router code-split build (`Export 'SplitNotFoundComponent' is
  not defined`). Dev-only (lint).
- **Added**: 2026-11-12.
- **Revisit**: drop when eslint-plugin-react-hooks is upgraded and resolves a
  patched `@babel/core` on its own.

### `@tailwindcss/typography>postcss-selector-parser`: `6.1.5`

- **Why**: Dependabot alert #300 (quadratic-complexity selector parsing, fixed
  in 6.1.5). `@tailwindcss/typography` pins `postcss-selector-parser` to
  exactly `6.0.10`, even in its latest release (0.5.20), so it can only be
  forced via override. 6.1.x is semver-compatible with 6.0.x. Build-time only.
- **Added**: 2026-11-12.
- **Revisit**: drop when `@tailwindcss/typography` ships with a patched
  `postcss-selector-parser`.

## Removed overrides (kept for historical context)

### `glob`: `^10.5.0` — removed 2026-05-23

- **Why removed**: dead override. Nothing in the resolved tree pulls `glob@10`
  (`pnpm-lock.yaml` has no `glob@10` entry), so the defensive pin had no effect
  on the install graph — the same situation that retired the `rollup` override.
  It was also a caret range flagged by the 2026-05-23 audit (SCS-03). Removed
  rather than pinned exact, since pinning a version nothing resolves to is noise.
- **Revisit**: if a future dependency reintroduces `glob@10` with deprecation
  warnings, add a fresh exact pin then.

### `rollup`: `>=4.59.0` — removed 2026-05-18

- **Why removed**: nothing in the resolved tree pulls rollup transitively
  (`node_modules/.pnpm` contains no `rollup@*` directory, the lockfile has
  no resolved entry). The defensive override had no effect on the install
  graph and was flagged by the 2026-05-18 audit as an open-ended range. If
  rollup is reintroduced (e.g. via a Vite plugin upgrade), pin a specific
  version then with a fresh entry in this file.

### `@tanstack/router-core` direct manipulation — never present

- Not an override per se; tracked here so future readers don't try to add
  one in response to CVE-2026-45321. The supply-chain fix for that CVE was
  package bumps (commit ada09252), not an override, because the malicious
  versions are well-defined and a forward pin via `package.json` ranges is
  sufficient.
