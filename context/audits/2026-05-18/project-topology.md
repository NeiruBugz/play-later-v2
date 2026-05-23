# Project Topology — Audit Results

**Date:** 2026-05-18
**Score:** 100% — Grade **A**

## Results

| #   | Check                              | Severity | Status | Evidence                                                                                                                                  |
| --- | ---------------------------------- | -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Repository structure type          | medium   | PASS   | pnpm monorepo (`pnpm-workspace.yaml` with `savepoint-app`, `savepoint-tanstack`); third independent root `infra/` (Terraform).            |
| 2   | Application layer inventory        | medium   | PASS   | 3 layers: Next.js 16 app, TanStack Start v1 app, Terraform IaC (see Topology Summary).                                                    |
| 3   | Database and storage detection     | medium   | PASS   | Prisma schemas in both apps (`savepoint-app/prisma/schema.prisma`, `savepoint-tanstack/prisma/schema.prisma`); `docker-compose.yml` runs Postgres 16, pgAdmin 4, LocalStack S3. |
| 4   | Infrastructure layer detection     | medium   | PASS   | 14 `*.tf` files under `infra/envs/{dev,prod}` and `infra/modules/{cognito,s3}`; root `docker-compose.yml`; no Dockerfile/K8s/Helm.        |
| 5   | Language inventory                 | medium   | PASS   | TypeScript dominant: 942 `.ts`, 555 `.tsx`; plus 29 `.jsx`, 9 `.mjs`, 14 `.tf` (HCL). No other languages detected.                        |
| 6   | Inter-layer communication patterns | medium   | PASS   | No GraphQL/gRPC/OpenAPI specs; comms are intra-app via Next.js server actions / TanStack `createServerFn`; apps share Postgres via Prisma; AWS Cognito + S3 are out-of-process integrations. |

## Topology Summary

- **Structure:** monorepo (pnpm workspace + Terraform root)
- **Layers:**
  - frontend+backend (full-stack): Next.js 16 App Router at `savepoint-app/` (primary language: TypeScript)
  - frontend+backend (full-stack): TanStack Start v1 (Vite) at `savepoint-tanstack/` (primary language: TypeScript) — side-by-side rewrite under spec 021
  - infrastructure-as-code: Terraform (AWS provider) at `infra/` with envs `dev`, `prod` and modules `cognito`, `s3` (primary language: HCL)
  - data-access-layer (shared inside `savepoint-app`): handlers/services/repositories/domain at `savepoint-app/data-access-layer/` (TypeScript)
  - e2e tests: Playwright at `savepoint-app/e2e/` (TypeScript)
- **Storage:** relational PostgreSQL 16 via Prisma ORM (both apps); object storage via AWS S3 (LocalStack in dev, real S3 in deployed envs)
- **Infrastructure:** Terraform (>= 1.5, AWS provider ~> 5.0); Docker Compose for local dev (Postgres, pgAdmin, LocalStack); no Kubernetes/Helm/CDK/serverless detected
- **Languages:** TypeScript 1497 files (.ts 942, .tsx 555), JSX 29, MJS 9, HCL 14
- **Communication:** intra-app (Next.js server actions, TanStack `createServerFn` / file-based routes); apps share Postgres via Prisma; AWS Cognito for auth, AWS S3 for assets; no GraphQL, gRPC, OpenAPI specs, or message queues detected
- **Service directories:** `savepoint-app/`, `savepoint-tanstack/`, `infra/`
