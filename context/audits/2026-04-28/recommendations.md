# Audit Recommendations — 2026-04-28

## P0 — Fix Immediately

_None._ No critical FAILs across any dimension.

## P1 — Fix Soon

### 1. Remove stale infra references in top-level docs

- **Dimension:** Documentation Quality
- **Check:** DOC-04
- **Effort:** Low
- **Details:** `README.md:10` describes infra as "Terraform infrastructure (RDS, ECS, S3, environments, modules)" and `CLAUDE.md:8` lists "Cognito, S3, ECR, SQS, Secrets Manager". Reality post-1b03733: only `infra/modules/cognito` and `infra/modules/s3` exist. Edit both lines to read "Cognito, S3" (or "Terraform IaC for AWS Cognito + S3"). Sweep nearby paragraphs for any other lambdas-py / Python pipeline / SQS leftovers.

### 2. Increase test linkage for DAL and features

- **Dimension:** Quality Assurance
- **Check:** QA-01 (critical WARN — drives the dimension's main deduction)
- **Effort:** Medium
- **Details:** 152 test files cover ~25% of 619 source modules by naming-linkage. Prioritize co-locating tests for under-tested services in `data-access-layer/services/**` and use-cases in `features/**/use-cases/**`, since handlers and repositories already have decent unit/integration coverage. Treat as ongoing per-feature work, not a one-shot.

### 3. Add service-level docs to undocumented dirs

- **Dimension:** Documentation Quality
- **Check:** DOC-02
- **Effort:** Medium
- **Details:** Add a brief README.md (or layered CLAUDE.md if AI-context is the primary need) to:
  - `savepoint-app/app/api/` — handler pattern, route conventions, auth wrapper
  - `savepoint-app/prisma/` — migration workflow, schema conventions
  - `infra/modules/` — module index + how to add a new module
  - `infra/envs/` — env layout, state backend, plan/apply workflow

## P2 — Improve When Possible

### 4. Add coverage thresholds to gate CI

- **Dimension:** Quality Assurance
- **Check:** QA-06
- **Effort:** Low
- **Details:** Extend `savepoint-app/vitest.coverage.config.ts` with a `coverage.thresholds` block (e.g. `lines: 70`, `functions: 70`, `branches: 60`) so coverage regressions fail CI rather than passing silently. Tune to current baseline first.

### 5. Mark spec 005 as Completed

- **Dimension:** Spec-Driven Development
- **Check:** SDD-06
- **Effort:** Low
- **Details:** `context/spec/005-library-status-redesign/functional-spec.md` lacks a `Status:` field even though the roadmap shows it shipped. Add `- **Status:** Completed` near the spec header to close the consistency gap.

### 6. Wire Husky pre-commit to lint-staged

- **Dimension:** Software Best Practices
- **Check:** SBP-02
- **Effort:** Low
- **Details:** `lint-staged` is installed but no `.husky/` directory exists, so format/lint enforcement only runs in CI. Run `pnpm dlx husky init` (or equivalent), add `.husky/pre-commit` containing `pnpm lint-staged`, and commit. Catches violations before push and shortens CI feedback loops.

### 7. Lift cross-feature dependencies into shared/DAL

- **Dimension:** Code Architecture
- **Check:** ARCH-02
- **Effort:** Medium
- **Details:** 7 DAL→features imports violate the declared one-way direction in `features/CLAUDE.md`. Two are runtime: `data-access-layer/services/profile/profile-service.ts` imports `validateUsername` from `@/features/profile/lib`, and `data-access-layer/handlers/igdb/igdb-handler.ts` imports `SearchGamesSchema` from `@/features/game-search`. Five are type-only (activity-feed, journal, library, social typings). Move shared validators/schemas/types into `shared/` (cross-cutting) or `data-access-layer/domain/` (domain-owned). Add an `eslint-plugin-boundaries` rule to lock the direction once cleaned.
