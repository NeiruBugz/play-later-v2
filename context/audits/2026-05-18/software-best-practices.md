---
dimension: software-best-practices
date: 2026-05-18
---

# Software Best Practices — Audit Results

**Date:** 2026-05-18
**Score:** 100% — Grade **A**

## Results

| #   | Check                                         | Severity | Status | Evidence |
| --- | --------------------------------------------- | -------- | ------ | -------- |
| 1   | SBP-01 Linting is configured and enforced     | high     | PASS   | ESLint flat config in both JS packages (`savepoint-app/eslint.config.mjs`, `savepoint-tanstack/eslint.config.mjs`) with `lint: "eslint . --max-warnings 0"`; enforced in `.github/workflows/pr-checks.yml` and `pr-checks-tanstack.yml`. HCL covered by `terraform fmt -check -recursive infra/` step in `pr-checks.yml`. |
| 2   | SBP-02 Formatting is automated                | medium   | PASS   | Prettier configs in both packages (`prettier.config.mjs`); `format` / `format:check` scripts; `lint-staged` configured in `savepoint-app/package.json`; `format-check` job runs every PR in `pr-checks.yml`. |
| 3   | SBP-03 Type safety is enforced                | high     | PASS   | `strict: true` + `strictNullChecks: true` in both `savepoint-app/tsconfig.json` and `savepoint-tanstack/tsconfig.json`; tanstack adds `noImplicitOverride: true`. CI `typecheck` jobs gate PRs. |
| 4   | SBP-05 CI/CD pipeline exists                  | high     | PASS   | 5 workflows under `.github/workflows/`: `pr-checks.yml` (format, lint, typecheck, components/backend/utilities tests, migration validation, terraform fmt), `pr-checks-tanstack.yml`, `e2e.yml`, `integration.yml`, `deploy.yml`. |
| 5   | SBP-06 Error handling patterns are consistent | high     | PASS   | Sampled 5 catch blocks: `features/dashboard/ui/up-next.tsx:56` log+rethrow; `data-access-layer/services/igdb/igdb-service.ts:86,153,180,232` log + typed `mapIgdbTransportError`; `features/steam-import/use-cases/import-game-to-library.ts:64,135,217` log + classified retryable errors; `features/auth/server-actions/sign-in.ts:41` typed `APIError` branch + log; `savepoint-tanstack/.../delete-library-item.server.ts:54` typed Prisma `P2025` branch. All use pino logger; no empty catches; DAL design (`data-access-layer/CLAUDE.md`) mandates typed-throw + single-edge log via `mapErrorToHandlerResult`. |
| 6   | SBP-07 Dependencies are managed               | medium   | PASS   | `pnpm-lock.yaml` (root, pnpm 10 workspace); `.github/dependabot.yml` covers npm (`/`, `/savepoint-app`, `/savepoint-tanstack`), terraform (`/infra`), and github-actions — all weekly. Root `pnpm.overrides` pin transitive deps for security. |

## Dimension Summary

- **Tooling stack:** ESLint + Prettier + TypeScript strict + commitlint conventional + Vitest + Playwright + `terraform fmt`, all wired into GitHub Actions PR checks.
- **Strengths:** Uniform strict TS across both web apps; comprehensive CI matrix (format/lint/type/3 test suites/migrations/terraform fmt); typed-throw DAL error model with single-edge logging policy; Dependabot enabled for all five ecosystems (root npm, both app npm, terraform, github-actions); centralized pnpm overrides.
- **Gaps:** No `.husky/` directory at repo root — pre-commit enforcement relies on CI only (lint-staged is wired in `savepoint-app` but no installed hook script). Minor; not check-blocking since CI gates are mandatory PR checks.

## Scoring

- Max points: 10 (high=2 ×4 + medium=1 ×2)
- Deductions: none
- Raw: 10.0 / 10 = **100%** → Grade **A**
