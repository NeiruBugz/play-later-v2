# Quality Assurance — Audit Results
**Date:** 2026-05-23
**Score:** 81% — Grade **B**

## Results
| # | Check | Severity | Status | Evidence |
| --- | --- | --- | --- | --- |
| QA-01 | Test infra w/ adequate coverage | critical | PASS | 184 test files (136 unit/component under `src`, 48 integration under `test/integration`). v8 coverage gate enforced at 85% statements on `src/{entities,features}` (`vitest.config.ts` thresholds; CI runs `test:coverage` in `pr-checks-tanstack.yml`). Co-located ratio 114/297=38% understates real coverage since integration tests cover server modules out-of-band. |
| QA-02 | Unit tier present | high | PASS | Vitest `unit` project (jsdom, mocked Prisma) in `vitest.config.ts:62-90`. 9 `.unit.test.ts` files (e.g. `src/entities/journal-entry/api/create-journal-entry.unit.test.ts`) + 127 `.test.tsx` component tests importing only local modules + RTL. |
| QA-03 | Integration tier present | high | PASS | Vitest `integration` project (node env, real PG :6432, `pool: forks`, `maxWorkers: 1`) in `vitest.config.ts:91-107`. 48 explicit `*.integration.test.ts` files under `test/integration/` (e.g. `get-library.integration.test.ts`, `follow-user.integration.test.ts`). |
| QA-04 | E2E tier | high | FAIL | No `playwright.config`/`cypress.config`, no `e2e` dirs, no Playwright/Cypress deps in `package.json`. App tier (not a library) — no SKIP. |
| QA-05 | Pyramid shape no inversion | medium | PASS | unit 136 >= integration 48 >= e2e 0. Correct (non-inverted) pyramid. |
| QA-06 | Coverage reporting | low | PASS | `vitest.config.ts:29-61` configures v8 provider, json-summary/html reporters, AND enforced thresholds (statements 85, branches 86, lines 83, functions 79). Run in CI via `test:coverage`. |
| QA-07 | Test data management | low | WARN | No `@faker-js/faker`, `fishery`, or `prisma/seed.*`. Integration tests build data via inline Prisma `create` calls + helpers in `test/setup/`; no shared factory/fixture library. Sparse. |
| QA-08 | Test isolation/mocking | medium | PASS | `vi.mock` used in 81 of 136 `src` test files (e.g. `src/shared/api/igdb/fetch.unit.test.ts` mocks `@env`/`./token`; `game-card.test.tsx` mocks `@tanstack/react-router`). Prisma mocked in unit project. Note: MSW NOT present (topology hint incorrect); isolation via `vi.mock`/`vi.fn`. |
| QA-09 | Contract testing | high | SKIP | Single-service repo (one TanStack Start app + Terraform IaC). No inter-service comm. |
| QA-10 | ML model testing | high | SKIP | No ML layer in the codebase. |

## Scoring
Non-skipped weights: QA-01 crit=3, QA-02 high=2, QA-03 high=2, QA-04 high=2, QA-05 med=1, QA-06 low=0.5, QA-07 low=0.5, QA-08 med=1. **max = 12** (QA-09, QA-10 skipped, excluded).
Deductions: QA-04 FAIL = full 2.0; QA-07 WARN = half 0.25. **Total deductions = 2.25.**
pct = (12 − 2.25) / 12 × 100 = **81.25% → Grade B**.
