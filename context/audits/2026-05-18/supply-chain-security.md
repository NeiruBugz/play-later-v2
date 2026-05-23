# Supply Chain Security — Audit Results

**Date:** 2026-05-18
**Score:** 72% — Grade **C**

## Results

| #   | Check | Severity | Status | Evidence |
| --- | ----- | -------- | ------ | -------- |
| 1   | Lockfiles committed to version control | critical | PASS | Single `pnpm-lock.yaml` at repo root (pnpm workspace covers both `savepoint-app/` and `savepoint-tanstack/`); tracked in git (`git ls-files --error-unmatch pnpm-lock.yaml` ok). No competing `package-lock.json`/`yarn.lock`/`bun.lockb`. Terraform: `.terraform.lock.hcl` tracked in `infra/envs/dev/` + `infra/envs/prod/`. |
| 2   | Lockfiles contain integrity hashes | high | PASS | `pnpm-lock.yaml` `lockfileVersion: '9.0'`; 1338 `integrity: sha512-…` entries matching 1338 `resolution:` entries (1:1). Spot-checked entries all carry sha512. Terraform `.terraform.lock.hcl` carries `h1:` provider hashes (verified in dev + prod). |
| 3   | No permissive version ranges in dependency manifests | high | WARN | 7 caret ranges total, no `*` / `>=` / bare names. Root `package.json`: `@commitlint/config-conventional: ^20.2.0` + 3 caret overrides (`valibot ^1.2.0`, `glob ^10.5.0`, `js-yaml ^4.1.1`). `savepoint-app/package.json`: 4 caret deps (`@radix-ui/react-dropdown-menu ^2.1.16`, `@radix-ui/react-separator ^1.1.8`, `@radix-ui/react-switch ^1.2.6`, `bottleneck ^2.19.5`). `savepoint-tanstack/package.json`: 0 caret/tilde — fully exact-pinned. Lockfile is committed so risk is bounded to re-resolution on `pnpm add`/`update`. |
| 4   | No recently published dependency versions (quarantine) | critical | FAIL | 4 sampled direct deps in `savepoint-tanstack/package.json` published within last 7 days (today 2026-05-18): `@tanstack/react-router@1.170.4` (2026-05-17, ~1 day), `@tanstack/react-start@1.168.6` (2026-05-17, ~1 day), `@tanstack/react-router-devtools@1.167.0` (2026-05-15, ~3 days), `@tanstack/react-router-ssr-query@1.167.0` (2026-05-15, ~3 days). No quarantine policy in Renovate/Dependabot config. |
| 5   | Dependency review process enforces approval | high | PASS | `.github/dependabot.yml` configured for npm × 3 dirs + terraform + github-actions, weekly, no auto-merge directive. No Renovate config. No GitHub Actions workflow auto-approves or merges Dependabot PRs (`rg 'auto-merge\|--auto\|auto-approve\|gh pr merge' .github/workflows/` → no matches). `.github/CODEOWNERS` covers `/pnpm-lock.yaml`, `/package.json`, `/pnpm-workspace.yaml`, `/DEPENDENCY_DECISIONS.md`, `/infra/`, `/.github/`, both Prisma schemas → @NeiruBugz. Note: branch protection rules not inspectable from repo files alone. |
| 6   | Vulnerability scanning in CI | critical | PASS | `.github/workflows/pr-checks.yml` + `.github/workflows/pr-checks-tanstack.yml` each declare a `Supply Chain Audit (pnpm audit)` job running `pnpm audit --prod --audit-level=high` on every PR; no `continue-on-error`/`\|\| true` → blocking. Dev advisories deliberately excluded with a documented rationale comment; relies on Dependabot for dev-tree noise. |
| 7   | Dependency overrides reviewed and justified | high | PASS | 15 overrides under root `pnpm.overrides` (e.g. `hono 4.12.18`, `fast-xml-parser 5.7.3`, `lodash 4.18.1`, `yaml 2.8.3`) — 12 exact-pinned, 3 caret (`valibot`, `glob`, `js-yaml` — flagged under SCS-03). All sampled override versions published >7 days ago (oldest: `brace-expansion 2.0.2` 2025-06-11; newest: `fast-xml-builder 1.2.0` 2026-05-08, 10 days). Adjacent justification doc `DEPENDENCY_DECISIONS.md` exists with per-package rationale, covered by CODEOWNERS. `savepoint-app` carries 2-entry `overrides` block (`@types/react`/`@types/react-dom` parity pins). |
| 8   | Dependency count and attack surface | medium | FAIL | pnpm-lock snapshots section contains ~1427 resolved package entries, exceeding JS ecosystem threshold of 1000 (FAIL trigger). Direct deps: ~164 across workspace (root 1, savepoint-app ~107, savepoint-tanstack ~56). Ratio ~8.7:1 is within healthy range (<15:1) — bloat is from breadth of direct deps (Radix UI primitives, ESLint plugins, AWS SDK, two parallel app trees during spec 021 migration) rather than dependency explosion. |

## Scoring

- max_points = 3 + 2 + 2 + 3 + 2 + 3 + 2 + 1 = **18**
- deductions: SCS-03 WARN(high)=1, SCS-04 FAIL(critical)=3, SCS-08 FAIL(medium)=1 → **5**
- raw = 13 / 18 = **72.2% → Grade C**

## Dimension Notes

- Strongest controls: lockfile hygiene (SCS-01/02), CI vulnerability gating (SCS-06), override governance (SCS-07 + `DEPENDENCY_DECISIONS.md`), CODEOWNERS on supply-chain-critical paths (SCS-05).
- Primary risk: quarantine (SCS-04). The TanStack Start migration (spec 021) is pulling latest `@tanstack/*` releases into `savepoint-tanstack/package.json` within 1–3 days of publish. No Renovate `minimumReleaseAge` or equivalent quarantine gate exists. Recommended: add a 7-day quarantine via Renovate (`minimumReleaseAge: "7 days"`) or a CI gate that fails PRs introducing deps published <7d ago.
- Secondary risk: 7 caret ranges (SCS-03) violate the project's stated exact-pinning rule (`feedback_pin_exact_versions`); 3 of those live inside root `pnpm.overrides`, where caret defeats the override's "pin one version everywhere" intent.
- SCS-08 FAIL is structural to the parallel-app phase; expected to drop sharply at spec-021 cutover (Slice 20) when one of the two apps is retired.
