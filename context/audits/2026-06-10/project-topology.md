# Project Topology — Audit Results

**Date:** 2026-06-10
**Score:** 100% — Grade **A**

## Results

| #   | Check | Severity | Status | Evidence |
| --- | ----- | -------- | ------ | -------- |
| 1   | Repository structure type | medium | PASS | Monorepo: pnpm-workspace.yaml + 2 build roots — `package.json` (root, `savepoint-root`) and `savepoint-tanstack/package.json` (app); `infra/` Terraform root is a third independent unit |
| 2   | Application layer inventory | medium | PASS | Full-stack web app `savepoint-tanstack/` (TanStack Start v1, FSD layers app/routes/widgets/features/entities/shared); IaC `infra/` (Terraform); scripts `scripts/` (Node/shell tooling) |
| 3   | Database and storage detection | medium | PASS | Postgres 16 via Prisma 7 (`savepoint-tanstack/prisma/schema.prisma`, 51 migrations); S3 (`@aws-sdk/client-s3`, LocalStack in docker-compose); docker-compose services: postgres, pgadmin, localstack |
| 4   | Infrastructure layer detection | medium | PASS | Terraform (14 `.tf` files) under `infra/envs/{dev,prod,modules}` — Cognito + S3 modules; AWS provider ~> 5.0; docker-compose.yml + `.docker/` for local |
| 5   | Language inventory | medium | PASS | TypeScript 1267 (ts 822 + tsx 445), Markdown 210, SQL 51 (migrations), JSX 31, JSON 19, HCL/Terraform 14, CSS 8, mjs 5, JS 3, shell 1 |
| 6   | Inter-layer communication patterns | medium | PASS | No proto/GraphQL/OpenAPI specs. TanStack `createServerFn` RPC bridge (client↔server fns); external REST clients in `src/shared/api/`: IGDB, Steam, S3, Better Auth (Cognito OAuth) |

## Topology Summary

- **Structure:** monorepo
- **Layers:**
  - web-app (full-stack, SSR): TanStack Start v1 + React 19 + Prisma 7 at `savepoint-tanstack/` (primary language: TypeScript)
  - infrastructure (IaC): Terraform (AWS provider ~> 5.0, Cognito + S3 modules) at `infra/` (primary language: HCL)
  - tooling/scripts: Node + shell at `scripts/` (primary language: TypeScript/mjs + shell)
- **Storage:** PostgreSQL 16 (Prisma 7 ORM, `@prisma/adapter-pg`, `pg`, 51 migrations); AWS S3 (`@aws-sdk/client-s3`, LocalStack for local dev)
- **Infrastructure:** Terraform (14 `.tf` files, dev/prod envs, Cognito + S3 modules); Docker Compose (postgres, pgadmin, localstack)
- **Languages:** TypeScript (1267: ts 822, tsx 445), Markdown (210), SQL (51), JSX (31), JSON (19), HCL (14), CSS (8), mjs (5), JS (3), shell (1)
- **Communication:** TanStack Start `createServerFn` RPC bridge (client↔server boundary); external REST integrations via `src/shared/api/` — IGDB (game data), Steam (library import), S3 (presigned URLs), Better Auth/Cognito (OAuth sessions). No proto/GraphQL/OpenAPI contract specs.
- **Service directories:** savepoint-tanstack, infra, scripts
