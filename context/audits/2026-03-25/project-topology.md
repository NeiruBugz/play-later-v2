# Project Topology — Audit Results

**Date:** 2026-03-25
**Score:** 100% — Grade **A**

## Results

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| TOPO-01 | Repository structure type | medium | PASS | Monorepo via pnpm workspaces (pnpm-workspace.yaml); 2 independent build roots with separate package managers: savepoint-app (package.json, pnpm/Node), lambdas-py (pyproject.toml, uv/Python). infra/ contains Terraform but no independent build config. |
| TOPO-02 | Application layer inventory | medium | PASS | 4 layers detected: Next.js full-stack app, Python Lambda workers, Terraform IaC, shell scripts (see Topology Summary) |
| TOPO-03 | Database and storage detection | medium | PASS | PostgreSQL 16.6 via docker-compose + Prisma ORM (schema.prisma + 46 SQL migration files in savepoint-app/prisma/). SQLAlchemy in lambdas-py writes to same DB. S3 object storage via LocalStack (dev) and AWS (prod) for CSV pipeline and avatar uploads. |
| TOPO-04 | Infrastructure layer detection | medium | PASS | Terraform at infra/ with 29 .tf files across envs/dev, envs/prod, and 7 modules (cognito, ecr, lambda-container, lambda-imports-bucket, s3, secrets, steam-import). Docker Compose for local dev (postgres, pgadmin, localstack). |
| TOPO-05 | Language inventory | medium | PASS | TypeScript/JavaScript: 593 files, SQL: 46 files, Python: 38 files, HCL/Terraform: 29 files, CSS: 1 file, Prisma: 1 file, Shell: 1 file |
| TOPO-06 | Inter-layer communication patterns | medium | PASS | SQS: Next.js app triggers Lambda pipeline via @aws-sdk/client-sqs. S3 CSV: inter-lambda data exchange (fetch -> enrich -> import). Shared PostgreSQL: lambdas write via SQLAlchemy, app reads via Prisma. No OpenAPI/proto/GraphQL specs found. |

## Topology Summary

- **Structure:** monorepo
- **Layers:**
  - web-app: Next.js 15 (React 19, Prisma 7, NextAuth 5, TanStack Query) at savepoint-app/ (primary language: TypeScript)
  - lambda-workers: Python 3.12 (boto3, httpx, SQLAlchemy, Pydantic) at lambdas-py/ (primary language: Python)
  - infrastructure: Terraform (AWS: Cognito, ECR, Lambda, S3, Secrets Manager) at infra/ (primary language: HCL)
  - scripts: Shell utilities at scripts/ (primary language: Shell)
- **Storage:** PostgreSQL 16.6 with Prisma ORM (app) and SQLAlchemy (lambdas), AWS S3 via @aws-sdk/client-s3 and boto3, LocalStack for local dev
- **Infrastructure:** Terraform (29 .tf files, 7 modules, 2 envs: dev/prod), docker-compose.yml (postgres, pgadmin, localstack)
- **Languages:** TypeScript/JavaScript (593 files), SQL (46 files), Python (38 files), HCL (29 files), CSS (1 file), Prisma (1 file), Shell (1 file)
- **Communication:** AWS SQS (app triggers lambda pipeline), S3 CSV files (inter-lambda data exchange), shared PostgreSQL (lambdas write, app reads)
- **Service directories:** savepoint-app, lambdas-py, infra, scripts
