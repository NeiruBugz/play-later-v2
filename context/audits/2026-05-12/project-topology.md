# Project Topology — Audit Results

**Date:** 2026-05-12
**Score:** 100% — Grade **A**

## Results

| #   | Check                              | Severity | Status | Evidence |
| --- | ---------------------------------- | -------- | ------ | -------- |
| 1   | TOPO-01 Repository structure type  | medium   | PASS   | Monorepo: `pnpm-workspace.yaml` declares packages `savepoint-app`, `savepoint-tanstack`; sibling Terraform root `infra/`; 3 independent build roots |
| 2   | TOPO-02 Application layer inventory| medium   | PASS   | 3 layers detected: Next.js 16 app (`savepoint-app/`), TanStack Start app (`savepoint-tanstack/`), Terraform IaC (`infra/`) |
| 3   | TOPO-03 Database and storage       | medium   | PASS   | Postgres 16 + Prisma 7 (`savepoint-app/prisma/schema.prisma`, `savepoint-tanstack/prisma/schema.prisma`); LocalStack S3 (`docker-compose.yml`); Upstash Redis (`@upstash/redis` in savepoint-app); S3 via `@aws-sdk/client-s3` |
| 4   | TOPO-04 Infrastructure layer       | medium   | PASS   | Terraform `infra/envs/{dev,prod}/*.tf` + modules `infra/modules/{cognito,s3}`; `docker-compose.yml` at root (postgres, pgadmin, localstack) |
| 5   | TOPO-05 Language inventory         | medium   | PASS   | TypeScript 925 .ts + 551 .tsx; JavaScript 29 .jsx (root counts, excluding node_modules/dist/.next/build); HCL 14 .tf files |
| 6   | TOPO-06 Inter-layer communication  | medium   | PASS   | REST via Next.js `app/api/**/route.ts` handlers (savepoint-app); TanStack Start server functions (savepoint-tanstack); Prisma as DB contract; no OpenAPI/gRPC/GraphQL files; no message queues (no SQS/Kafka/Rabbit clients despite root CLAUDE mention) |

## Topology Summary

- **Structure:** monorepo (pnpm workspace with 2 JS packages + 1 Terraform root)
- **Layers:**
  - Web app (production): Next.js 16.2 (App Router) + React 19 + Prisma 7 + better-auth at `savepoint-app/` (primary language: TypeScript)
  - Web app (experimental, under active migration): TanStack Start 1.167 + TanStack Router + Vite 6 + Prisma 7 + better-auth at `savepoint-tanstack/` (primary language: TypeScript)
  - Infrastructure as Code: Terraform >= 1.5 with AWS provider ~> 5.0 at `infra/` (modules: cognito, s3; envs: dev, prod) (primary language: HCL)
- **Storage:**
  - Relational: PostgreSQL 16 via Prisma 7 (`@prisma/client`, `@prisma/adapter-pg`, `pg` driver) — schemas in `savepoint-app/prisma/schema.prisma` and `savepoint-tanstack/prisma/schema.prisma`
  - Object storage: AWS S3 via `@aws-sdk/client-s3` (both apps); LocalStack S3 emulator for dev (`docker-compose.yml`)
  - Key-value / rate-limit: Upstash Redis via `@upstash/redis` + `@upstash/ratelimit` (savepoint-app only)
- **Infrastructure:** Terraform (AWS provider, modules for Cognito + S3, envs dev/prod); Docker Compose (postgres-db, pgadmin, localstack); GitHub Actions workflows in `.github/workflows/` (pr-checks, deploy, e2e, integration)
- **Languages:** TypeScript (.ts 925, .tsx 551 = 1476 files), JavaScript (.jsx 29), HCL/Terraform (14 .tf files)
- **Communication:** REST/HTTP via Next.js route handlers (`savepoint-app/app/api/**/route.ts`) and server actions; TanStack Start server functions (`createServerFn`) in savepoint-tanstack; no OpenAPI/Swagger/gRPC/GraphQL/message-queue contracts detected
- **Service directories:** `savepoint-app/`, `savepoint-tanstack/`, `infra/`
- **Package managers:** pnpm 10.11.0 (workspace) for JS layers; Terraform for IaC
- **Build tooling:** Next.js + Turbopack (savepoint-app), Vite 6 + TanStack Router plugin (savepoint-tanstack), Prisma generate for both
- **Test tooling:** Vitest with projects `components`/`backend`/`utilities`/`integration` (savepoint-app); Vitest with projects `unit`/`integration` (savepoint-tanstack); Playwright e2e (savepoint-app)
- **Deploy targets:** AWS (Cognito user pool, S3 bucket via Terraform); host platform for Next.js app not declared in repo (likely Vercel given `@vercel/speed-insights` dep); GitHub Actions `deploy.yml` workflow
- **AI tooling files present:**
  - `CLAUDE.md` at root + per-layer (`savepoint-app/app/CLAUDE.md`, `savepoint-app/data-access-layer/CLAUDE.md`, `savepoint-app/features/CLAUDE.md`, `savepoint-app/widgets/CLAUDE.md`, `infra/CLAUDE.md`, `savepoint-tanstack/CLAUDE.md`)
  - `.claude/` (agents, commands, hooks, skills, settings.json, settings.local.json)
  - `.agents/skills/`
  - `.github/prompts/`
  - `.mcp.json` at root
  - `context/` directory with `spec/` (AWOS spec-first workflow) and now `audits/`
- **AWOS installation status:** Installed — `.awos/` present (commands, scripts, templates); `skills-lock.json` at root; specs under `context/spec/` (most recent: 021 TanStack migration, active); `docs/agents/` contains issue-tracker, triage-labels, domain docs
