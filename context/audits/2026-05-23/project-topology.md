# Project Topology — Audit Results

**Date:** 2026-05-23
**Score:** 100% — Grade **A**

## Results

| #   | Check | Severity | Status | Evidence |
| --- | ----- | -------- | ------ | -------- |
| 1   | Repository structure type | medium | PASS | Monorepo: 2 independent build roots — `savepoint-tanstack/package.json` (pnpm workspace member) + `infra/` (14 `.tf` files, Terraform). pnpm-workspace.yaml lists `savepoint-tanstack`. |
| 2   | Application layer inventory | medium | PASS | 2 layers: (a) Frontend+Backend app `savepoint-tanstack/` (TanStack Start v1, React 19, TS) with FSD layers `app/entities/features/widgets/shared/routes`; (b) IaC `infra/` (Terraform/AWS). `savepoint-app/` (old Next.js) confirmed REMOVED. |
| 3   | Database and storage detection | medium | PASS | PostgreSQL 16 via Prisma (`schema.prisma` provider=postgresql, 50 migrations); docker-compose: postgres:16.6 (:6432), LocalStack S3 (:4568). S3 object storage via `@aws-sdk/client-s3` (`src/shared/api/s3.server.ts`). |
| 4   | Infrastructure layer detection | medium | PASS | Terraform `>= 1.5.0`, AWS provider `~> 5.0`; envs dev/prod + modules cognito & s3 (14 `.tf`). Docker Compose for local services. CI: `.github/workflows/deploy.yml`, `pr-checks-tanstack.yml`. Deployed via Vercel (per CLAUDE.md). |
| 5   | Language inventory | medium | PASS | TypeScript dominant (740 .ts + 411 .tsx repo-wide; 477 .ts + 259 .tsx in app `src/`), HCL/Terraform (14 .tf), 1 Prisma schema, 5 .mjs, 3 .css, 1 .sh. (29 .jsx are spec mockups, not app source.) |
| 6   | Inter-layer communication patterns | medium | PASS | TanStack Start RPC via `createServerFn` (52 files in `src/`); better-auth (`auth-client.ts` ↔ `auth.server.ts`); external HTTP APIs IGDB + Steam; AWS SDK to S3/Cognito. No OpenAPI/proto/GraphQL contracts (matches found were prior audit docs only). |

## Topology Summary

- **Structure:** monorepo (2 independent build roots: pnpm workspace `savepoint-tanstack` + Terraform `infra`)
- **Layers:**
  - frontend + backend (full-stack): TanStack Start v1 (React 19, Vite 8, file-based router, FSD architecture) at `savepoint-tanstack/` (primary language: TypeScript)
  - data access / ORM: Prisma 7 (`@prisma/adapter-pg`, `pg`) within `savepoint-tanstack/prisma/` (primary language: Prisma schema + TypeScript)
  - infrastructure (IaC): Terraform / AWS provider ~> 5.0 at `infra/` (modules: Cognito, S3) (primary language: HCL)
- **Storage:** PostgreSQL 16 (Prisma, 50 migrations, port 6432); AWS S3 / LocalStack object storage (avatars via presigned URLs, port 4568)
- **Infrastructure:** Terraform (>= 1.5.0, AWS ~> 5.0; dev + prod envs, cognito + s3 modules); Docker Compose (postgres, pgadmin, localstack); Vercel deploy; GitHub Actions (deploy.yml, pr-checks-tanstack.yml)
- **Languages:** TypeScript (740 .ts), TSX (411 .tsx), HCL/Terraform (14 .tf), JSX (29 — spec mockups only, non-source), MJS (5), Prisma (1 schema), CSS (3), Shell (1)
- **Communication:** TanStack Start server functions (`createServerFn`, 52 files) for client↔server RPC; better-auth (auth client ↔ auth.server); external HTTP integrations (IGDB, Steam); AWS SDK (S3, Cognito). No OpenAPI/gRPC/GraphQL contracts.
- **Service directories:** `savepoint-tanstack/`, `infra/`

## Notes for downstream dimensions

- `savepoint-app/` (former Next.js app from before spec 021) is fully removed — the only application layer is `savepoint-tanstack/`. Do not audit a Next.js layer.
- App source convention: `*.server.ts` is a bundler "no client imports" boundary; `createServerFn` files do NOT use `.server` suffix.
- Migrations are owned in `savepoint-tanstack/prisma/migrations/` (50 dirs).
- Env access is centralized via `savepoint-tanstack/env.ts` (Zod schema); `process.env.*` should not appear outside it.
