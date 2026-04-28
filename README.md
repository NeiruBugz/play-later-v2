# SavePoint Monorepo

[![Integration Tests (Vitest)](https://github.com/NeiruBugz/play-later-v2/actions/workflows/integration.yml/badge.svg)](https://github.com/NeiruBugz/play-later-v2/actions/workflows/integration.yml)

[![E2E Tests (Playwright)](https://github.com/NeiruBugz/play-later-v2/actions/workflows/e2e.yml/badge.svg)](https://github.com/NeiruBugz/play-later-v2/actions/workflows/e2e.yml)

This repository contains two top-level modules:

- savepoint-app: Next.js application (Auth.js/Prisma, features, tests)
- infra: Terraform infrastructure (RDS, ECS, S3, environments, modules)

Getting started with the app:

cd savepoint-app
pnpm install
pnpm dev

Adding dependencies (always use `-E` for exact versions):

pnpm add -E package-name        # Production dependency
pnpm add -DE package-name       # Dev dependency

Infra quickstart is documented at infra/README.md.

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

**Typical flow:** `/awos:product` → `/awos:roadmap` → `/awos:spec` → `/awos:tech` → `/awos:tasks` → `/awos:implement` → `/awos:verify`

**Linear integration:** Specs become Linear Projects, task slices become Linear Issues. Sync state is stored in `context/spec/[index]-[name]/linear-sync.json`. The sync runs automatically at the end of `/awos:roadmap`, `/awos:spec`, and `/awos:tasks`.

**Key directories:**
- `.awos/commands/` — Command definitions
- `.awos/templates/` — Document templates
- `context/product/` — Product definition and roadmap
- `context/spec/` — Functional specs, tech specs, and task breakdowns

## Pre-commit Hooks

- Local git hooks have been removed. All code quality checks run in CI on pull requests.
- To run checks locally before pushing, use from `savepoint-app/`:

pnpm ci:check
