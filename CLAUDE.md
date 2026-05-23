# SavePoint

SavePoint is a gaming backlog management app for gamers who want to track their game library and backlog. Users can import their Steam library, browse games via IGDB, and manage what they are playing, have completed, or plan to play.

## Architecture

Monorepo with three top-level modules:

| Module | Tech | Purpose |
|---|---|---|
| `savepoint-tanstack/` | TanStack Start v1, file-based router, Prisma, Vitest | **Primary app.** Delivered by spec 021; becomes the deployed app at cutover (Slice 24). |
| `savepoint-app/` | Next.js 16 (App Router), TypeScript, Prisma, Vitest | **Legacy app.** Retained as rollback insurance for one release cycle, then deleted in a follow-up PR. See [Legacy app appendix](#legacy-app-savepoint-app). |
| `infra/` | Terraform >= 1.5, AWS provider ~> 5.0 | Infrastructure as Code (currently Cognito + S3) |

> **Cutover status (read this).** Spec 021 migrates SavePoint from `savepoint-app/` (Next.js) to `savepoint-tanstack/` (TanStack Start). This branch *delivers* the cutover PR, but the production cutover is applied by the human operator at merge time (swap the Vercel project root to `savepoint-tanstack/` + add the prod Cognito callback). **Until that merge + Vercel root swap, production still serves `savepoint-app/`.** Both apps share the same Postgres DB and Better Auth tables, so sessions are interoperable and rollback is a one-line Vercel root swap with no data migration to undo — see [`docs/cutover-rollback.md`](./docs/cutover-rollback.md).

**Package manager**: pnpm 10 (workspace with both apps as JS packages).

For module-level details, see each module's own `CLAUDE.md`:
- `savepoint-tanstack/CLAUDE.md` — TanStack Start conventions, FSD layer map, C2 DAL pattern, foot-guns, divergence log (**primary app — start here**)
- `savepoint-tanstack/CONTEXT.md` — DAL terminology dictionary (loader-direct read, UX-hint query, privacy invariant)
- `infra/CLAUDE.md` — Module inventory, env structure, state management
- Legacy app docs (`savepoint-app/app/CLAUDE.md`, `savepoint-app/data-access-layer/CLAUDE.md`) are listed in the [Legacy app appendix](#legacy-app-savepoint-app).

## Rule files (agent-only)

Binding agent rules live at [`.claude/rules/`](./.claude/rules/) and are **auto-loaded by Claude Code** per the [path-specific rules feature](https://code.claude.com/docs/en/memory#path-specific-rules). Per-sub-project rules go in subdirectories (`tanstack/`, future: `app/`, `infra/`); each rule file carries a `paths:` frontmatter entry so it only enters context when Claude reads matching files.

Today: [`.claude/rules/tanstack/README.md`](./.claude/rules/tanstack/README.md). Same shape lands in `savepoint-app/` and `infra/` when their own audits run.

Per-layer `README.md` files describe layers for humans; rule files prescribe behavior for agents.

## Where to look first

Map from common agent tasks to the canonical source of truth in the **primary app** (`savepoint-tanstack/`). Read the linked file before editing. (For the legacy Next.js app, see the [Legacy app appendix](#legacy-app-savepoint-app).)

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
| Add a DB column / relation | Migrate in `savepoint-app/prisma/schema.prisma` first (canonical migration owner), then re-copy schema + migrations into `savepoint-tanstack/prisma/`. CI diff-checks divergence. |
| Understand the DAL (C2) pattern | `savepoint-tanstack/CLAUDE.md` § DAL conventions + `savepoint-tanstack/CONTEXT.md` |
| Understand FSD layer rules | `savepoint-tanstack/CLAUDE.md` § FSD layer map + per-layer `src/<layer>/README.md` + `.claude/rules/tanstack/` |
| Avoid known runtime/bundler traps | `savepoint-tanstack/FOOT-GUNS.md` (read before adding server fns or touching `env.ts`) |
| Run a single test file | `pnpm --filter savepoint-tanstack test:unit <path>` (jsdom, mocked Prisma) / `test:integration` (real PG, sequential) |
| Modify infra / Terraform | `infra/CLAUDE.md` (modules, env structure, state) |
| Roll back the cutover | `docs/cutover-rollback.md` |
| Find spec for a recent feature | `context/spec/NNN-<name>/` — migration is spec 021 (`context/spec/021-migrate-to-tanstack-start/`) |

## Quick Start

Run the **primary app** (`savepoint-tanstack/`):

```bash
# 1. Start local services (PostgreSQL 16 on :6432, pgAdmin on :5050, LocalStack S3 on :4568)
docker compose up -d

# 2. Install JS dependencies (workspace root)
pnpm install

# 3. Set up environment
cp savepoint-tanstack/.env.example savepoint-tanstack/.env
# Edit .env with values from terraform output or local defaults

# 4. Generate the Prisma client (migrations are owned by savepoint-app; see note below)
pnpm --filter savepoint-tanstack prisma:generate

# 5. Start dev server (port 6060)
pnpm --filter savepoint-tanstack dev
```

> **Migrations are owned by the legacy app.** `savepoint-tanstack/prisma/` mirrors `savepoint-app/prisma/`. To change the schema, run `pnpm --filter savepoint prisma migrate dev` in `savepoint-app/` first, then re-copy the schema + migration into `savepoint-tanstack/prisma/`. Both apps run against the same Postgres on `:6432`.

For `infra` setup, see `infra/CLAUDE.md` (run from `infra/envs/dev/`).

## Commands by Layer

### savepoint-tanstack (primary)

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
| Generate Prisma client | `pnpm --filter savepoint-tanstack prisma:generate` |
| Format Prisma schema | `pnpm --filter savepoint-tanstack prisma:format` |

For legacy `savepoint-app/` commands, see the [Legacy app appendix](#legacy-app-savepoint-app).

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

**Cross-layer changes**: Keep changes that span layers (e.g. `savepoint-tanstack` + `infra`, or a schema change that touches both apps) in a single branch. Do not split features into separate per-layer branches. Schema changes originate in `savepoint-app/` (the canonical migration owner) and are propagated into `savepoint-tanstack/prisma/`.

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

## Agent skills

### Issue tracker

GitHub Issues on `NeiruBugz/play-later-v2` (primary). Linear is also used for spec sync via `/awos:linear`. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical defaults (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context monorepo: `CONTEXT-MAP.md` at root points at each context's `CONTEXT.md`. The primary app's dictionary is `savepoint-tanstack/CONTEXT.md`. See `docs/agents/domain.md`.

## Legacy app (`savepoint-app/`)

`savepoint-app/` is the **legacy Next.js 16 app**. It was the deployed app prior to cutover and is **retained in the repo as rollback insurance for one release cycle** after the spec 021 cutover (Slice 24), then deleted in a follow-up PR. Do not build new features here — new work lands in `savepoint-tanstack/`. The legacy app still **owns Prisma migrations** (schema changes originate here, then propagate to `savepoint-tanstack/prisma/`).

> Note: until the cutover PR merges and the Vercel project root is swapped to `savepoint-tanstack/`, this legacy app is still the one serving production. See the [cutover status note](#architecture) above and [`docs/cutover-rollback.md`](./docs/cutover-rollback.md).

### Legacy module docs

- `savepoint-app/app/CLAUDE.md` — App Router conventions, import rules, caching
- `savepoint-app/data-access-layer/CLAUDE.md` — four-layer DAL architecture (handlers, services, repository, domain) and `Result` trip-wires (`.ok` vs `.success`)
- `savepoint-app/features/CLAUDE.md` — feature rules, cross-feature allowlist, trip-wires; ⌘K reserved for `command-palette`
- `savepoint-app/widgets/CLAUDE.md` — responsive layout map + import rules

### Legacy where-to-look

| If you want to (in the legacy app)... | Look here |
|---|---|
| Add a route / page | `savepoint-app/app/CLAUDE.md` (App Router conventions, caching, layouts) |
| Add a feature (UI + actions + hooks) | `savepoint-app/features/CLAUDE.md` — then mirror the closest existing feature |
| Add a server action | `createServerAction` from `@/shared/lib` (Zod schema + handler returning `ActionResult`) |
| Add an API route | `app/api/.../route.ts` → handler from `data-access-layer/handlers/` |
| Compose multiple services | Use-case in `features/<name>/use-cases/`. Services may NOT call other services. |
| Decode a Result return | `data-access-layer/CLAUDE.md` Trip-wires (`.ok` vs `.success` matters) |

### Legacy commands

| Task | Command |
|---|---|
| Dev server (port 7070) | `pnpm --filter savepoint dev` |
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
| Prisma migrate (canonical owner) | `pnpm --filter savepoint prisma migrate dev` |
