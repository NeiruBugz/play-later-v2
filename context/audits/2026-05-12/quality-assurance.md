# Quality Assurance — Audit Results

**Date:** 2026-05-12
**Score:** 85% — Grade **B**

## Results

| #   | Check                                          | Severity | Status | Evidence |
| --- | ---------------------------------------------- | -------- | ------ | -------- |
| 1   | QA-01 Test infrastructure exists with coverage | critical | WARN   | 250 test files (222 savepoint-app incl. e2e, 62 savepoint-tanstack) vs ~1,142 non-test ts/tsx source files; estimated linkage ~22% (below 60% pass bar, consistent with prior audit note of ~25%) |
| 2   | QA-02 Unit tier present                        | high     | PASS   | Tanstack vitest project `name: "unit"` (`savepoint-tanstack/vitest.config.ts:25`); `*.unit.test.*` files in both apps (4 across `data-access-layer/services/**` + `library-item-card.test.tsx`); in-source jsdom unit tests under `features/**/ui` / `widgets/**/ui` |
| 3   | QA-03 Integration tier present                 | high     | PASS   | Dedicated `integration` vitest projects in both apps with `pool: "forks"`, `maxWorkers: 1`, `test/setup/integration.ts`; 13 `*.integration.test.*` files (2 savepoint-app, 11 savepoint-tanstack); GitHub Actions `integration.yml` workflow |
| 4   | QA-04 E2E tier present                         | high     | PASS   | `savepoint-app/playwright.config.ts` + 11 `*.spec.ts` flows under `savepoint-app/e2e/` (auth, library, journal, profile, themes, shell/palette); `.github/workflows/e2e.yml` |
| 5   | QA-05 Pyramid shape — no inversion             | medium   | PASS   | Unit/component (~226) >> integration (~13) >> e2e (~11); healthy pyramid |
| 6   | QA-06 Coverage reporting configured            | low      | WARN   | `savepoint-app/vitest.coverage.config.ts` defines `coverage.provider: "v8"` with reporters but no `thresholds` key (no enforced minimum); `savepoint-tanstack/vitest.config.ts` has no `coverage` section at all |
| 7   | QA-07 Test data management                     | low      | PASS   | `savepoint-app/test/fixtures/` (game-detail, game-search, journal, library, platform, profile, igdb subdir, enum-test-cases); `savepoint-app/e2e/fixtures/`; `@faker-js/faker@10.1.0` in deps |
| 8   | QA-08 Test isolation — mocking infrastructure  | medium   | PASS   | `vi.mock`/`vi.fn`/`vi.spyOn` used in 110 savepoint-app + 43 savepoint-tanstack test files; `msw@2.13.0` with handlers `test/mocks/handlers/{next-api,library-api,steam-api,twitch}.ts` + `test/mocks/server.ts` |
| 9   | QA-09 Contract testing                         | high     | SKIP   | Topology shows monorepo with REST-only internal communication and no inter-service producer/consumer split (both JS apps share one Postgres; no OpenAPI/gRPC/GraphQL/MQ contracts) |
| 10  | QA-10 ML model iteration testing               | high     | SKIP   | Topology shows no ML layer; no `sklearn`/`torch`/`tensorflow`/`xgboost`/`transformers` imports in source |

## QA Summary

- **Test tooling:** Vitest (both apps with multi-project configs) + Playwright (savepoint-app only). MSW + faker installed and actively used.
- **Pyramid shape:** Healthy — unit/component tests dominate; integration tests sit on a dedicated forked-pool project; small but real E2E layer.
- **Primary gap (QA-01):** Test-to-source linkage hovers around ~22%, well below the 60% pass bar. Many `features/**`, `widgets/**`, `entities/**` modules ship without a co-located `*.test.tsx`. This is the most consequential QA debt for AI-readiness because it limits the safety net for autonomous edits.
- **Secondary gap (QA-06):** Coverage tooling is wired (`vitest.coverage.config.ts` with v8 provider) but no `thresholds` are declared — CI cannot regress-fail on coverage drops. `savepoint-tanstack/vitest.config.ts` has no coverage section at all.
- **Tanstack TDD policy:** `savepoint-tanstack/CLAUDE.md` documents a binding RED-GREEN-REFACTOR rule with canary harness sentinels (`test/canary/`, `test/integration/canary.integration.test.ts`) and a boundary-rule regression guard (`test/eslint/`). New code in that app is held to a higher bar than the linkage ratio suggests.
- **Skipped:** Contract testing (single-repo, no inter-service split) and ML model testing (no ML layer).
