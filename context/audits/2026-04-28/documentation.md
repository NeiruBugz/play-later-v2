# Documentation Quality — Audit Results

**Date:** 2026-04-28
**Score:** 75% — Grade **B**

## Results

| #   | Check | Severity | Status | Evidence |
| --- | ----- | -------- | ------ | -------- |
| 1   | DOC-01: Root README exists and is useful | critical | PASS | `README.md` at repo root: project name, two-module overview (`savepoint-app/`, `infra/`), getting-started commands (`cd savepoint-app && pnpm install && pnpm dev`), pnpm `-E` dependency convention, AWOS workflow table, pre-commit/CI guidance. New developer can follow it. |
| 2   | DOC-02: Service-level READMEs exist | high | WARN | Present: `savepoint-app/README.md` (498 lines), `infra/README.md` (68 lines). CLAUDE.md serves as service docs in `savepoint-app/features/`, `data-access-layer/`, `widgets/`, `shared/`. Missing any service-level docs (README or CLAUDE) in `savepoint-app/app/api/`, `savepoint-app/prisma/`, `infra/modules/`, `infra/envs/`. |
| 3   | DOC-03: API documentation is available | high | SKIP | Skip-When met: small closed API with co-located client. Topology confirms internal-only Next.js REST routes under `savepoint-app/app/api/**/route.ts` (auth, games, library, social, steam) + `next-safe-action` server actions. No third-party consumers, no public API gateway, no need for OpenAPI. |
| 4   | DOC-04: No stale documentation | medium | WARN | 2 of 5 sampled claims inaccurate. (1) `README.md:10` — "infra: Terraform infrastructure (RDS, ECS, S3, environments, modules)" — but `infra/modules/` contains only `cognito` and `s3`; no RDS or ECS modules exist. (2) `CLAUDE.md:8` — "Infrastructure as Code (Cognito, S3, ECR, SQS, Secrets Manager)" — no ECR, SQS, or Secrets Manager resources exist; lambdas-py pipeline retired in commit 1b03733 (no `lambdas-py/` dir present). Verified accurate: `pnpm dev` script, `scripts/init-localstack.sh` path, `.env.example` files, `pnpm ci:check` script. |

## Stale Claim Detail (DOC-04)

| File:Location | Claim | Reality |
| --- | --- | --- |
| `README.md:10` | "infra: Terraform infrastructure (RDS, ECS, S3, environments, modules)" | Only `infra/modules/cognito` and `infra/modules/s3` exist. No RDS or ECS modules. (`s3_ecs_task_role_name` is an optional input variable to the s3 module, not a managed ECS resource.) |
| `CLAUDE.md:8` | "Infrastructure as Code (Cognito, S3, ECR, SQS, Secrets Manager)" | Modules limited to `cognito` + `s3`. ECR / SQS / Secrets Manager not present — leftover from retired lambdas-py pipeline (commit 1b03733). |
| `README.md` LocalStack section | `bash scripts/init-localstack.sh`, port 4568, `.env.example` keys | Verified — file exists, port and env keys match codebase. |
| `savepoint-app/README.md:117–397` | `pnpm dev`, `pnpm postinstall`, `pnpm test:e2e`, `pnpm ci:check`, `pnpm test:coverage` | Verified — all scripts present in `savepoint-app/package.json`. |
| `CLAUDE.md` Quick Start | `docker compose up -d` brings up Postgres :6432, pgAdmin :5050, LocalStack :4568 | Verified against `docker-compose.yml` per topology summary. |

## Documentation Summary

- Root README: present and largely current; one stale infra claim (RDS/ECS).
- Service docs: `savepoint-app` and `infra` have READMEs; sub-layer dirs use CLAUDE.md as developer docs. Gaps in `app/api/`, `prisma/`, `infra/modules/`, `infra/envs/`.
- API docs: no OpenAPI/Swagger needed given closed internal API + co-located Next.js client + `next-safe-action` server actions as primary RPC.
- Staleness: two top-level docs (`README.md`, `CLAUDE.md`) still describe the retired lambdas-py infra (RDS/ECS/ECR/SQS/Secrets Manager). Should be reduced to "Cognito, S3" to match actual `infra/modules/`.

## Scoring

- Max points: 3 (DOC-01 critical) + 2 (DOC-02 high) + 1 (DOC-04 medium) = 6.0 (DOC-03 skipped)
- Deductions: DOC-02 WARN −1.0, DOC-04 WARN −0.5 = 1.5
- Score: (6.0 − 1.5) / 6.0 = 75% → Grade **B**
