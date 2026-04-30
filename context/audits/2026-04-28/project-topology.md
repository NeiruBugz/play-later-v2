# Project Topology — Audit Results

**Date:** 2026-04-28
**Score:** 100% — Grade **A**

## Results

| #   | Check | Severity | Status | Evidence |
| --- | ----- | -------- | ------ | -------- |
| TOPO-01 | Repository structure type | medium | PASS | Monorepo: pnpm workspace (`pnpm-workspace.yaml`) with `savepoint-app/package.json` as the sole JS package + `infra/` Terraform layer; root `package.json` orchestrates. lambdas-py pipeline retired (commit 1b03733). |
| TOPO-02 | Application layer inventory | medium | PASS | (1) Web app: Next.js 15 App Router + TypeScript at `savepoint-app/` (frontend pages + REST API routes + server actions). (2) IaC: Terraform at `infra/` with modules `cognito`, `s3` and envs `dev`, `prod`. |
| TOPO-03 | Database and storage detection | medium | PASS | PostgreSQL 16 via Prisma (`savepoint-app/prisma/schema.prisma` + `prisma/migrations/`); local services in `docker-compose.yml`: Postgres :6432, pgAdmin :5050, LocalStack S3 :4568; AWS S3 module at `infra/modules/s3`. |
| TOPO-04 | Infrastructure layer detection | medium | PASS | Terraform >= 1.5, AWS provider ~> 5.0; `infra/envs/{dev,prod}`, `infra/modules/{cognito,s3}` (14 `.tf` files); Docker Compose for local dev; GitHub Actions workflows: `pr-checks.yml`, `deploy.yml`, `e2e.yml`, `integration.yml`. |
| TOPO-05 | Language inventory | medium | PASS | TypeScript: 693 `.ts` + 438 `.tsx` = 1131 files; JSX: 29; HCL/Terraform: 14 `.tf`. No Python/Go/Rust files in repo. |
| TOPO-06 | Inter-layer communication patterns | medium | PASS | Internal: Next.js REST API routes under `savepoint-app/app/api/**/route.ts` (auth, games, library, social, steam) + `next-safe-action` server actions. External: IGDB API, Steam API, AWS Cognito (auth via NextAuth), AWS S3 (storage). No gRPC/GraphQL/OpenAPI; SQS pipeline retired. |

## Topology Summary

- **Structure:** monorepo (pnpm workspace + Terraform IaC layer)
- **Layers:**
  - web-app: Next.js 15 (App Router) + React + TypeScript at `savepoint-app/` (lang: TypeScript)
  - iac: Terraform >= 1.5 / AWS provider ~> 5.0 at `infra/` (lang: HCL)
- **Storage:** PostgreSQL 16 via Prisma ORM (`savepoint-app/prisma/`); AWS S3 (LocalStack locally, real S3 in AWS); NextAuth/Cognito-managed sessions
- **Infrastructure:** Terraform modules (`cognito`, `s3`); envs `dev`/`prod`; Docker Compose (postgres, pgadmin, localstack); GitHub Actions CI (pr-checks, deploy, e2e, integration)
- **Languages:** TypeScript (1131 files: 693 .ts + 438 .tsx), JSX (29), HCL (14 .tf)
- **Communication:** Internal — Next.js REST API routes + `next-safe-action` server actions (single-process app + DB). External — IGDB API, Steam API, AWS Cognito, AWS S3
- **Service directories:** `savepoint-app/` (web app root), `infra/` (IaC), `savepoint-app/app/api/` (API routes), `savepoint-app/features/`, `savepoint-app/data-access-layer/`, `savepoint-app/widgets/`, `savepoint-app/shared/`, `savepoint-app/prisma/`, `infra/modules/`, `infra/envs/`
