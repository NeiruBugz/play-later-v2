# SavePoint Monorepo

[![PR Code Quality](https://github.com/NeiruBugz/play-later-v2/actions/workflows/pr-checks-tanstack.yml/badge.svg)](https://github.com/NeiruBugz/play-later-v2/actions/workflows/pr-checks-tanstack.yml)

This repository contains two top-level modules:

- **`savepoint-tanstack/`** — **the app.** TanStack Start v1 application (Better Auth / Prisma / Vitest), delivered by [spec 021](./context/spec/021-migrate-to-tanstack-start/). This is the app you develop, run, and deploy. It owns Prisma migrations.
- **`infra/`** — Terraform 1.5+ / AWS provider ~> 5.0. Currently provisions **Cognito** (user pool + Google federation upstream) and **S3** (avatar storage, journal screenshots). The earlier ECS / RDS / ECR / Lambda surface was retired in spec 015 — the app deploys via Vercel against externally managed Postgres and a single ALB-less S3 bucket.

Getting started:

```bash
docker compose up -d        # Postgres :6432, pgAdmin :5050, LocalStack S3 :4568
pnpm install                # from the workspace root
cp savepoint-tanstack/.env.example savepoint-tanstack/.env
pnpm --filter savepoint-tanstack prisma:migrate   # apply migrations + generate client
pnpm --filter savepoint-tanstack dev   # http://localhost:6060
```

Common commands:

```bash
pnpm --filter savepoint-tanstack typecheck
pnpm --filter savepoint-tanstack lint
pnpm --filter savepoint-tanstack test            # unit + integration
pnpm --filter savepoint-tanstack test:coverage   # merged coverage report
```

Adding dependencies (always use `-E` for exact versions per project convention):

```bash
pnpm add -E package-name        # Production dependency
pnpm add -DE package-name       # Dev dependency
```

Infra quickstart is documented at [`infra/README.md`](./infra/README.md). Per-layer agent guidance lives in each layer's `CLAUDE.md`.

## AWOS Workflow

Product planning and spec-driven development is managed via AWOS commands in Claude Code. Each command is a slash command prefixed with `/awos:`.

| Command | Purpose |
|---------|---------|
| `/awos:product` | Define the product — what, why, and for whom |
| `/awos:roadmap` | Build and update the product roadmap |
| `/awos:spec` | Create a functional spec for a roadmap item |
| `/awos:tech` | Create the technical spec — how the feature will be built |
| `/awos:tasks` | Break the tech spec into vertical slices for implementation |
| `/awos:implement` | Execute tasks — delegates coding to sub-agents |
| `/awos:verify` | Verify spec completion against acceptance criteria |
| `/awos:linear` | Sync specs and tasks to Linear (auto-triggered by roadmap/spec/tasks) |
| `/awos:hire` | Find and install specialist agents, skills, and MCPs |
| `/awos:architecture` | Define the system architecture — stack, DBs, infra |
| `/awos:ai-readiness-audit` | Audit the codebase across the 11 AI-readiness dimensions |

**Typical flow:** `/awos:product` → `/awos:roadmap` → `/awos:spec` → `/awos:tech` → `/awos:tasks` → `/awos:implement` → `/awos:verify`

**Linear integration:** Specs become Linear Projects, task slices become Linear Issues. Sync state is stored in `context/spec/[index]-[name]/linear-sync.json`. The sync runs automatically at the end of `/awos:roadmap`, `/awos:spec`, and `/awos:tasks`.

**Key directories:**
- `.awos/commands/` — Command definitions
- `.awos/templates/` — Document templates
- `context/product/` — Product definition and roadmap
- `context/spec/` — Functional specs, tech specs, and task breakdowns
- `context/audits/` — Periodic `/awos:ai-readiness-audit` outputs (per-date dirs)

## Pre-commit Hooks

- Local git hooks have been removed. All code quality checks run in CI on pull requests.
- To run checks locally before pushing, run the gates from the workspace root:

```bash
pnpm --filter savepoint-tanstack typecheck \
  && pnpm --filter savepoint-tanstack lint \
  && pnpm --filter savepoint-tanstack format:check \
  && pnpm --filter savepoint-tanstack test
```
