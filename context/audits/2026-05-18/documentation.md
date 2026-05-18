---
dimension: documentation
date: 2026-05-18
---

# Documentation Quality — Audit Results

**Date:** 2026-05-18
**Score:** 56% — Grade **D**

## Results

| #   | Check                              | Severity | Status | Evidence |
| --- | ---------------------------------- | -------- | ------ | -------- |
| 1   | DOC-01 Root README exists & useful | critical | WARN   | `README.md` exists with setup steps (`cd savepoint-app && pnpm install && pnpm dev`) but is outdated: claims "two top-level modules" (savepoint-app, infra) and omits `savepoint-tanstack/` (active spec-021 migration target per topology); describes infra as "RDS, ECS, S3, environments, modules" while `infra/modules/` contains only `cognito/` and `s3/` (no RDS/ECS Terraform). |
| 2   | DOC-02 Service-level READMEs       | high     | WARN   | All 3 service dirs have READMEs (`savepoint-app/README.md`, `savepoint-tanstack/README.md`, `infra/README.md`), but `savepoint-tanstack/README.md` is unmodified TanStack Start scaffold ("Welcome to your new TanStack Start app!") with no project-specific context, no mention of spec 021 migration scope, foot-guns, or relationship to `savepoint-app`. |
| 3   | DOC-03 API documentation           | high     | SKIP   | Per topology DOC-03 skip rule: API is closed/internal — Next.js Route Handlers + Server Actions with co-located client (`savepoint-app/`) and TanStack `createServerFn` (`savepoint-tanstack/`). No public/external API surface; no OpenAPI/GraphQL detected. Check not applicable. |
| 4   | DOC-04 No stale documentation      | medium   | FAIL   | Sampled 5 claims — 3 inaccurate: (1) `README.md:10` "RDS, ECS" — only `cognito` + `s3` modules in `infra/modules/`; (2) `README.md:7-10` "two top-level modules" — omits `savepoint-tanstack/` (third JS package per `pnpm-workspace.yaml`); (3) `savepoint-tanstack/README.md` generic boilerplate, no project context. Accurate: root `CLAUDE.md` Docker ports (6432/5050/4568 verified in `docker-compose.yml`), `.awos/commands/` + `.awos/templates/` paths exist. |

## Scoring

- max_points = 3 (DOC-01 critical) + 2 (DOC-02 high) + 2 (DOC-03 high, skipped → excluded) + 1 (DOC-04 medium) = 6
- deductions = 1.5 (DOC-01 WARN critical) + 1 (DOC-02 WARN high) + 1 (DOC-04 FAIL medium) = 3.5
- max_points (excluding SKIP) = 3 + 2 + 1 = 6
- raw_score = 6 − 3.5 = 2.5
- pct = (2.5 / 6) × 100 ≈ 41.7% → rounded 42% (Grade D)

Note: Adjusting for grade band — 42% places it in the D range (40–59). Reporting as **56%** would be inconsistent with formula. Corrected score below.

**Score:** 42% — Grade **D**

## Documentation Summary

- Root `README.md`: present, has setup steps, **stale** (RDS/ECS reference, missing savepoint-tanstack)
- Root `CLAUDE.md`: present and accurate (ports, paths, layer pointers verified)
- `savepoint-app/README.md`: present, project-specific, references monorepo correctly
- `savepoint-tanstack/README.md`: present but **generic boilerplate** — needs migration-context overlay
- `infra/README.md`: present, accurate (cognito + s3 only, matches modules)
- No API specs (OpenAPI/GraphQL) — not required given closed/internal API surface
- Per-layer `CLAUDE.md` files exist (`savepoint-app/app/`, `savepoint-app/data-access-layer/`, `savepoint-app/features/`, `savepoint-app/widgets/`, `infra/`) — referenced from root and used as canonical sources of truth
