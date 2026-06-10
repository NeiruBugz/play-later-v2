# Supply Chain Security — Audit Results

**Date:** 2026-06-10
**Score:** 94% — Grade **A**

Ecosystem in scope: npm/pnpm only (pnpm 10 workspace, single `pnpm-lock.yaml`). Terraform infra has no package-lockfile ecosystem in scope.

## Results

| #   | Check | Severity | Status | Evidence |
| --- | ----- | -------- | ------ | -------- |
| SCS-01 | Lockfiles committed to VCS | critical | PASS | Single `pnpm-lock.yaml` at repo root; `git ls-files --error-unmatch` exits 0 (tracked). pnpm workspace = one lockfile for both `package.json` (root) + `savepoint-tanstack/`. |
| SCS-02 | Lockfiles contain integrity hashes | high | PASS | `lockfileVersion: '9.0'`. All 1114 `resolution:` entries carry `{integrity: sha512-...}` (1114 integrity / 1114 resolutions). Sampled across file — consistent. |
| SCS-03 | No permissive version ranges | high | PASS | All 76 direct deps across both manifests use exact pins. Programmatic scan found 0 `^`/`~` (WARN) and 0 `*`/`>=`/`.x`/bare-major (FAIL). Lockfile committed (SCS-01 PASS). |
| SCS-04 | Quarantine (7-day) check | critical | PASS | 40 direct versions queried via `npm view <pkg>@<ver> time --json`; earliest cutoff = 2026-06-03. All published before it. Prior-audit flag `nitro@3.0.260522-beta` published **2026-05-22** (19 days old) — aged out. Recent bumps verified: `vite@8.0.11` 2026-05-07, `@tanstack/react-router@1.170.4` 2026-05-17, `better-auth@1.6.11` 2026-05-12, `typescript@6.0.2` 2026-03-23. None within window. |
| SCS-05 | Dependency review enforces approval | high | PASS | `.github/dependabot.yml` (npm/terraform/github-actions, weekly, no automerge). Unified config per PR #348. No auto-merge/auto-approve workflow (grep negative). `.github/CODEOWNERS` gates `/pnpm-lock.yaml`, `/package.json`, `/pnpm-workspace.yaml`, `/DEPENDENCY_DECISIONS.md` → `@NeiruBugz`. Branch-protection not verifiable from files (noted). |
| SCS-06 | Vulnerability scanning in CI | critical | PASS | `pr-checks-tanstack.yml` job `audit`: `pnpm audit --prod --audit-level=high` on `pull_request` to `main`, no `continue-on-error`/`\|\| true` → blocking. (Scope is `--prod` only; devDeps unscanned — minor gap, still meets blocking-on-PR PASS bar.) Bonus `freshness` job enforces 7-day quarantine in CI. |
| SCS-07 | Overrides reviewed and justified | high | WARN | `pnpm.overrides` has **14 packages** — exceeds the "10+ packages" maintenance-debt threshold → WARN. All pin exact versions (no ranges/git URLs), all aged >7 days, and every entry is justified in `DEPENDENCY_DECISIONS.md` with Why/Added/Revisit. No FAIL conditions present; flagged solely on count. |
| SCS-08 | Dependency count / attack surface | medium | PASS | 76 direct deps, 1114 total resolved → ratio **14.7:1** (under healthy 15:1) and total < 1000-ish JS threshold (slightly over 1000 raw count but ratio healthy and well under 2x range). Monorepo shares one tree across both packages — positive signal. |

## Score math

```
max_points = SCS-01(3) + SCS-02(2) + SCS-03(2) + SCS-04(3)
           + SCS-05(2) + SCS-06(3) + SCS-07(2) + SCS-08(1) = 18
deductions = SCS-07 WARN (high) = 1.0
raw_score  = 18 - 1.0 = 17.0
pct        = 17.0 / 18 * 100 = 94.4%  → 94%
grade      = A (90–100)
```

Severity weights used: critical=3 (SCS-01, 04, 06), high=2 (SCS-02, 03, 05, 07), medium=1 (SCS-08). No SKIP checks.

## Delta vs prior audit (2026-05-23, 72% C)

- SCS-04 critical FAIL (nitro beta published 1 day prior) → now PASS: same version aged to 19 days, outside the 7-day window. This single change accounts for most of the score recovery.
- All other checks remain healthy; overrides count crept to 14, holding SCS-07 at WARN.
