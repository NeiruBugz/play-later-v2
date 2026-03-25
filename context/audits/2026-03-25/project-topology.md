# Project Topology — Audit Results

**Date:** 2026-03-25
**Score:** 100% — Grade **A**

## Results

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| 1 | TOPO-01: Repository structure type | medium | PASS | Monorepo via pnpm workspaces (pnpm-workspace.yaml lists savepoint-app); 3 independent roots: savepoint-app (Node/Next.js), lambdas-py (Python/uv), infra (Terraform) |
| 2 | TOPO-02: Application layer inventory | medium | PASS | 3 layers detected: Next.js web app, Python Lambda functions, Terraform IaC (see Topology Summary) |
| 3 | TOPO-03: Database and storage detection | medium | PASS | Prisma ORM with schema.prisma + 46 migration files; docker-compose: PostgreSQL 16.6, LocalStack S3; AWS S3 client in app dependencies |
| 4 | TOPO-04: Infrastructure layer detection | medium | PASS | Terraform at infra/ with 29 .tf files across 2 envs (dev, prod) and 7 modules (cognito, ecr, lambda-container, lambda-imports-bucket, s3, secrets, steam-import); docker-compose.yml with 3 services |
| 5 | TOPO-05: Language inventory | medium | PASS | TypeScript/TSX: 602 files, Python: 38 files, Terraform/HCL: 29 files, SQL: 46 files, JS/MJS: 6 files, CSS: 1 file |
| 6 | TOPO-06: Inter-layer communication patterns | medium | PASS | SQS message queue between Next.js app and Python Lambdas (trigger-background-sync.ts -> SQS -> Lambda); S3 for object storage; no OpenAPI/Swagger, .proto, or GraphQL schemas found |

## Topology Summary

- **Structure:** monorepo
- **Layers:**
  - web-app: Next.js 15 (React 19, Prisma 7, NextAuth 5) at savepoint-app/ (primary language: TypeScript)
  - lambda-functions: Python 3.12 (boto3, httpx, SQLAlchemy, Pydantic) at lambdas-py/ (primary language: Python)
  - infrastructure: Terraform (AWS: Cognito, ECR, Lambda, S3, SQS, Secrets Manager) at infra/ (primary language: HCL)
- **Storage:** PostgreSQL 16.6 (Prisma ORM, 46 migrations), AWS S3 (via @aws-sdk/client-s3), LocalStack for local dev
- **Infrastructure:** Terraform (29 .tf files, 7 modules, 2 envs: dev/prod), docker-compose.yml (postgres, pgadmin, localstack)
- **Languages:** TypeScript (602 files), SQL (46 files), Python (38 files), HCL (29 files), JavaScript (6 files), CSS (1 file)
- **Communication:** AWS SQS (Next.js app triggers Lambda pipeline via SQS), AWS S3 (shared object storage)
- **Service directories:** savepoint-app, lambdas-py, infra, scripts
