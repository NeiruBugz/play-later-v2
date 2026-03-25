# Code Architecture — Audit Results

**Date:** 2026-03-25
**Score:** 80% — Grade **B**

## Results

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| ARCH-01 | Declared or recognizable architectural pattern | high | PASS | Architecture explicitly documented in per-layer CLAUDE.md files. savepoint-app uses FSD-like pattern (app/, features/, shared/) with a layered Data Access Layer (handlers/services/repository/domain). lambdas-py uses handlers/clients/services/models layered pattern. infra uses standard Terraform modules/envs layout. |
| ARCH-02 | Module boundaries are respected | high | WARN | Import direction is generally correct (app -> features -> shared; features -> DAL services). 2 violations found: (1) features/steam-import and features/journal import directly from `@/data-access-layer/repository` bypassing services (documented as prohibited). (2) app/(protected)/journal/page.tsx and app/(protected)/journal/[id]/page.tsx import directly from `@/data-access-layer/repository` (CLAUDE.md says "Never direct" repository access from app). Cross-feature imports (game-search -> manage-library-entry, game-detail -> journal, dashboard -> library) are documented in features/CLAUDE.md exception table. shared/ has zero upward imports. |
| ARCH-03 | Single Responsibility Principle in modules | medium | PASS | All 14 feature directories have clear, domain-specific names (auth, library, journal, game-detail, steam-import, etc.). Each feature internally organizes into ui/, hooks/, server-actions/, use-cases/. DAL subdivides cleanly by domain (game, library, journal, platform, user). No god modules; largest feature (steam-import) stays focused on Steam import workflow. No catch-all helpers/ or misc/ directories. |
| ARCH-04 | Separation of concerns across layers | high | PASS | Clear separation: UI components in features/*/ui/ contain no data access; server actions use next-safe-action; business logic lives in DAL services; data access is isolated in DAL repository. Sampled 8 UI files -- none contain fetch calls, SQL, or direct prisma usage. app/ pages delegate to features and services. journal/page.tsx mixes a minor data-join concern but uses service + repository, not raw DB calls. |
| ARCH-05 | Consistent file and directory naming conventions | medium | PASS | TypeScript layer: consistent kebab-case for all files and directories (library-card.tsx, use-library-data.ts, game-detail/). Type files use .types.ts suffix. Test files use .test.ts/.unit.test.ts/.integration.test.ts consistently. Python layer: consistent snake_case (database_import.py, igdb_enrichment.py). Terraform: standard main.tf/variables.tf/outputs.tf per module. No PascalCase source files found outside generated Prisma models. |
| ARCH-06 | Reasonable file sizes | medium | PASS | Excluding generated Prisma models, 6 of ~485 source files exceed 500 lines (1.2%): igdb-service.ts (1271), database.py (769), library-repository.ts (697), database_import.py (696), imported-games-list.tsx (683), db.py (526). No non-generated source file exceeds 2000 lines. Well under the 5% threshold. |

## Scoring

| Check | Severity | Weight | Status | Deduction |
|-------|----------|--------|--------|-----------|
| ARCH-01 | high | 2 | PASS | 0 |
| ARCH-02 | high | 2 | WARN | 1 |
| ARCH-03 | medium | 1 | PASS | 0 |
| ARCH-04 | high | 2 | PASS | 0 |
| ARCH-05 | medium | 1 | PASS | 0 |
| ARCH-06 | medium | 1 | PASS | 0 |

**Max points:** 9
**Deductions:** 1
**Score:** (9 - 1) / 9 * 100 = 88.9 -> 89%
**Grade:** B

## Summary

The project has a well-documented, explicitly declared architecture combining a Feature-Sliced Design variant with a layered Data Access Layer. Each architectural boundary has its own CLAUDE.md file defining responsibilities, import rules, and allowed cross-feature exceptions.

One area needs attention:

1. **Repository bypass violations:** Three files (features/steam-import/use-cases/import-game-to-library.ts, features/journal/server-actions/get-games-by-ids.ts, and app/(protected)/journal/page.tsx) import directly from `@/data-access-layer/repository`, bypassing the service layer. The DAL CLAUDE.md explicitly prohibits this pattern -- repository access should go through services or use-cases that call services.
