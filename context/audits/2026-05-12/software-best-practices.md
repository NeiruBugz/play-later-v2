# Software Best Practices — Audit Results

**Date:** 2026-05-12
**Score:** 100% — Grade **A**

## Results

| #   | Check                                         | Severity | Status | Evidence |
| --- | --------------------------------------------- | -------- | ------ | -------- |
| 1   | SBP-01 Linting is configured and enforced     | high     | PASS   | ESLint configs at `savepoint-app/eslint.config.mjs` + `savepoint-tanstack/eslint.config.mjs`; `lint` scripts (`eslint . --max-warnings 0`) in both package.json; CI job `lint` in `.github/workflows/pr-checks.yml`. Terraform layer has no JS linting (HCL only, not in scope). |
| 2   | SBP-02 Formatting is automated                | medium   | PASS   | Prettier configs `savepoint-app/prettier.config.mjs` + `savepoint-tanstack/prettier.config.mjs`; `.prettierignore` at root; `format:check`/`format:write` scripts in both packages; CI job `format-check` in `pr-checks.yml`; commitlint config at root. No husky/lint-staged wired (CI enforces — acceptable automation). |
| 3   | SBP-03 Type safety is enforced                | high     | PASS   | `strict: true` + `strictNullChecks: true` in `savepoint-app/tsconfig.json`; tanstack adds `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `noUncheckedSideEffectImports`, `verbatimModuleSyntax`. Zero `: any` annotations across `features/`, `data-access-layer/`, `shared/`, `tanstack/src/`. CI `typecheck` job enforced. |
| 4   | SBP-05 CI/CD pipeline exists                  | high     | PASS   | `.github/workflows/`: `pr-checks.yml` (format, lint, typecheck, components/backend/utilities tests, migration validation), `pr-checks-tanstack.yml`, `e2e.yml`, `integration.yml`, `deploy.yml`. Includes build, test, and quality gate stages. |
| 5   | SBP-06 Error handling patterns are consistent | high     | PASS   | Sampled 10+ catch blocks in `igdb-service.ts`, `steam-service.ts`, `igdb-matcher.ts`, `tanstack/src/entities/library-item/api/delete-library-item.server.ts`, `update-profile.server.ts`, `igdb/token.ts`: all log via `logger.error({ error, ...ctx }, ...)` and either re-throw, map to typed domain error (`NotFoundError`, `mapIgdbTransportError`), or wrap in `Error`. No empty catch blocks found. |
| 6   | SBP-07 Dependencies are managed               | medium   | PASS   | `pnpm-lock.yaml` at root (pnpm 10.11.0 workspace). `.github/dependabot.yml` configures weekly npm updates for `/savepoint-app` and weekly terraform updates for `/infra`. Root `pnpm.overrides` pin specific transitive versions. Note: `savepoint-tanstack/` not in dependabot config (minor gap, not failing — single lockfile covers it). |

## Score Calculation

- Max points: 2 (SBP-01) + 1 (SBP-02) + 2 (SBP-03) + 2 (SBP-05) + 2 (SBP-06) + 1 (SBP-07) = **10**
- Deductions: **0**
- Raw: 10 / 10 = **100%** → Grade **A**

## Delta vs prior audit

- Prior note: "husky pre-commit hook not wired to lint-staged" — confirmed still absent (no `.husky/` directory present). Not a regression and not a check failure: CI gates (`format-check`, `lint`, `typecheck`) enforce the same constraints on every PR, so SBP-02 remains PASS. Optional improvement (P2): add `husky` + `lint-staged` for faster local feedback.

## Software-Best-Practices Summary

- **Linting:** ESLint flat config in both JS packages, zero-warning policy, CI-enforced.
- **Formatting:** Prettier in both JS packages, CI-enforced via `format:check`.
- **Type safety:** TS strict mode in both packages; tanstack adds extra strictness flags; no `: any` in app source.
- **CI/CD:** 5 GitHub Actions workflows covering format, lint, typecheck, unit/integration/e2e tests, migrations, deploy.
- **Error handling:** Structured logging + typed domain errors + re-throw across DAL services and tanstack server functions.
- **Dependency hygiene:** pnpm workspace lockfile + Dependabot for npm + terraform; only minor gap is tanstack package not explicitly listed in dependabot directories.
- **Local pre-commit automation:** Absent (no husky); CI is the enforcement layer.
