---
dimension: end-to-end-delivery
date: 2026-05-18
---

# End-to-End Delivery — Audit Results

**Date:** 2026-05-18
**Score:** 64% — Grade **C**

## Results

| #   | Check                                | Severity | Status | Evidence |
| --- | ------------------------------------ | -------- | ------ | -------- |
| 1   | E2E-01 Cross-layer feature branches  | high     | FAIL   | Service dirs per topology: `savepoint-app`, `savepoint-tanstack`, `infra`. Of 14 recent non-dependabot feature/refactor/chore branches analyzed via `git diff --name-only origin/main...<branch>`, only 3 touched 2+ service dirs: `feat/015-retire-lambdas-pipeline` (savepoint-app + infra + lambdas-py), `experiment/side-tanstack-app` (savepoint-app + savepoint-tanstack), `feat/011-star-ratings` (savepoint-app + lambdas-py). 11 branches were savepoint-app-only (007, nextjs-16, social-engagement, ui-modernization, unified-profile-view, dal-typed-throw, igdb-service, migrate-to-better-auth, speed-insights, ui-ux-audit-v2, spec-020-verification). Ratio: 3/14 = 21% (<25% threshold). |
| 2   | E2E-02 No layer-split branching pattern | medium | PASS   | `git for-each-ref` over `refs/remotes/origin/` matched only `origin/exp/y2k-ui` against `(backend|frontend|-api$|-ui$)`; no paired `*-backend`/`*-frontend` siblings for the same feature. `exp/y2k-ui` is a standalone UI experiment, not half of a split pair. |
| 3   | E2E-03 Spec-to-delivery traceability | high     | PASS   | SDD-04 PASS (6/8 recent feat branches touched `context/spec/`). Commit messages explicitly reference specs in both directions: e.g. `feat(auth): cut over to better-auth (spec 020 slices 6–8)`, `perf(app): stream signed-in pages and cache hot reads (spec 018)`, `feat(tanstack): slice 14 — related games infinite scroll (spec 021)`, `refactor(dal): replace Result-wrapper machinery (spec 017)`. spec dirs carry tasks.md with `[x]` ticks correlated with branch commits (e.g. spec 021 tasks.md updated in same branch as tanstack slice commits). Bidirectional. |
| 4   | E2E-04 No orphaned artifacts         | medium   | PASS   | No OpenAPI/GraphQL contracts to orphan (topology TOPO-06). Next.js route handlers + server actions live in same package as their UI consumers. TanStack `createServerFn` files (21 in `savepoint-tanstack/src`) consumed by colocated routes. Infra modules (`infra/modules/cognito/`, `infra/modules/s3/`) are referenced by app code: `savepoint-app/auth.ts`, `savepoint-app/shared/lib/storage/avatar-storage.ts` use `@aws-sdk/client-cognito-identity-provider` and `@aws-sdk/client-s3`. Prisma schemas/migrations exist in both apps and are referenced by repository code. No significant orphan found. |
| 5   | E2E-05 Shared ownership enablers     | medium   | WARN   | Partial cross-layer tooling. Present: root `docker-compose.yml` (postgres+pgadmin+localstack — spans DB/storage for both apps), root `pnpm-workspace.yaml` (declares both `savepoint-app` and `savepoint-tanstack`), root `package.json` with pnpm overrides. Gaps: root `Makefile` targets only `pnpm --filter savepoint` (does not invoke tanstack or infra); two parallel CI workflows `pr-checks.yml` + `pr-checks-tanstack.yml` rather than unified; `infra` has no root-level task runner entry (must `cd infra/envs/dev && terraform ...`); no unified `dev`/`test`/`ci` target that runs both apps. |

**Score calc:** max = 2+1+2+1+1 = 7. E2E-01 FAIL (high) = -2; E2E-05 WARN (medium) = -0.5. Raw = 4.5/7 = 64.29% → **C**.

## End-to-End Delivery Summary

- **Cross-layer delivery rate:** 21% (3/14 recent non-dependabot branches touched ≥2 service dirs)
- **Dominant single-layer footprint:** `savepoint-app/` — 11/14 analyzed branches were savepoint-app-only
- **Layer-split anti-pattern:** absent (no `-backend`/`-frontend` paired branches)
- **Spec traceability:** bidirectional — commit messages embed `(spec NNN slice X)`, spec tasks.md ticks track branch progress
- **Orphans:** none material — infra outputs (cognito, S3) consumed in `savepoint-app/auth.ts` and `avatar-storage.ts`; no contract-first APIs to orphan
- **Shared tooling:** root `docker-compose.yml` + `pnpm-workspace.yaml` span both JS apps; root `Makefile` is savepoint-app-only; CI is split into per-app workflows; infra has no root task entry
- **Key risk:** Even with monorepo structure and active TanStack migration, day-to-day work is overwhelmingly contained to a single layer per branch. Cross-layer slices (e.g. 015 lambdas retirement, side-by-side TanStack migration, 011 ratings) exist but are exceptions, not the norm. AI agents picking up tasks will likely operate within one app at a time, which matches current practice but limits true vertical-slice delivery when features span auth/infra/DB/UI together.
