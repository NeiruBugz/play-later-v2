---
dimension: project-topology
date: 2026-05-18
---

# Project Topology — Audit Results

**Date:** 2026-05-18
**Score:** 100% — Grade **A**

## Results

| #   | Check                                | Severity | Status | Evidence |
| --- | ------------------------------------ | -------- | ------ | -------- |
| 1   | TOPO-01 Repository structure type    | medium   | PASS   | Monorepo: pnpm workspace (`pnpm-workspace.yaml`) with 2 JS packages (`savepoint-app/package.json`, `savepoint-tanstack/package.json`) plus independent Terraform root (`infra/envs/{dev,prod}/`). |
| 2   | TOPO-02 Application layer inventory  | medium   | PASS   | 4 layers detected: Next.js 15 web app (`savepoint-app/`), TanStack Start web app (`savepoint-tanstack/`, WIP per spec 021), Terraform IaC (`infra/`), local dev stack (`docker-compose.yml`). |
| 3   | TOPO-03 Database and storage         | medium   | PASS   | PostgreSQL 16 via Prisma (`savepoint-app/prisma/schema.prisma`, `savepoint-tanstack/prisma/`, migrations dirs); S3 object storage via `@aws-sdk/client-s3` (`savepoint-app/shared/lib/storage/`, `savepoint-tanstack/src/shared/api/s3.ts`) with LocalStack S3 in `docker-compose.yml`; pgAdmin admin UI. |
| 4   | TOPO-04 Infrastructure layer         | medium   | PASS   | Terraform (`infra/envs/{dev,prod}/*.tf`, `infra/modules/{cognito,s3}/`) — 14 `.tf` files; Docker Compose at repo root (`docker-compose.yml`, `.docker/`). |
| 5   | TOPO-05 Language inventory           | medium   | PASS   | TypeScript .ts: 985, .tsx: 556; JavaScript .jsx: 29, .mjs: 9; HCL/Terraform .tf: 14; Prisma .prisma: 2. No Python/Go/Rust source. |
| 6   | TOPO-06 Inter-layer communication    | medium   | PASS   | REST via Next.js Route Handlers (`savepoint-app/app/api/**/route.ts`) + Server Actions (`features/*/server-actions/`); TanStack Start uses `createServerFn` server functions; AWS SDK clients (S3, Cognito) bridge app↔infra. No OpenAPI/gRPC/GraphQL/message-queue runtime usage detected. |

## Topology Summary

- **Structure:** monorepo
- **Layers:**
  - web-frontend+backend: Next.js 15 (App Router) at `savepoint-app/` (primary language: TypeScript)
  - web-frontend+backend (WIP migration target, spec 021): TanStack Start + Vite at `savepoint-tanstack/` (primary language: TypeScript)
  - infrastructure-as-code: Terraform >= 1.5 (AWS provider ~> 5.0) at `infra/` (primary language: HCL)
  - local-dev-stack: Docker Compose (postgres:16.6, dpage/pgadmin4:9.9, localstack:3.8.1) at repo root `docker-compose.yml`
- **Storage:** relational with PostgreSQL 16 + Prisma ORM (two schemas under `savepoint-app/prisma/` and `savepoint-tanstack/prisma/`); object storage with AWS S3 (LocalStack locally) via `@aws-sdk/client-s3`
- **Infrastructure:** Terraform (modules: cognito, s3; envs: dev, prod), Docker Compose
- **Languages:** TypeScript (1541 files: 985 .ts + 556 .tsx), JavaScript (38 files: 29 .jsx + 9 .mjs), HCL/Terraform (14 .tf), Prisma schema (2 .prisma)
- **Communication:** REST via Next.js Route Handlers + Server Actions (`savepoint-app`); TanStack `createServerFn` server functions (`savepoint-tanstack`); AWS SDK (S3, Cognito) for cloud services. No OpenAPI/gRPC/GraphQL/MQ.
- **Service directories:** savepoint-app, savepoint-tanstack, infra
