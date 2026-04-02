# Project Topology — Audit Results

**Date:** 2026-04-01
**Score:** 100% — Grade **A**

## Results

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| TOPO-01 | Repository structure type | medium | PASS | Monorepo — 3 independent build roots: `savepoint-app/` (package.json), `lambdas-py/` (pyproject.toml), `infra/` (Terraform). pnpm workspace at root. |
| TOPO-02 | Application layer inventory | medium | PASS | 3 layers detected (see Topology Summary below) |
| TOPO-03 | Database and storage detection | medium | PASS | PostgreSQL 16 via docker-compose + Prisma ORM (47 migration files); S3 via LocalStack for intermediate CSV storage |
| TOPO-04 | Infrastructure layer detection | medium | PASS | Terraform (26 .tf files) under `infra/` with modules for Cognito, ECR, Lambda, S3, Secrets Manager, SQS |
| TOPO-05 | Language inventory | medium | PASS | TypeScript/TSX (595), SQL (47), Python (38), Terraform HCL (26), JS/MJS/CJS (6), CSS (1), Shell (1), Prisma (1) |
| TOPO-06 | Inter-layer communication patterns | medium | PASS | SQS queues (Next.js enqueues via `trigger-background-sync.ts`, Lambdas consume); S3 CSV hand-off between Lambda stages; shared PostgreSQL database across app and Lambda layers |

## Topology Summary

- **Structure:** monorepo
- **Layers:**
  - Frontend + Backend (fullstack): Next.js 15 (App Router) + Prisma ORM at `savepoint-app/` (primary language: TypeScript)
  - Data/ETL pipeline (workers): AWS Lambda (Python 3.12) + SQLAlchemy + Pydantic at `lambdas-py/` (primary language: Python)
  - Infrastructure: Terraform at `infra/` (primary language: HCL)
- **Storage:** PostgreSQL 16 with Prisma (migrations in `savepoint-app/prisma/migrations/`), S3 for intermediate pipeline CSVs (LocalStack in dev)
- **Infrastructure:** Terraform (AWS — Cognito, ECR, Lambda, S3, SQS, Secrets Manager)
- **Languages:** TypeScript/TSX (595 files), SQL (47 files), Python (38 files), Terraform HCL (26 files), JS/MJS/CJS (6 files), CSS (1 file), Shell (1 file), Prisma (1 file)
- **Communication:** SQS message queues (Next.js to Lambda pipeline), S3 CSV hand-off (between Lambda stages), shared PostgreSQL database
- **Service directories:** `savepoint-app/`, `lambdas-py/`, `infra/`
