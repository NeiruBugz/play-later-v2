# Quality Assurance — Audit Results

**Date:** 2026-05-18
**Score:** 85% — Grade **B**

## Results

| #   | Check | Severity | Status | Evidence |
| --- | ----- | -------- | ------ | -------- |
| 1   | Test infrastructure exists with adequate coverage | critical | WARN | 250 `*.{test,spec}.{ts,tsx}` files vs ~1497 source `.ts/.tsx` files — substantial but ratio likely <60%; tests broadly co-located across `savepoint-app/{features,widgets,shared,data-access-layer,app}` and `savepoint-tanstack/src/**` |
| 2   | Unit tier present | high | PASS | `savepoint-tanstack/vitest.config.ts` defines `unit` project (`src/**/*.unit.test.{ts,tsx}` + `*.test.{ts,tsx}`); `savepoint-app/vitest.config.ts` has `utilities`/`components`/`backend` projects with `vi.mock` used in 143 test files |
| 3   | Integration tier present | high | PASS | Explicit `*.integration.test.ts` glob in both `vitest.config.ts` files (forks, maxWorkers=1, dedicated `integration` setup); 13 integration test files including `steam-import`, `avatar-storage`, `better-auth-cognito-sign-in`, `get-related-games`, `get-game-details` |
| 4   | E2E tier present | high | PASS | `savepoint-app/playwright.config.ts` + 10 spec files in `savepoint-app/e2e/` (library, journal, profile, themes, dashboard-guard, auth-session, add-to-library, shell-and-palette, profile-setup, profile-settings) |
| 5   | Pyramid shape — no inversion | medium | PASS | unit ≈ 142 (120 app non-integration + 22 tanstack) > integration 13 > e2e 10 — healthy pyramid |
| 6   | Coverage reporting configured | low | WARN | `savepoint-app/vitest.coverage.config.ts` configures v8 coverage with `include`/`exclude` and `text/json/html` reporters, but no `thresholds` / `lines` minimum; `savepoint-tanstack` has no coverage config at all |
| 7   | Test data management | low | PASS | `@faker-js/faker@10.1.0` in `savepoint-app/package.json`; `savepoint-app/test/setup/db-factories/` (user, game, journal, imported-game) used across integration tests; `savepoint-app/test/fixtures/` and `savepoint-app/e2e/fixtures/` present |
| 8   | Test isolation — mocking infrastructure | medium | PASS | `vi.mock` used in 143 test files; `msw@2.13.0` in deps with `test/mocks/handlers/{next-api,steam-api}.ts` and `client-setup.ts` wiring `setupServer`; used in feature/component/integration tests |
| 9   | Contract testing | high | SKIP | Topology shows single-app intra-process comms (Next.js server actions, TanStack `createServerFn`); no inter-service GraphQL/gRPC/OpenAPI surfaces |
| 10  | ML model iteration testing | high | SKIP | No ML framework imports (`sklearn`, `torch`, `tensorflow`, `xgboost`, `transformers`, `keras`) anywhere in the repo |

## Scoring

- Max points (excl. SKIPs): 3 + 2 + 2 + 2 + 1 + 0.5 + 0.5 + 1 = **12.0**
- Deductions: QA-01 WARN critical (−1.5) + QA-06 WARN low (−0.25) = **1.75**
- Raw: 10.25 / 12.0 = **85.4% → Grade B**

## QA Summary

- **Frameworks:** Vitest 4.x in both apps (multi-project: utilities/components/backend/integration in `savepoint-app`; unit/integration in `savepoint-tanstack`); Playwright in `savepoint-app/e2e/`
- **Mocking:** `vi.mock` + MSW v2 (HTTP handlers in `test/mocks/handlers/`)
- **Fixtures/factories:** `@faker-js/faker` + `savepoint-app/test/setup/db-factories/`
- **Integration isolation:** `pool: forks`, `maxWorkers: 1`, dedicated integration setup file in both apps
- **Coverage:** v8 via `savepoint-app/vitest.coverage.config.ts` (no thresholds); `savepoint-tanstack` not yet wired
- **Gaps:** (1) no coverage thresholds enforced; (2) `savepoint-tanstack` lacks coverage config and E2E suite (acceptable pre-cutover per spec 021); (3) source/test ratio appears below 60% — adding coverage thresholds would surface the true number
