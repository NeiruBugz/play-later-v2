# Supply Chain Security — Audit Results

**Date:** 2026-05-23
**Score:** 72% — Grade **C**

## Results

| # | Check | Severity | Status | Evidence |
| --- | --- | --- | --- | --- |
| SCS-01 | Lockfiles committed to git | critical | PASS | Single `pnpm-lock.yaml` at repo root, `git ls-files --error-unmatch` → tracked. pnpm workspace shares one root lock; `savepoint-tanstack/` correctly has no own lockfile (workspace member). No npm/yarn locks. |
| SCS-02 | Lockfiles contain integrity hashes | high | PASS | `pnpm-lock.yaml` (lockfileVersion 9.0): 1110 `resolution:` entries, 1110 `integrity:` entries (1:1). Zero non-registry refs (`directory`/`tarball`/`git`) and zero resolutions lacking integrity. |
| SCS-03 | No permissive version ranges | high | WARN | No unbounded (`*`/bare/`>=`-without-upper) ranges. All 75 direct app deps in `savepoint-tanstack/package.json` are exact-pinned. Carets remain on root devDep `@commitlint/config-conventional ^20.2.0` and 3 overrides (`valibot ^1.2.0`, `glob ^10.5.0`, `js-yaml ^4.1.1`). User prefers exact pinning. |
| SCS-04 | Quarantine — no versions <7 days old | critical | FAIL | `nitro@3.0.260522-beta` published 2026-05-22 (~1 day ago), inside 7-day window, NOT in `scripts/package-freshness-allowlist.json`. (TanStack `react-start@1.168.6`/`react-router@1.170.4`, ~6 days, ARE allowlisted as CVE-2026-45321 risk-reviewed force-bumps, expires 2026-06-15 — legitimate.) Of 22 direct deps sampled, only the unwaived `nitro` beta violates. |
| SCS-05 | Dependency review enforces approval | high | PASS | `.github/dependabot.yml`: weekly schedule for npm (root + savepoint-tanstack), terraform, github-actions; no `automerge`/auto-approve configured (off by default = safe). `.github/CODEOWNERS` explicitly covers `/pnpm-lock.yaml`, `/package.json`, `/pnpm-workspace.yaml`, `/DEPENDENCY_DECISIONS.md` → `@NeiruBugz`. |
| SCS-06 | Vuln scanning in CI | critical | PASS | `pr-checks-tanstack.yml` `audit` job runs `pnpm audit --prod --audit-level=high` on PRs to main — blocking (non-zero exit fails PR). Separate `freshness` job runs `check-package-freshness.mjs` (7-day quarantine gate, also blocking). Resolves the prior audit's "no vuln scanning" gap. |
| SCS-07 | Dependency overrides reviewed | high | PASS | 14 entries in root `pnpm.overrides`, all documented in `DEPENDENCY_DECISIONS.md` with Why/Added/Revisit; mostly exact pins, CVE/ReDoS/prototype-pollution driven; removed `rollup` override logged. Minor doc drift (file says `hono ^4.12.2`/`fast-xml-parser 5.4.1`; manifest now `hono 4.12.18`/`fast-xml-parser 5.7.3`) — exact, not permissive/git-url/recent. |
| SCS-08 | Dependency count / attack surface | medium | FAIL | 76 direct deps (root 1 + savepoint-tanstack 46 deps + 29 devDeps). 1110 resolved registry tarballs in lockfile. Ratio ~14.6:1 (healthy <15:1) but total 1110 exceeds the >1000 flag threshold. |

## Scoring Detail

- Weights: critical=3, high=2, medium=1. FAIL=full deduction, WARN=half. SKIP excluded.
- Non-skipped max = 3+2+2+3+2+3+2+1 = **18**
- Deductions: SCS-03 WARN (high) = 1.0; SCS-04 FAIL (critical) = 3.0; SCS-08 FAIL (medium) = 1.0 → **5.0**
- pct = (18 − 5) / 18 = **72.2% → Grade C**

## Notes vs Prior Audit (2026-05-18, 72% C)

- **Fixed:** vuln scanning now in CI (`pnpm audit --prod --audit-level=high`, blocking) — was the prior FAIL.
- **Fixed:** 7-day quarantine now CI-enforced via `scripts/check-package-freshness.mjs` with a documented, expiry-bound allowlist for CVE-driven force-bumps.
- **Residual SCS-04 FAIL:** `nitro@3.0.260522-beta` (1 day old, beta, unwaived) sits in the committed lockfile inside quarantine. The CI gate would catch this on a fresh PR diff — its presence implies it entered via a path that bypassed the diff check (e.g. transitive bump or pre-gate commit). Either allowlist it with a risk review or pin a version published >7 days ago.
- The prior TanStack quarantine concern is now resolved: those versions are aged or formally allowlisted as malicious-version remediations.
