# SavePoint

SavePoint is a gaming backlog management app for gamers who want to track their game library and backlog. Users can import their Steam library, browse games via IGDB, and manage what they are playing, have completed, or plan to play.

## Architecture

Monorepo with two top-level modules:

| Module | Tech | Purpose |
|---|---|---|
| `savepoint-tanstack/` | TanStack Start v1, file-based router, Prisma, Vitest | **The app.** Delivered by spec 021 (migration complete); deployed via Vercel. |
| `infra/` | Terraform >= 1.5, AWS provider ~> 5.0 | Infrastructure as Code (currently Cognito + S3) |

**Package manager**: pnpm 10 (workspace).

For module-level details, see each module's own `CLAUDE.md`:
- `savepoint-tanstack/CLAUDE.md` — TanStack Start conventions, FSD layer map, C2 DAL pattern, foot-guns, divergence log (**start here**)
- `savepoint-tanstack/CONTEXT.md` — DAL terminology dictionary (loader-direct read, UX-hint query, privacy invariant)
- `infra/CLAUDE.md` — Module inventory, env structure, state management

## Rule files (agent-only)

Binding agent rules live at [`.claude/rules/`](./.claude/rules/) and are **auto-loaded by Claude Code** per the [path-specific rules feature](https://code.claude.com/docs/en/memory#path-specific-rules). Per-sub-project rules go in subdirectories (`tanstack/`, future: `app/`, `infra/`); each rule file carries a `paths:` frontmatter entry so it only enters context when Claude reads matching files.

Today: [`.claude/rules/tanstack/README.md`](./.claude/rules/tanstack/README.md). Same shape lands in `infra/` when its own audit runs.

Per-layer `README.md` files describe layers for humans; rule files prescribe behavior for agents.

## Where to look first

Map from common agent tasks to the canonical source of truth in the app (`savepoint-tanstack/`). Read the linked file before editing.

| If you want to... | Look here |
|---|---|
| Add a route / page | `savepoint-tanstack/src/routes/` (TanStack file-based; `$param` for dynamic segments, `_authed/` for guarded group) — conventions in `savepoint-tanstack/CLAUDE.md` |
| Add a server fn (mutation, authed re-fetch) | `savepoint-tanstack/src/features/<name>/api/<fn>.ts` (NO `.server` suffix) — `createServerFn` wrapper, `.inputValidator().handler()`, resolve `userId` via `requireUserId()` |
| Add an entity query (read) | `savepoint-tanstack/src/entities/<name>/api/<query>.server.ts` — plain async Prisma call, throw `AppError` on failure |
| Add a route loader (read path) | Loader-direct read calling entity queries; see `savepoint-tanstack/CONTEXT.md` § Loader-direct read (and its bundler caveat) |
| Add a composite UI block | `savepoint-tanstack/src/widgets/<name>/ui/...` |
| Add a shared primitive | `savepoint-tanstack/src/shared/lib/` or `src/shared/ui/` (shadcn primitives) |
| Reuse logic across features | Lift to `savepoint-tanstack/src/shared/` or onto an entity. No sibling-to-sibling feature imports (enforced by `eslint-plugin-boundaries`). |
| Add an env var | `savepoint-tanstack/env.ts` Zod schema first, then `import { env } from "@env"`. Never read `process.env.*` outside `env.ts`. |
| Add a DB column / relation | Edit `savepoint-tanstack/prisma/schema.prisma`, then `pnpm --filter savepoint-tanstack prisma:migrate` (dev) — migrations are owned here. |
| Understand the DAL (C2) pattern | `savepoint-tanstack/CLAUDE.md` § DAL conventions + `savepoint-tanstack/CONTEXT.md` |
| Understand FSD layer rules | `savepoint-tanstack/CLAUDE.md` § FSD layer map + per-layer `src/<layer>/README.md` + `.claude/rules/tanstack/` |
| Avoid known runtime/bundler traps | `savepoint-tanstack/FOOT-GUNS.md` (read before adding server fns or touching `env.ts`) |
| Run a single test file | `pnpm --filter savepoint-tanstack test:unit <path>` (jsdom, mocked Prisma) / `test:integration` (real PG, sequential) |
| Modify infra / Terraform | `infra/CLAUDE.md` (modules, env structure, state) |
| Roll back a deploy | `docs/cutover-rollback.md` |
| Find spec for a recent feature | `context/spec/NNN-<name>/` — migration is spec 021 (`context/spec/021-migrate-to-tanstack-start/`) |

## Quick Start

Run the app (`savepoint-tanstack/`):

```bash
# 1. Start local services (PostgreSQL 16 on :6432, pgAdmin on :5050, LocalStack S3 on :4568)
docker compose up -d

# 2. Install JS dependencies (workspace root)
pnpm install

# 3. Set up environment
cp savepoint-tanstack/.env.example savepoint-tanstack/.env
# Edit .env with values from terraform output or local defaults

# 4. Apply migrations + generate the Prisma client
pnpm --filter savepoint-tanstack prisma:migrate

# 5. Start dev server (port 6060)
pnpm --filter savepoint-tanstack dev
```

> **Migrations are owned here.** Edit `savepoint-tanstack/prisma/schema.prisma`, then run `pnpm --filter savepoint-tanstack prisma:migrate` (dev) to author + apply a migration. Production deploys run `prisma:migrate:deploy`. The app runs against Postgres on `:6432`.

For `infra` setup, see `infra/CLAUDE.md` (run from `infra/envs/dev/`).

## Commands by Layer

### savepoint-tanstack

| Task | Command |
|---|---|
| Dev server (port 6060) | `pnpm --filter savepoint-tanstack dev` |
| Test (all) | `pnpm --filter savepoint-tanstack test` |
| Test (unit, jsdom + mocked Prisma) | `pnpm --filter savepoint-tanstack test:unit` |
| Test (integration, real PG, sequential) | `pnpm --filter savepoint-tanstack test:integration` |
| Test (coverage, unit + integration merged) | `pnpm --filter savepoint-tanstack test:coverage` |
| Lint (incl. FSD boundaries) | `pnpm --filter savepoint-tanstack lint` |
| Format check | `pnpm --filter savepoint-tanstack format:check` |
| Typecheck | `pnpm --filter savepoint-tanstack typecheck` |
| Build | `pnpm --filter savepoint-tanstack build` |
| Migrate (dev) | `pnpm --filter savepoint-tanstack prisma:migrate` |
| Migrate (deploy) | `pnpm --filter savepoint-tanstack prisma:migrate:deploy` |
| Generate Prisma client | `pnpm --filter savepoint-tanstack prisma:generate` |
| Format Prisma schema | `pnpm --filter savepoint-tanstack prisma:format` |

### infra

All commands run from `infra/envs/dev/` (or `prod/`).

| Task | Command |
|---|---|
| Init | `terraform init` |
| Plan | `terraform plan` |
| Apply | `terraform apply` |

## Git Workflow

**Branch naming**: `feat/`, `fix/`, `chore/` prefixes (e.g., `feat/steam-import-pipeline`).

**Conventional commits**: enforced via commitlint (`@commitlint/config-conventional`). Messages follow the format: `type(scope): description` (e.g., `feat(library): add bulk delete`). Run `/cz` for a guided, diff-aware commit that infers type/scope and builds a commitlint-valid message.

**Cross-layer changes**: Keep changes that span layers (e.g. `savepoint-tanstack` + `infra`) in a single branch. Do not split features into separate per-layer branches.

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
| PR Code Quality | `pr-checks-tanstack.yml` | Format check, ESLint, TypeScript typecheck, unit + integration tests, migration validation (schema drift + destructive operation detection) |
| Deploy | `deploy.yml` | Production deployment (runs `prisma:migrate:deploy`) |

## Agent skills

### Issue tracker

GitHub Issues on `NeiruBugz/play-later-v2` (primary). Linear is also used for spec sync via `/awos:linear`. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical defaults (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context monorepo: `CONTEXT-MAP.md` at root points at each context's `CONTEXT.md`. The app's dictionary is `savepoint-tanstack/CONTEXT.md`. See `docs/agents/domain.md`.
