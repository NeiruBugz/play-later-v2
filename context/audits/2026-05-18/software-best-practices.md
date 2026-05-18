---
dimension: software-best-practices
date: 2026-05-18
---

# Software Best Practices — Audit Results

**Date:** 2026-05-18
**Score:** 90% — Grade **A**

## Results

| #   | Check                                       | Severity | Status | Evidence |
| --- | ------------------------------------------- | -------- | ------ | -------- |
| 1   | SBP-01 Linting is configured and enforced   | high     | WARN   | ESLint configured for both JS packages (`savepoint-app/eslint.config.mjs`, `savepoint-tanstack/eslint.config.mjs`) with `lint` scripts (`--max-warnings 0`); no Terraform/HCL linter (no `tflint`, no `terraform fmt -check` in CI). |
| 2   | SBP-02 Formatting is automated              | medium   | PASS   | Prettier configs in both packages (`prettier.config.mjs`), `.prettierignore` at root, `format`/`format:check` scripts present, and `format-check` job runs on every PR in `.github/workflows/pr-checks.yml`. |
| 3   | SBP-03 Type safety is enforced              | high     | PASS   | `strict: true` + `strictNullChecks: true` in both `savepoint-app/tsconfig.json` and `savepoint-tanstack/tsconfig.json`; tanstack also sets `noImplicitOverride: true`. CI typecheck job (`pnpm --filter savepoint typecheck`). |
| 4   | SBP-05 CI/CD pipeline exists                | high     | PASS   | `.github/workflows/` contains 5 workflows: `pr-checks.yml` (format, lint, typecheck, components/backend/utilities tests, migration validation), `pr-checks-tanstack.yml`, `e2e.yml`, `integration.yml`, `deploy.yml`. |
| 5   | SBP-06 Error handling patterns are consistent | high   | PASS   | 5 sampled catches all log/translate/rethrow: `igdb-service.ts:86` logs+rethrows via pino, `user-repository.ts:43` and `imported-game-repository.ts:238` translate Prisma `P2025` → `NotFoundError`, `import-game-to-library.ts:64` structured-logs, `igdb-manual-search.tsx:86` sets UI error state. DAL design (`data-access-layer/CLAUDE.md`) mandates typed-throw model with edge handlers via `mapErrorToHandlerResult`; no empty catch blocks observed. |
| 6   | SBP-07 Dependencies are managed             | medium   | PASS   | `pnpm-lock.yaml` (553 KB) at repo root; `.github/dependabot.yml` configures weekly updates for `npm` (`/savepoint-app`) and `terraform` (`/infra`). Root `package.json` pins exact pnpm overrides for security. Note: no Dependabot entry for `/savepoint-tanstack`. |

## Dimension Summary

- **Tooling stack:** ESLint + Prettier + TypeScript strict + commitlint conventional + Vitest, all wired into GitHub Actions PR checks.
- **Strengths:** Uniform strict TS across both web apps, comprehensive CI matrix (format/lint/type/3 test suites/migrations), well-documented typed-throw DAL error model with single-edge logging policy, Dependabot enabled for npm + terraform.
- **Gaps:** (a) No HCL/Terraform linter or `terraform fmt -check` in CI (only npm side is linted); (b) Husky directory absent at repo root — formatting/lint depend entirely on CI rather than local pre-commit hooks; (c) Dependabot omits `savepoint-tanstack/` package.

## Scoring

- Max points: 10 (high=2 ×4 + medium=1 ×2)
- Deductions: SBP-01 WARN (high) = 1.0
- Raw: 9.0 / 10 = **90%** → Grade **A**
