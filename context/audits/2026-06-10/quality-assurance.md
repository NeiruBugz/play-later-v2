# Quality Assurance — Audit Results

**Date:** 2026-06-10
**Score:** 83% — Grade **B**

## Results

| #     | Check                          | Severity | Status | Evidence                                                                                                                                                                          |
| ----- | ------------------------------ | -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-01 | Test infra + adequate coverage | critical | PASS   | 213 test files (160 in `src/`, 51 in `test/integration/`) over 332 logic modules; module-linkage ratio ~52%, but CI-enforced v8 `statements: 85` gate on `src/{entities,features}` (`vitest.config.ts` L55) confirms real coverage >=60% on core layers. |
| QA-02 | Unit tier present              | high     | PASS   | `unit` project (jsdom, mocked Prisma) in `vitest.config.ts` L67-89; 10 `*.unit.test.ts` files + 160 co-located `src/**/*.test.{ts,tsx}`; `test/setup/unit.ts` mocks `db.server`. |
| QA-03 | Integration tier present       | high     | PASS   | `integration` project (node, real PostgreSQL :6432, `pool: forks`, `maxWorkers: 1`) L91-107; 51 files in `test/integration/*.integration.test.ts` using `setupIsolatedDatabase`. |
| QA-04 | E2E tier present               | high     | FAIL   | No `playwright.config.*` / `cypress.config.*` / `wdio.config.*`; no `e2e/` or `cypress/` dir; no `*.e2e.test.*` files anywhere in repo. App has a UI entry point, so not skippable. |
| QA-05 | Pyramid shape — no inversion   | medium   | PASS   | 2 tiers passed (unit + integration). unit (~160) >= integration (51); no E2E tier. unit_count >= integration_count >= e2e_count holds.                                          |
| QA-06 | Coverage reporting configured  | low      | PASS   | `vitest.config.ts` L29-61: v8 provider, scoped `include`, `reporter: [text-summary, json-summary, html]`, enforced `thresholds` (statements 85 / branches 86 / lines 83 / functions 79). |
| QA-07 | Test data management           | low      | PASS   | Shared harness `test/setup/isolated-db.ts` (`setupIsolatedDatabase`) + per-file builder fns (`makeUser`, `makeGame`) referenced across `test/integration/*` (46 files use prisma builders). No factory/faker lib, but structured builders present and used. |
| QA-08 | Test isolation — mocking       | medium   | PASS   | `vi.mock` in 93 test files; `vi.fn`/`mockResolvedValue`/`spyOn` in 117; `test/setup/unit.ts` mocks `@/shared/lib/db.server` Prisma singleton. Vitest built-in mocking (no msw/sinon needed). |
| QA-09 | Contract testing               | high     | SKIP   | Topology: single web-app service, no inter-service contracts. Skip-When met.                                                                                                    |
| QA-10 | ML model iteration testing     | high     | SKIP   | Topology: no ML frameworks (`sklearn`/`torch`/`tensorflow`/`xgboost`/`transformers`) in source. Skip-When met.                                                                  |

## Score Math

Non-skip checks and severity weights:

| Check | Severity | Weight | Status | Deduction |
| ----- | -------- | ------ | ------ | --------- |
| QA-01 | critical | 3.0    | PASS   | 0         |
| QA-02 | high     | 2.0    | PASS   | 0         |
| QA-03 | high     | 2.0    | PASS   | 0         |
| QA-04 | high     | 2.0    | FAIL   | 2.0       |
| QA-05 | medium   | 1.0    | PASS   | 0         |
| QA-06 | low      | 0.5    | PASS   | 0         |
| QA-07 | low      | 0.5    | PASS   | 0         |
| QA-08 | medium   | 1.0    | PASS   | 0         |

- max_points = 3 + 2 + 2 + 2 + 1 + 0.5 + 0.5 + 1 = **12.0**
- deductions = 2.0 (QA-04 high FAIL)
- raw_score = 12.0 − 2.0 = 10.0
- pct = 10.0 / 12.0 × 100 = **83.3% → 83%**
- Grade: **B** (75–89)

## Summary

Strong two-tier testing setup: a jsdom `unit` project with a mocked Prisma singleton (160 co-located component/logic tests, `vi.mock` in 93 files) and a `node` `integration` project running against real PostgreSQL with per-test isolated databases (51 tests). Coverage is rigorously configured in `vitest.config.ts` with an enforced 85% statement gate on the core FSD layers. Test data uses a shared `setupIsolatedDatabase` harness plus local builder functions. The single gap is the absence of any E2E tier (QA-04 FAIL) — no Playwright/Cypress config or flows exist, the only deduction. QA-09 (contract) and QA-10 (ML) skip per topology.

**P1 (high FAIL):** QA-04 — add an E2E tier (e.g. Playwright) covering at least the auth → add-game → library happy path.
