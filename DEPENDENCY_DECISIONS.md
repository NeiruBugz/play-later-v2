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

### `hono`: `^4.12.2`

- **Why**: Transitive dep pulled in by Auth.js / NextAuth providers. The
  caret range was inherited from when the override was first added; intent is
  "stay current on the 4.x line". Caret is broader than our project rule
  prefers (exact pins) — flagged for cleanup.
- **Added**: pre-2026
- **Revisit**: when bumping NextAuth/Auth.js, drop the override and re-test.

### `valibot`: `^1.2.0`

- **Why**: Transitive pin to keep a single major version across the workspace
  (originally added during the spec-021 parallel-app migration to stop the two
  apps resolving different valibot trees). The migration is complete and
  `savepoint-app/` is gone; the override is now just a defensive single-version
  pin for the remaining transitive consumers.
- **Added**: spec 021 era
- **Revisit**: drop if no transitive consumer pulls valibot after a dependency
  sweep, or pin exactly if a primary consumer settles on a fixed version.

### `glob`: `^10.5.0`

- **Why**: Defensive — older `glob` versions surface deprecation warnings on
  every install. Forces a single modern version.
- **Added**: pre-2026
- **Revisit**: when all direct consumers declare `>=10`.

### `js-yaml`: `^4.1.1`

- **Why**: CVE-driven (CVE-2019-10744 / CVE-2024-37890 family). Old YAML
  parsers still appear in transitive trees via legacy build tooling; pin
  forces them onto a patched line.
- **Added**: pre-2026
- **Revisit**: only if upstream consumers move to a hard `^5` pin.

### `fast-xml-parser`: `5.4.1`

- **Why**: Pinned exactly (per project rule `feedback_pin_exact_versions`) to
  the version that the AWS SDK currently resolves. Earlier versions had RCE
  CVEs (CVE-2024-41818). Replacing the previous open-ended `>=5.3.8` so future
  installs cannot drift quietly into a version we haven't reviewed.
- **Added**: original CVE remediation pre-2026; tightened 2026-05-18.
- **Revisit**: when the AWS SDK or other primary consumers declare a tighter
  range that includes `5.4.1` or later.

### `handlebars`: `4.7.9`

- **Why**: Defensive against older versions with prototype-pollution CVEs
  (CVE-2019-19919 family). Exact pin.
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

### `brace-expansion`: `2.0.2`

- **Why**: ReDoS fix in shell-style brace expansion. Exact pin.
- **Added**: pre-2026

### `smol-toml`: `1.6.1`

- **Why**: DoS fix on malformed TOML input. Exact pin.
- **Added**: pre-2026

### `yaml`: `2.8.3`

- **Why**: Prototype-pollution and DoS fixes; complements the `js-yaml`
  override to cover the modern `yaml` package family. Exact pin.
- **Added**: pre-2026

## Removed overrides (kept for historical context)

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
