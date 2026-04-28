# SavePoint

SavePoint is a gaming backlog management app for gamers who want to track their game library and backlog. Users can import their Steam library, browse games via IGDB, and manage what they are playing, have completed, or plan to play.

## Architecture

Monorepo with two layers:

| Layer | Tech | Purpose |
|---|---|---|
| `savepoint-app/` | Next.js 15 (App Router), TypeScript, Prisma, Vitest | Web frontend + backend API |
| `infra/` | Terraform >= 1.5, AWS provider ~> 5.0 | Infrastructure as Code (Cognito, S3, ECR, SQS, Secrets Manager) |

**Package manager**: pnpm 10 (workspace with `savepoint-app/` as the sole JS package).

For layer-specific architecture details, see each layer's own `CLAUDE.md`:
- `savepoint-app/app/CLAUDE.md` — App Router conventions, import rules, caching
- `savepoint-app/data-access-layer/CLAUDE.md` — DAL architecture (handlers, services, repository, domain)
- `infra/CLAUDE.md` — Module inventory, env structure, state management

## Where to look first

Map from common agent tasks to the canonical source of truth. Read the linked file before editing.

| If you want to... | Look here |
|---|---|
| Add a route / page | `savepoint-app/app/CLAUDE.md` (App Router conventions, caching, layouts) |
| Add a feature (UI + actions + hooks) | `savepoint-app/features/CLAUDE.md` (parent rules, allowlist, trip-wires) — then mirror the closest existing feature |
| Add a server action | `next-safe-action` `authorizedActionClient`; examples in any feature's `server-actions/` |
| Add an API route | `app/api/.../route.ts` → handler from `data-access-layer/handlers/` |
| Compose multiple services | Create a use-case in `features/<name>/use-cases/`. Services may NOT call other services. |
| Decode a Result return | `data-access-layer/CLAUDE.md` Trip-wires (`.ok` vs `.success` matters) |
| Add a DB column / relation | `savepoint-app/prisma/schema.prisma` → `pnpm --filter savepoint prisma migrate dev` |
| Add a widget | `savepoint-app/widgets/CLAUDE.md` (responsive layout map + import rules) |
| Reuse logic across features | Lift to `savepoint-app/shared/`. Cross-feature imports require allowlist entry. |
| Bind a new keyboard shortcut | `savepoint-app/widgets/CLAUDE.md` — ⌘K is reserved for `command-palette` |
| Run a single test file | `pnpm --filter savepoint test <path>` (jsdom default), `test:backend` for node, `test:utilities` for utilities |
| Modify infra / Terraform | `infra/CLAUDE.md` (modules, env structure, state) |
| Find spec for a recent feature | `context/spec/NNN-<name>/` — recent: 007, 009, 010, 011, 012, 014 (lineage in `features/CLAUDE.md`) |
| Understand caching / `use cache` | `features/CLAUDE.md` § Next.js 16 conventions |

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

**Cross-layer changes**: Keep changes that span both layers (`savepoint-app` + `infra`) in a single branch. Do not split features into separate per-layer branches.

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
