# SavePoint

SavePoint is a gaming backlog management app for gamers who want to track their game library and backlog. Users can import their Steam library, browse games via IGDB, and manage what they are playing, have completed, or plan to play.

## Architecture

Monorepo with three layers:

| Layer | Tech | Purpose |
|---|---|---|
| `savepoint-app/` | Next.js 15 (App Router), TypeScript, Prisma, Vitest | Web frontend + backend API |
| `lambdas-py/` | Python 3.12, uv, SQLAlchemy, Pydantic | AWS Lambda pipeline (Steam import, IGDB enrichment, DB write) |
| `infra/` | Terraform >= 1.5, AWS provider ~> 5.0 | Infrastructure as Code (Cognito, S3, ECR, Lambda, SQS, Secrets Manager) |

**Cross-layer communication**: SQS queues trigger Lambda pipelines. Lambdas exchange intermediate data via S3 CSV files. All layers share a PostgreSQL database. The Next.js app enqueues SQS messages to kick off the Lambda pipeline.

**Package manager**: pnpm 10 (workspace with `savepoint-app/` as the sole JS package). Python layer uses `uv`.

For layer-specific architecture details, see each layer's own `CLAUDE.md`:
- `savepoint-app/app/CLAUDE.md` — App Router conventions, import rules, caching
- `savepoint-app/data-access-layer/CLAUDE.md` — DAL architecture (handlers, services, repository, domain)
- `lambdas-py/CLAUDE.md` — Lambda inventory, pipeline flow, critical gotchas
- `infra/CLAUDE.md` — Module inventory, env structure, state management

## Quick Start

```bash
# 1. Start local services (PostgreSQL 16 on :6432, pgAdmin on :5050, LocalStack S3 on :4568)
docker compose up -d

# 2. Install JS dependencies
pnpm install

# 3. Set up environment
cp savepoint-app/.env.example savepoint-app/.env.local
# Edit .env.local with values from terraform output or local defaults

# 4. Run database migrations
pnpm --filter savepoint prisma migrate dev

# 5. Start dev server (port 6060)
pnpm --filter savepoint dev
```

For `lambdas-py` setup, see `lambdas-py/CLAUDE.md` (uses `uv sync --all-extras`).
For `infra` setup, see `infra/CLAUDE.md` (run from `infra/envs/dev/`).

## Commands by Layer

### savepoint-app

| Task | Command |
|---|---|
| Dev server | `pnpm --filter savepoint dev` |
| Test (all) | `pnpm --filter savepoint test` |
| Test (components) | `pnpm --filter savepoint test:components` |
| Test (backend) | `pnpm --filter savepoint test:backend` |
| Test (utilities) | `pnpm --filter savepoint test:utilities` |
| Test (e2e) | `pnpm --filter savepoint test:e2e` |
| Lint | `pnpm --filter savepoint lint` |
| Format check | `pnpm --filter savepoint format:check` |
| Typecheck | `pnpm --filter savepoint typecheck` |
| Build | `pnpm --filter savepoint build` |
| All CI checks | `pnpm --filter savepoint ci:check` |
| Auto-fix lint+format | `pnpm --filter savepoint ci:fix` |

### lambdas-py

All commands run from `lambdas-py/`. Always use `uv run` prefix.

| Task | Command |
|---|---|
| Install | `uv sync --all-extras` |
| Test (all) | `uv run pytest` |
| Test (unit) | `uv run pytest -m unit` |
| Lint | `uv run ruff check src/` |
| Type check | `uv run mypy src/` |

### infra

All commands run from `infra/envs/dev/` (or `prod/`).

| Task | Command |
|---|---|
| Init | `terraform init` |
| Plan | `terraform plan` |
| Apply | `terraform apply` |

## Git Workflow

**Branch naming**: `feat/`, `fix/`, `chore/` prefixes (e.g., `feat/steam-import-pipeline`).

**Conventional commits**: enforced via commitlint (`@commitlint/config-conventional`). Messages follow the format: `type(scope): description` (e.g., `feat(library): add bulk delete`).

**Cross-layer changes**: Keep changes that span multiple layers (e.g., `savepoint-app` + `lambdas-py` + `infra`) in a single branch. Do not split features into separate per-layer branches.

## Spec-First Workflow

New features require a spec in `context/spec/` before implementation begins.

**Workflow sequence**:
1. `/awos:spec` — Write the feature spec
2. `/awos:tech` — Define technical approach
3. `/awos:tasks` — Break into implementation tasks
4. `/awos:implement` — Implement slice by slice

Feature branches use the `feat/` prefix and reference the spec directory in the first commit message.

## CI Overview

All workflows run on PRs targeting `main`.

| Workflow | File | What it checks |
|---|---|---|
| PR Code Quality | `pr-checks.yml` | Format check, ESLint, TypeScript typecheck, component/backend/utilities tests, migration validation (schema drift + destructive operation detection) |
| Deploy | `deploy.yml` | Production deployment |
| E2E | `e2e.yml` | End-to-end Playwright tests |
| Integration | `integration.yml` | Integration test suite |
