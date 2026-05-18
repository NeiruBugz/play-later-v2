# Supply Chain Security — Audit Results

**Date:** 2026-05-12
**Score:** 56% — Grade **D**

## Results

| #   | Check | Severity | Status | Evidence |
| --- | ----- | -------- | ------ | -------- |
| 1   | SCS-01 Lockfiles committed to VCS | critical | PASS | Single `pnpm-lock.yaml` at repo root (pnpm workspace covers `savepoint-app` + `savepoint-tanstack`); `git ls-files --error-unmatch pnpm-lock.yaml savepoint-app/package.json savepoint-tanstack/package.json` exits 0 for all |
| 2   | SCS-02 Lockfiles contain integrity hashes | high | PASS | `pnpm-lock.yaml` has 1332 `integrity:` entries matching 1332 `resolution:` entries (1:1); sampled `sha512-...` hashes present on every resolved registry entry |
| 3   | SCS-03 No permissive version ranges in manifests | high | WARN | Mostly exact pins, but 4 caret ranges in `savepoint-app/package.json` (`@radix-ui/react-dropdown-menu ^2.1.16`, `@radix-ui/react-separator ^1.1.8`, `@radix-ui/react-switch ^1.2.6`, `bottleneck ^2.19.5`) and 1 in root (`@commitlint/config-conventional ^20.2.0`); violates project rule "pin exact npm versions" (memory note); lockfile committed so re-resolution risk is partial |
| 4   | SCS-04 No recently published versions (quarantine) | critical | PASS | Sampled 21 direct deps via `registry.npmjs.org`; oldest hit `@tanstack/react-start@1.167.62` published 2026-05-03 (9 days before 2026-05-12); all sampled versions published >= 9 days ago, outside the 7-day quarantine window |
| 5   | SCS-05 Dependency review process enforces approval | high | WARN | `.github/dependabot.yml` exists (npm `/savepoint-app` weekly, terraform `/infra` weekly — note: `/savepoint-tanstack` NOT covered); no auto-merge workflow detected (grep for `automerge`/`auto-approve`/`gh pr merge` in `.github/workflows/*.yml` empty); no `CODEOWNERS` file at repo root, `.github/CODEOWNERS`, or `docs/`; branch protection rules not verifiable from repo files |
| 6   | SCS-06 Vulnerability scanning in CI | critical | FAIL | Grepped all 5 workflows (`pr-checks.yml`, `pr-checks-tanstack.yml`, `deploy.yml`, `e2e.yml`, `integration.yml`) for `audit\|snyk\|trivy\|dependency-review\|govulncheck\|socket\|grype` — zero matches; no `pnpm audit`, no `actions/dependency-review-action`, no third-party scanner anywhere in CI |
| 7   | SCS-07 Dependency overrides reviewed and justified | high | FAIL | Root `package.json` has 14 `pnpm.overrides` entries; 2 use open-ended `>=` ranges (`rollup: ">=4.59.0"`, `fast-xml-parser: ">=5.3.8"`) — explicit FAIL per spec ("overrides use permissive ranges"); 6 use `^` ranges (`hono`, `valibot`, `glob`, `js-yaml`, `rollup`-covered above, `fast-xml-parser`-covered); JSON manifest has no comments and no adjacent `overrides.md`/`DEPENDENCY_DECISIONS.md`/ADR documenting justification; count (14) also exceeds 10-package WARN threshold; savepoint-app `overrides` (2 entries) are exact and acceptable |
| 8   | SCS-08 Dependency count and attack surface | medium | FAIL | Lockfile contains 2321 unique package entries (counted via `grep -cE "^  '?[@a-zA-Z0-9_./-]+'?@.+:$" pnpm-lock.yaml`); ~164 direct deps across 3 manifests (~102 savepoint-app + ~61 savepoint-tanstack + 1 root); ratio ~14:1 within healthy <15:1, but total 2321 exceeds JS FAIL threshold of 1000 (2.3x); driven by dual JS packages duplicating ESLint/Vitest/React/Prisma/Radix/TanStack toolchains during the migration window |

## Supply Chain Summary

- **Ecosystem:** Single — npm via pnpm 10.11.0 workspace (`pnpm-workspace.yaml` declares `savepoint-app`, `savepoint-tanstack`); no Python/Go/Rust/Ruby/PHP/.NET/Elixir/Dart manifests detected; HCL/Terraform in `infra/` has no lockfile but is out of scope for npm-style checks
- **Lockfile:** `pnpm-lock.yaml` at repo root (565 KB, last modified 2026-05-07); 1332 resolved packages with integrity SHA-512 hashes; 2321 total unique package entries including peer/optional variants
- **Manifests:** 3 `package.json` files (`/package.json`, `/savepoint-app/package.json`, `/savepoint-tanstack/package.json`); ~164 direct dependencies in aggregate
- **Dependency update automation:** Dependabot (npm `/savepoint-app` weekly, terraform `/infra` weekly); `/savepoint-tanstack` not configured for Dependabot
- **Vulnerability scanning:** None detected in any CI workflow
- **Override mechanisms:** 14 `pnpm.overrides` at root (2 with `>=` open-ended, 6 with `^`, 6 exact); 2 npm-level `overrides` in `savepoint-app/package.json` (both exact: `@types/react`, `@types/react-dom`)
- **CODEOWNERS:** Not present
- **Branch protection:** Cannot be verified from repository files (configured in GitHub UI)
- **Score breakdown:** max_points=18, deductions=8 (FAIL: SCS-06 −3, SCS-07 −2, SCS-08 −1; WARN: SCS-03 −1, SCS-05 −1); raw=10; pct=55.6% → D

## Priority Findings

- **P0 (critical FAIL):** SCS-06 — add `pnpm audit --audit-level=high` (or `actions/dependency-review-action` for PR-level review, or Snyk/Trivy) as a blocking step in `pr-checks.yml` and `pr-checks-tanstack.yml`
- **P1 (high FAIL):** SCS-07 — replace `>=` ranges in root `pnpm.overrides` (`rollup`, `fast-xml-parser`) with exact pins; document justification (CVE refs) in `context/security/dependency-overrides.md` or similar (JSON cannot carry inline comments)
- **P2 (medium FAIL):** SCS-08 — transitive count is inflated by dual-app migration; will naturally decrease at Slice 20 cutover when `savepoint-app/` is removed per spec 021
- **P1 (critical WARN — none here):** n/a
- **P2 (high WARN):** SCS-03 — convert remaining `^` ranges to exact pins per project policy; SCS-05 — add `.github/CODEOWNERS` covering `pnpm-lock.yaml`, all `package.json`, `prisma/schema.prisma`, and `.github/dependabot.yml`; extend Dependabot config to also cover `/savepoint-tanstack` directory
