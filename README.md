# SavePoint Monorepo

[![Integration Tests (Vitest)](https://github.com/NeiruBugz/play-later-v2/actions/workflows/integration.yml/badge.svg)](https://github.com/NeiruBugz/play-later-v2/actions/workflows/integration.yml)

[![E2E Tests (Playwright)](https://github.com/NeiruBugz/play-later-v2/actions/workflows/e2e.yml/badge.svg)](https://github.com/NeiruBugz/play-later-v2/actions/workflows/e2e.yml)

This repository contains three top-level modules:

- **`savepoint-tanstack/`** — **the primary app.** TanStack Start v1 application (Better Auth / Prisma / Vitest), delivered by [spec 021](./context/spec/021-migrate-to-tanstack-start/). This is the app you develop and run. It becomes the deployed app at cutover (Slice 24).
- **`savepoint-app/`** — **legacy** Next.js 16 application. It was the deployed app before cutover and is retained as rollback insurance for one release cycle, then deleted in a follow-up PR. It still owns Prisma migrations (schema changes originate here, then propagate to `savepoint-tanstack/prisma/`). Don't build new features here.
- **`infra/`** — Terraform 1.5+ / AWS provider ~> 5.0. Currently provisions **Cognito** (user pool + Google federation upstream) and **S3** (avatar storage, journal screenshots). The earlier ECS / RDS / ECR / Lambda surface was retired in spec 015 — both apps deploy via Vercel against externally managed Postgres and a single ALB-less S3 bucket.

> **Cutover status.** Spec 021 migrates SavePoint from `savepoint-app/` (Next.js) to `savepoint-tanstack/` (TanStack Start). The cutover PR is being assembled; the production switch (swapping the Vercel project root to `savepoint-tanstack/` and adding the prod Cognito callback) is performed by the operator when the PR merges. **Until then, production still serves `savepoint-app/`.** Both apps share the same Postgres DB and Better Auth tables, so rollback is a one-line Vercel root swap with no data migration to undo — see [`docs/cutover-rollback.md`](./docs/cutover-rollback.md).

Getting started with the primary app:

```bash
docker compose up -d        # Postgres :6432, pgAdmin :5050, LocalStack S3 :4568
pnpm install                # from the workspace root
cp savepoint-tanstack/.env.example savepoint-tanstack/.env
pnpm --filter savepoint-tanstack prisma:generate
pnpm --filter savepoint-tanstack dev   # http://localhost:6060
```

Common commands:

```bash
pnpm --filter savepoint-tanstack typecheck
pnpm --filter savepoint-tanstack lint
pnpm --filter savepoint-tanstack test            # unit + integration
pnpm --filter savepoint-tanstack test:coverage   # merged coverage report
```

The legacy app runs on port `7070`:

```bash
pnpm --filter savepoint dev   # http://localhost:7070
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
- To run checks locally before pushing, run the primary app's gates from the workspace root:

```bash
pnpm --filter savepoint-tanstack typecheck \
  && pnpm --filter savepoint-tanstack lint \
  && pnpm --filter savepoint-tanstack format:check \
  && pnpm --filter savepoint-tanstack test
```

For the legacy app, run `pnpm --filter savepoint ci:check`.
