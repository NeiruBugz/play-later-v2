# Code Architecture — Audit Results

**Date:** 2026-06-10
**Score:** 100% — Grade **A**

## Results

| #   | Check | Severity | Status | Evidence |
| --- | ----- | -------- | ------ | -------- |
| ARCH-01 | Declared or recognizable architectural pattern | high | PASS | FSD explicitly declared in `savepoint-tanstack/CLAUDE.md` (FSD layer map: app/routes/widgets/features/entities/shared). All six layers present under `src/`. `infra/` is idiomatic Terraform (envs/modules). |
| ARCH-02 | Module boundaries respected | high | PASS | `eslint-plugin-boundaries` enforces directional rules in `eslint.config.mjs` (per-slice capture; cross-feature/cross-entity forbidden, shared→shared only). Sampled graph: 0 shared→upper imports, 0 entity→feature imports, 0 true cross-feature imports (all `@/features/<self>` refs are intra-slice). Regression-guarded by `test/eslint/`. |
| ARCH-03 | Single Responsibility in modules | medium | PASS | Modules are named by domain intent (28 feature slices, 9 entity nouns, 22 widgets). No god module: largest single dir is `src/shared/ui` (47 files = distinct shadcn primitives); no `helpers/`, `common/`, `misc/`, `general/` catch-alls. |
| ARCH-04 | Separation of concerns across layers | high | PASS | Entity queries are pure Prisma data-access throwing `AppError` (`entities/profile/api/get-profile.server.ts`); 0 `prisma.` calls in `.tsx` components; only `fetch` in a component is a presigned-URL S3 PUT in `upload-avatar` (legitimate UI concern). Two-layer DAL (C2) documented; no service/Result/mapper mixing. |
| ARCH-05 | Consistent file/directory naming | medium | PASS | Uniform kebab-case across features/widgets/entities/shared; 0 deviations found. One-component-per-folder with barrel + `.type.ts`/`.utility.ts`/`.test.tsx` convention. Tests 100% colocated (160 colocated `.test` files, 0 `__tests__/` dirs). 0 PascalCase source filenames. |
| ARCH-06 | Reasonable file sizes | medium | PASS | 0 of 821 source files exceed 500 lines once tests are excluded (the 4 files >500 are all `.test.tsx`); 0 files >1000. 0% over threshold (<5% pass bar). |

## Score Math

- max_points = 2 + 2 + 1 + 2 + 1 + 1 = **9** (no SKIP checks)
- deductions = **0** (all PASS)
- raw = 9 − 0 = 9 → pct = 9/9 × 100 = **100%**
- Grade: A (90–100)
