# Code Architecture Audit

**Date:** 2026-03-25
**Dimension:** code-architecture
**Score:** 66.7 / 100
**Grade:** C

## Results

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| ARCH-01 | Declared or recognizable architectural pattern | high | PASS | Feature-Sliced Design (features/) + layered DAL (handlers/services/repository/domain) explicitly documented in CLAUDE.md files across savepoint-app/features/, savepoint-app/data-access-layer/, savepoint-app/shared/, and savepoint-app/app/. lambdas-py uses handlers/services/models/clients layered pattern. |
| ARCH-02 | Module boundaries are respected | high | WARN | 2 violations: (1) `game-search` imports from `manage-library-entry` without being listed as an authorized consumer in features/CLAUDE.md. (2) DAL handlers import from features layer (reverse dependency): `handlers/game-search/game-search-handler.ts` imports `features/game-search/schemas`, `handlers/platform/get-platforms-handler.ts` imports `features/manage-library-entry/use-cases`. DAL should not depend on features. |
| ARCH-03 | Single Responsibility Principle in modules | medium | PASS | All 13 feature modules have clear, descriptive domain names. `manage-library-entry` (55 files) and `steam-import` (47 files) are the largest but maintain focused subdirectories (ui/, server-actions/, use-cases/, hooks/). `test/helpers` and `test/utils` are acceptable for test infrastructure. No god modules detected. |
| ARCH-04 | Separation of concerns across layers | high | WARN | Mostly well-separated via DAL layers + features. 2 issues: (1) 5 files in `features/steam-import/` import `@prisma/client` types directly, leaking persistence model into feature layer. (2) 2 use-cases bypass services to access repository directly: `features/manage-library-entry/use-cases/get-platforms-for-library-modal.ts` and `features/steam-import/use-cases/import-game-to-library.ts` both import from `@/data-access-layer/repository`. |
| ARCH-05 | Consistent file and directory naming conventions | medium | PASS | Consistent kebab-case for all TS/TSX files and directories. No PascalCase filenames found. Python layer uses snake_case consistently. Test files use `.test.ts`/`.test.tsx` or `.unit.test.ts`/`.integration.test.ts` suffixes consistently. Type files use `.types.ts` suffix. |
| ARCH-06 | Reasonable file sizes | medium | FAIL | 25 of 600 source files (4.2%) exceed 500 lines -- under the 5% threshold. However, `data-access-layer/services/igdb/igdb-service.unit.test.ts` is 3260 lines, exceeding the 2000-line absolute limit. Other large files: `igdb-service.ts` (1389), `library-repository.ts` (921), `imported-games-list.tsx` (683). |

## Scoring

| Check | Severity | Weight | Status | Deduction |
|-------|----------|--------|--------|-----------|
| ARCH-01 | high | 2 | PASS | 0 |
| ARCH-02 | high | 2 | WARN | 1 |
| ARCH-03 | medium | 1 | PASS | 0 |
| ARCH-04 | high | 2 | WARN | 1 |
| ARCH-05 | medium | 1 | PASS | 0 |
| ARCH-06 | medium | 1 | FAIL | 1 |

**Max points:** 9
**Deductions:** 3
**Score:** (9 - 3) / 9 * 100 = 66.7
**Grade:** C

## Summary

The project has a well-documented, explicitly declared architecture combining Feature-Sliced Design with a layered Data Access Layer. Documentation is thorough with CLAUDE.md files at each architectural boundary defining import rules, responsibilities, and cross-feature exceptions.

Three areas need attention:

1. **Boundary violations:** DAL handlers importing from the features layer creates a reverse dependency (features should depend on DAL, not vice versa). The `game-search` feature imports from `manage-library-entry` without being documented as an authorized consumer.

2. **Layer leakage:** Some feature use-cases bypass the service layer to access repositories directly, and `steam-import` imports `@prisma/client` types, coupling feature code to the persistence model.

3. **File size:** One test file (`igdb-service.unit.test.ts` at 3260 lines) exceeds the 2000-line limit and should be split into focused test suites.
