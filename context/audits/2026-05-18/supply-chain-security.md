---
dimension: supply-chain-security
date: 2026-05-18
---

# Supply Chain Security — Audit Results

**Date:** 2026-05-18
**Score:** 56% — Grade **D**

## Results

| #   | Check                                              | Severity | Status | Evidence |
| --- | -------------------------------------------------- | -------- | ------ | -------- |
| 1   | SCS-01 Lockfiles committed to version control      | critical | PASS   | Single root `pnpm-lock.yaml` (workspace lockfile, 15343 lines) tracked in git (`git ls-files --error-unmatch` exit 0). No per-package lockfiles expected for pnpm workspace. |
| 2   | SCS-02 Lockfiles contain integrity hashes          | high     | PASS   | `pnpm-lock.yaml` `lockfileVersion: '9.0'`; 1332 `resolution: {integrity: sha512-...}` entries match the 1332 package snapshots — 100% coverage. Sampled lines 543/546/549/552/556 — all carry sha512. |
| 3   | SCS-03 No permissive version ranges in manifests   | high     | WARN   | savepoint-app: 4 caret deps (`@radix-ui/react-dropdown-menu ^2.1.16`, `@radix-ui/react-separator ^1.1.8`, `@radix-ui/react-switch ^1.2.6`, `bottleneck ^2.19.5`); root `package.json` uses `^20.2.0` for `@commitlint/config-conventional`; savepoint-tanstack: 0 ranges (all exact). Lockfile is committed → WARN, not FAIL. No `*`/bare/`>=`-without-bound in dependency manifests themselves (the `>=` cases live in `pnpm.overrides`, covered by SCS-07). |
| 4   | SCS-04 No recently-published versions (quarantine) | critical | PASS   | Sampled 16 direct deps via `registry.npmjs.org/<pkg>/<ver>` (next@16.2.3 2026-04-08, @tanstack/react-router@1.169.1 2026-05-01, @tanstack/react-start@1.167.62 2026-05-03, react@19.2.5 2026-04-08, prisma@7.6.0 2026-03-27, @aws-sdk/client-s3@3.1024.0 2026-04-03, vite@8.0.10 2026-04-23, vitest@4.1.2 2026-03-26, zod@4.1.13 2025-11-24, eslint@9.39.1 2025-11-03, vitest@4.1.5 2026-04-21, jsdom@28.1.0 2026-02-15, react@19.2.0 2025-10-01, vite@8.0.0 2026-03-12, @tanstack/react-router-devtools@1.166.13 2026-04-11, @tanstack/react-devtools@0.10.2 2026-04-07). Oldest-publish-gap = 15 days (2026-05-03 vs today 2026-05-18). All > 7 days. |
| 5   | SCS-05 Dependency review enforces approval         | high     | WARN   | `.github/dependabot.yml` exists (weekly schedule for `/savepoint-app` npm + `/infra` terraform). NOTE: savepoint-tanstack workspace not covered. Dependabot defaults to no auto-merge; no auto-approve/auto-merge workflow detected for dependabot PRs (grep of `.github/workflows/*.yml` for `dependabot.*--auto-merge|auto-approve` returned 0 matches). No `CODEOWNERS` / `.github/CODEOWNERS` file exists → no required-reviewer gate on `package.json` / `pnpm-lock.yaml`. Per check criteria: "automerge disabled but no CODEOWNERS on lockfiles/manifests" → WARN. Branch protection settings cannot be verified from repo files. |
| 6   | SCS-06 Vulnerability scanning in CI                | critical | FAIL   | Grep of `.github/workflows/*.yml` (deploy.yml, e2e.yml, integration.yml, pr-checks-tanstack.yml, pr-checks.yml) for `npm audit\|pnpm audit\|yarn audit\|snyk\|trivy\|dependency-review\|govulncheck\|cargo audit\|grype\|socket\|safety` returned 0 matches. No `actions/dependency-review-action` usage. No `pnpm audit` step. CI runs lint/format/typecheck/tests/migration-validation only. |
| 7   | SCS-07 Dependency overrides reviewed and justified | high     | FAIL   | Root `package.json` `pnpm.overrides` contains 14 entries; savepoint-app `overrides` contains 2 → 16 total. Permissive ranges present: `hono: ^4.12.2`, `valibot: ^1.2.0`, `glob: ^10.5.0`, `js-yaml: ^4.1.1`, `rollup: '>=4.59.0'`, `fast-xml-parser: '>=5.3.8'` — the two `>=` entries trigger FAIL per check criteria ("overrides use permissive ranges (`*`, `>=`)"). All resolved target versions are >7 days old (sampled — see SCS-04 evidence pattern). No adjacent `overrides.md` / `DEPENDENCY_DECISIONS.md` documenting why each override exists; `package.json` cannot carry inline JSON comments. Override count (16) also exceeds the WARN threshold of 10+. |
| 8   | SCS-08 Dependency count and attack surface         | medium   | FAIL   | Direct deps: 168 (savepoint-app 102 + savepoint-tanstack 65 + root 1). Total resolved packages in `pnpm-lock.yaml`: 1332 unique snapshots (counted from `resolution:` entries). Ratio ≈ 7.9:1 (healthy for JS, <15:1). However total transitive count 1332 > 1000 ecosystem-specific FAIL threshold for JS. Inflation partly justified by parallel-app migration (spec 021): savepoint-app + savepoint-tanstack share a single lockfile during the cutover window. Once savepoint-app is retired (Slice 20), the count is expected to drop. |

## Supply Chain Summary

- **Package ecosystem:** npm via pnpm 10.11.0 (workspace, 2 JS packages + root)
- **Lockfile:** `pnpm-lock.yaml` (v9.0) committed, 1332 packages, 100% integrity-hashed
- **Direct dependencies:** 168 (savepoint-app 102, savepoint-tanstack 65, root 1)
- **Total resolved:** 1332 (ratio ~7.9:1)
- **Overrides:** 16 total (14 root pnpm.overrides + 2 savepoint-app overrides); 6 use `^`/`>=` permissive ranges
- **Quarantine:** all sampled versions >7 days old (oldest 15 days)
- **Update automation:** Dependabot weekly for `savepoint-app` (npm) and `infra` (terraform); `savepoint-tanstack` not covered
- **CI vuln scanning:** none
- **CODEOWNERS:** none
- **Score delta vs 2026-05-12 audit:** approximately flat (56% vs prior 56%). Pinning has improved (`savepoint-tanstack` 100% exact), but SCS-06 (no vuln scan), SCS-07 (`>=` ranges in overrides), and SCS-08 (transitive >1000) remain unresolved.
