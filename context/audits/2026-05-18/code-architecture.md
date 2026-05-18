---
dimension: code-architecture
date: 2026-05-18
---

# Code Architecture — Audit Results

**Date:** 2026-05-18
**Score:** 100% — Grade **A**

## Results

| #   | Check                                              | Severity | Status | Evidence |
| --- | -------------------------------------------------- | -------- | ------ | -------- |
| 1   | ARCH-01 Declared or recognizable architectural pattern | high   | PASS   | FSD explicitly declared in `savepoint-app/features/CLAUDE.md` (refs spec 007 FSD compliance), `savepoint-tanstack/CLAUDE.md` ("FSD reaffirmation for the DAL", "FSD layer map"), and `context/product/architecture.md`. Directory structure matches FSD: both apps expose `app/`, `widgets/`, `features/`, `shared/` (+ `entities/` in tanstack). DAL inside `savepoint-app/data-access-layer/` follows handler→service→repository→domain. |
| 2   | ARCH-02 Module boundaries are respected            | high     | PASS   | No FSD layer violations found in sampled imports: `rg "from '@/features" savepoint-app/shared/` → 0 hits; `rg "from '@/widgets" savepoint-app/shared/` → 0 hits; entities → features in tanstack → 0 hits. Library-repository.ts imports only from `@/shared/*`, `@prisma/client`, and sibling repository (allowed). tanstack enforces boundaries via `eslint-plugin-boundaries` per `savepoint-tanstack/CLAUDE.md`. |
| 3   | ARCH-03 Single Responsibility Principle in modules | medium   | PASS   | Top-level modules have focused, descriptive names (`auth`, `library`, `game-detail`, `journal`, `steam-import`, `social`, etc.). `shared/lib/` subdirs are small and purpose-named: `igdb/` (7), `errors/` (8), `platform/` (8), `storage/` (4), `steam/` (3), `prisma/` (5 user files), no `helpers/`, `common/`, `misc/`, `utils/` god dirs. DAL split into `handlers/`, `services/`, `repository/`, `domain/`. |
| 4   | ARCH-04 Separation of concerns across layers       | high     | PASS   | DAL enforces handler (HTTP+Zod) → service (business) → repository (Prisma) → domain (DTO) split (see `savepoint-app/data-access-layer/CLAUDE.md`). Sampled `library-repository.ts` contains only Prisma queries + error mapping. Sampled UI files (`imported-games-list.tsx`, `sidebar.tsx`) contain only presentation + local state; no inline SQL/fetch. Features expose `server-actions/`, `use-cases/`, `ui/`, `hooks/`, `schemas.ts` as separate slices. |
| 5   | ARCH-05 Consistent file and directory naming      | medium   | PASS   | Consistent kebab-case for source files across `features/`, `widgets/`, `shared/`, `entities/` (e.g., `journal-entry-form.tsx`, `library-card-cta.tsx`, `imported-games-list.tsx`). Test files colocated with `.test.tsx` / `.unit.test.ts` / `.integration.test.ts` suffixes. Directory names kebab-case (`game-detail`, `steam-import`, `manage-library-entry`). |
| 6   | ARCH-06 Reasonable file sizes                      | medium   | PASS   | Excluding Prisma-generated code (`shared/lib/prisma/{models,internal}/`) and `routeTree.gen.*`: ~1160 source TS/TSX files total (savepoint-app 800 + savepoint-tanstack 360). Files >500 lines: ~32 (~2.8%, well under 5% PASS threshold); >1000 lines: 4, all test files. Largest non-test source files: `library-repository.ts` (841), `sidebar.tsx` (770, shadcn-generated), `imported-games-list.tsx` (683), `commonInputTypes.ts` (644, prisma-adjacent generated). No file exceeds 1000 lines outside tests. |

## Dimension Summary

- **Architecture:** Feature-Sliced Design (declared + enforced) applied uniformly to both web app layers (`savepoint-app` Next.js 15 and `savepoint-tanstack` TanStack Start). Backend logic inside `savepoint-app/data-access-layer/` adds a handler→service→repository→domain stack inside the `shared`/DAL boundary.
- **Boundary enforcement:** Manual conventions in `savepoint-app` (CLAUDE.md + spec 007), automated via `eslint-plugin-boundaries` in `savepoint-tanstack`.
- **Notable strengths:** No god modules, no cross-feature pollution, clean DAL/UI separation, consistent kebab-case naming, colocated tests, well-scoped `shared/lib/*` subdirs.
- **Watch items (no failing checks):**
  - `data-access-layer/repository/library/library-repository.ts` at 841 lines is the largest hand-written source file — candidate for decomposition by entity boundary (library item vs library aggregation queries) if it continues to grow.
  - Several test files exceed 1000 lines (`journal-repository.integration.test.ts` 1344, `imported-games.handler.integration.test.ts` 1145); not flagged by ARCH-06 thresholds, but worth splitting per-scenario in future maintenance passes.
  - Two app layers (`savepoint-app` + `savepoint-tanstack`) implement the same domain in parallel during spec 021 migration; once migration completes, retire `savepoint-app/` to remove duplication.

## Score Calculation

- Max points: high(2)+high(2)+medium(1)+high(2)+medium(1)+medium(1) = **9.0**
- Deductions: 0 (6 PASS)
- Raw: 9.0 / 9.0 → **100% — Grade A**
