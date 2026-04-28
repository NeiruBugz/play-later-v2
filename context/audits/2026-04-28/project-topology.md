# Project Topology — Audit Results

**Date:** 2026-04-28
**Score:** 100% — Grade **A**

## Results

| #   | Check                              | Severity | Status | Evidence                                                                                                                                                  |
| --- | ---------------------------------- | -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Repository structure type          | medium   | PASS   | Monorepo: 3 independent build roots — `savepoint-app/package.json`, `lambdas-py/pyproject.toml`, `infra/` (Terraform); pnpm-workspace.yaml at root        |
| 2   | Application layer inventory        | medium   | PASS   | 3 layers detected: Next.js web app (`savepoint-app/`), Python AWS Lambda pipeline (`lambdas-py/`), Terraform IaC (`infra/`)                              |
| 3   | Database and storage detection     | medium   | PASS   | PostgreSQL 16 (relational, Prisma ORM at `savepoint-app/prisma/schema.prisma` + SQLAlchemy in lambdas), S3/LocalStack (object), Upstash Redis (key-value) |
| 4   | Infrastructure layer detection     | medium   | PASS   | Terraform (`infra/envs/{dev,prod}` + 7 modules: cognito, ecr, lambda-container, lambda-imports-bucket, s3, secrets, steam-import); docker-compose.yml    |
| 5   | Language inventory                 | medium   | PASS   | TypeScript: 688 .ts + 438 .tsx, JSX: 29, Python: 38, plus HCL (Terraform .tf files)                                                                       |
| 6   | Inter-layer communication patterns | medium   | PASS   | SQS queues (Next.js → Lambda pipeline via `@aws-sdk/client-sqs`), S3 CSV intermediate files between Lambdas, REST API routes under `savepoint-app/app/api` |

## Topology Summary

- **Structure:** monorepo
- **Layers:**
  - Web app (frontend + backend API): Next.js 16 (App Router) + React 19 at `savepoint-app/` (primary language: TypeScript)
  - Data access layer: Prisma 7 + pg at `savepoint-app/data-access-layer/` (primary language: TypeScript)
  - Serverless pipeline: AWS Lambda (Python 3.12, SQLAlchemy, Pydantic, httpx) at `lambdas-py/src/lambdas/` — handlers: steam_import, igdb_enrichment, database_import, hello (primary language: Python)
  - Infrastructure-as-Code: Terraform >= 1.5 (AWS provider ~> 5.0) at `infra/` (primary language: HCL)
  - Local dev orchestration: docker-compose at repo root (PostgreSQL, pgAdmin, LocalStack)
- **Storage:** Relational with PostgreSQL 16 (Prisma ORM in app, SQLAlchemy in lambdas), Object storage with S3 (LocalStack in dev), Key-value with Upstash Redis (`@upstash/redis`, `@upstash/ratelimit`)
- **Infrastructure:** Terraform (envs: dev, prod; modules: cognito, ecr, lambda-container, lambda-imports-bucket, s3, secrets, steam-import), Docker / docker-compose, AWS Cognito (auth), AWS ECR (container images)
- **Languages:** TypeScript (1126 files: 688 .ts + 438 .tsx), Python (38 files), JSX (29 files), HCL (Terraform .tf — multiple)
- **Communication:** SQS message queues (savepoint-app enqueues → lambdas-py consumes), S3 CSV intermediate artifacts between Lambda stages, REST API routes (`savepoint-app/app/api/{auth,games,library,social,steam}`), NextAuth (Cognito provider). No OpenAPI spec, gRPC, or GraphQL detected.
- **Service directories:** `savepoint-app/`, `lambdas-py/`, `infra/`
