# End-to-End Delivery — Audit Results

**Date:** 2026-05-12
**Score:** 79% — Grade **B**

## Results

| #   | Check                                          | Severity | Status | Evidence |
| --- | ---------------------------------------------- | -------- | ------ | -------- |
| 1   | E2E-01 Cross-layer feature branches            | high     | WARN   | 9 recent feat/refactor/experiment branches analyzed against service dirs (`savepoint-app`, `savepoint-tanstack`, `infra`, `lambdas-py`); 3/9 (33%) cross-layer — `feat/011-star-ratings` (savepoint-app+lambdas-py), `feat/015-retire-lambdas-pipeline` (savepoint-app+infra+lambdas-py), `experiment/side-tanstack-app` (savepoint-app+savepoint-tanstack); 6/9 single-layer (all savepoint-app: 007-fsd, nextjs-16, social-engagement, ui-modernization, unified-profile-view, refactor/migrate-to-better-auth). 33% falls in Warn band (25–49%) |
| 2   | E2E-02 No layer-split branching pattern        | medium   | PASS   | `git branch -a` shows no `*-backend`/`*-frontend`/`*-api`/`*-ui` suffix pairs; branch naming uses feature-scope prefixes (`feat/<spec>-<name>`, `refactor/<area>`, `experiment/<name>`, dependabot/...) — no layer-split pairs |
| 3   | E2E-03 Spec-to-delivery traceability           | high     | PASS   | SDD-04 PASS (75% of feat-branches touch `context/spec/`). Sampled commits: `spec 021 slice 14A`, `spec 020 slices 6–8`, `spec 018` referenced directly in messages; tasks.md files show progressive `[x]` ticks correlated with branch work (spec 021: 137 done / 45 todo on this branch); spec dirs include tasks.md with branch-aligned slices. Bidirectional: branches reference spec IDs, specs reference branches/PRs |
| 4   | E2E-04 No orphaned artifacts                   | medium   | PASS   | Topology shows no OpenAPI/gRPC/GraphQL contracts; communication is in-app (Next.js `app/api/**/route.ts` + server actions; TanStack `createServerFn`); both Prisma schemas (`savepoint-app/prisma`, `savepoint-tanstack/prisma`) are consumed by their host app (`@/data-access-layer/repository/**`, tanstack `features/**/api`); `infra/modules/{cognito,s3}` are referenced from `infra/envs/{dev,prod}/*.tf`; LocalStack S3 in `docker-compose.yml` used by both apps' `@aws-sdk/client-s3` consumers |
| 5   | E2E-05 Shared ownership enablers               | medium   | WARN   | Root tooling present but incomplete: `Makefile` exists but only targets `pnpm --filter savepoint` (no `savepoint-tanstack`, no `infra`); root `docker-compose.yml` spans full local stack (postgres+pgadmin+localstack) usable by both JS apps and approximates S3 infra; CI is split per app (`.github/workflows/pr-checks.yml` for savepoint-app, `pr-checks-tanstack.yml` for tanstack; `deploy.yml`/`e2e.yml`/`integration.yml`); root `package.json` has no scripts (`"scripts": {}`); no unified task runner that exercises infra+app+tanstack together |

**Scoring:** max points = 2 + 1 + 2 + 1 + 1 = 7. Deductions: E2E-01 WARN (high) = 1; E2E-05 WARN (medium) = 0.5. Raw = 5.5 / 7 = **78.6%** — Grade **B**.

## End-to-End Delivery Summary

- **Repo type:** monorepo (pnpm workspace + sibling Terraform root); 3 service dirs `savepoint-app/`, `savepoint-tanstack/`, `infra/` (+ historical `lambdas-py/` retired per spec 015)
- **Cross-layer branch rate:** 33% (3 / 9 recent feature branches) — Warn band; dominated by savepoint-app-only branches because the active product app is single-service while `infra` and `savepoint-tanstack` change rarely
- **Layer-split anti-pattern:** absent — no `*-backend`/`*-frontend` paired branches
- **Spec traceability:** strong; branches embed spec IDs in commit messages and reference `context/spec/NNN/tasks.md`; tasks.md tick-rates correlate with branch progress
- **Orphans:** none material — no contract artifacts (OpenAPI/gRPC/GraphQL); Prisma schemas, infra modules, and S3/Cognito resources all have consumers
- **Shared tooling gaps:**
  - `Makefile` does not invoke `savepoint-tanstack` or `infra` targets
  - Root `package.json` `scripts` is empty (no unified `dev`/`test`/`ci` aggregator across packages)
  - CI is duplicated rather than unified (separate `pr-checks.yml` and `pr-checks-tanstack.yml`) — acceptable while migrating but not a unified pipeline
- **Recommended fixes (for downstream recommendations file):**
  - P2 (E2E-01 high WARN): Expectation may simply not apply — most recent work is concentrated on `savepoint-app/`. Consider re-evaluating when `experiment/side-tanstack-app` lands and spec 021 cutover begins to produce naturally cross-layer branches. Alternatively, fold related infra/tanstack changes into feature branches rather than separating them.
  - P2 (E2E-05 medium WARN): Extend root `Makefile` (or root `package.json` scripts) with targets that cover all three layers — e.g., `make dev` should also start tanstack on :6061; `make test` should fan out to both `--filter savepoint` and `--filter savepoint-tanstack`; add `make infra-plan` invoking `terraform -chdir=infra/envs/dev plan`. Consolidate or document the relationship between `pr-checks.yml` and `pr-checks-tanstack.yml` so contributors know which to expect on a cross-layer change.
