# Code Architecture — Audit Results

**Date:** 2026-04-28
**Score:** 88% — Grade **B**

## Results

| #   | Check | Severity | Status | Evidence |
| --- | ----- | -------- | ------ | -------- |
| ARCH-01 | Declared or recognizable architectural pattern | high | PASS | FSD declared in `savepoint-app/features/CLAUDE.md` ("Import hierarchy: features can only import from lower layers… shared/, data-access-layer/services") and reflected on disk: `app/`, `widgets/`, `features/`, `shared/` (FSD) plus a layered DAL (`data-access-layer/{handlers,services,repository,domain}`). Per-layer CLAUDE.md docs in `app/`, `features/`, `widgets/`, `data-access-layer/`, `shared/`. |
| ARCH-02 | Module boundaries are respected | high | WARN | Direction is largely correct (no `shared/` → `features/`, no `widgets/` → `app/` violations; only 1 non-test feature → repository import, and it is `import type` only). However DAL leaks upward into features in 7 files (e.g. `data-access-layer/services/profile/profile-service.ts` imports `validateUsername` from `@/features/profile/lib`; `data-access-layer/handlers/igdb/igdb-handler.ts` imports `SearchGamesSchema` from `@/features/game-search`; plus 5 `import type` leaks from `services/activity-feed`, `services/journal/types`, `handlers/library/types`, `handlers/social/types`). These violate the declared one-way direction `features → DAL`. |
| ARCH-03 | Single Responsibility Principle in modules | medium | PASS | Top-level modules are domain-named and focused: `features/{auth,library,journal,steam-import,profile,social,…}` (15 features, all business-domain names), `data-access-layer/{handlers,services,repository,domain}`, `widgets/{game-card,header,sidebar,mobile-nav,mobile-topbar,settings-rail}`, `shared/{lib,components,hooks,providers,config,constants,types}`. No `helpers/`, `misc/`, `general/`, `common/`. Largest cluster `features/library/ui` = 29 files, all library-card/list-row/filter related. `shared/lib` 16 entries (date, rate-limit, rich-text, typescale, storage…) — focused utilities. |
| ARCH-04 | Separation of concerns across layers | high | PASS | DAL enforces handler → service → repository → domain separation; features split into `ui/`, `server-actions/`, `use-cases/`, `hooks/`, `schemas.ts`, `types.ts`. Sampled files (e.g. `features/library/ui/library-card.tsx`, `features/journal/ui/journal-entry-quick-form.tsx`, `data-access-layer/services/igdb/igdb-service.ts`) keep transport/UI/business logic in distinct files. No giant React components mixing fetch + SQL + JSX. |
| ARCH-05 | Consistent file and directory naming conventions | medium | PASS | kebab-case files and directories enforced via `features/CLAUDE.md` naming table; spot check confirms: `library-card.tsx`, `library-card-menu.tsx`, `journal-entry-quick-form.tsx`, `igdb-service.ts`, `library-repository.ts`. Tests colocated as `*.test.tsx` / `*.unit.test.ts` / `*.integration.test.ts` next to source. PascalCase exports map to kebab-case filenames consistently. Infra `.tf` files use canonical Terraform names (`main.tf`, `providers.tf`, `variables.tf`, `versions.tf`, `outputs.tf`). |
| ARCH-06 | Reasonable file sizes | medium | PASS | 620 non-test source `.ts`/`.tsx` files; only 4 exceed 500 lines (`data-access-layer/repository/library/library-repository.ts` 857, `shared/components/ui/sidebar.tsx` 770 — vendored shadcn, `features/steam-import/ui/imported-games-list.tsx` 683, `data-access-layer/services/igdb/igdb-service.ts` 528). 4/620 = 0.65%, well under the 5% threshold. No file exceeds 1000 lines (largest test file is 1343 but tests are excluded per check rubric). |

## Scoring

- max_points = 2 + 2 + 1 + 1 + 1 + 1 = 8
- deductions = ARCH-02 WARN (high) = 1.0
- raw_score = 7.0 → pct = 87.5% → **Grade B**

## Architecture Summary

- **Pattern:** Feature-Sliced Design (FSD) for the web app + layered Data Access Layer (handlers → services → repository → domain). Declared in `savepoint-app/features/CLAUDE.md` and `data-access-layer/CLAUDE.md`.
- **Layers (top-down):** `app/` (App Router routes) → `widgets/` (composite UI: sidebar, header, game-card, mobile-nav, settings-rail) → `features/` (15 domain features each with `ui/`, `server-actions/`, `use-cases/`, `hooks/`, `schemas.ts`, `types.ts`) → `data-access-layer/` (handlers/services/repository/domain) → `shared/` (lib/components/hooks/providers/types).
- **Cross-feature imports:** governed by an explicit allowlist in `features/CLAUDE.md` (9 documented exceptions, e.g. `manage-library-entry`, `command-palette`, `social → profile`).
- **Naming:** kebab-case files and directories throughout; tests colocated; PascalCase component exports.
- **File size health:** 0.65% of source files exceed 500 lines; largest is 857.
- **Known boundary friction:** 7 DAL → features imports (2 runtime, 5 type-only) violate the declared one-way direction. Recommended action: lift `validateUsername` and shared schemas/types from `features/*` into `shared/` or `data-access-layer/domain/`.
