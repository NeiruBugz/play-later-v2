# Context Map

SavePoint is a multi-context monorepo. This file maps each top-level context to its own `CONTEXT.md` (the domain glossary the agents speak in) and to its `CLAUDE.md` (the rule book). Read the context relevant to the topic before exploring or editing.

See [`docs/agents/domain.md`](./docs/agents/domain.md) for how the engineering skills consume these docs.

## Contexts

| Context | Role | Glossary (`CONTEXT.md`) | Rule book (`CLAUDE.md`) |
|---|---|---|---|
| `savepoint-tanstack/` | **Primary app** (TanStack Start v1). Delivered by spec 021; becomes the deployed app at cutover (Slice 24). | [`savepoint-tanstack/CONTEXT.md`](./savepoint-tanstack/CONTEXT.md) — DAL terminology (loader-direct read, UX-hint query, privacy invariant) | [`savepoint-tanstack/CLAUDE.md`](./savepoint-tanstack/CLAUDE.md) |
| `savepoint-app/` | **Legacy app** (Next.js 16). Retained as rollback insurance for one release cycle post-cutover, then deleted in a follow-up PR. Still owns Prisma migrations. | _(no `CONTEXT.md` today)_ | [`savepoint-app/CLAUDE.md`](./savepoint-app/CLAUDE.md) and its sub-layer `CLAUDE.md` files |
| `infra/` | Terraform IaC (Cognito + S3). | _(no `CONTEXT.md` today)_ | [`infra/CLAUDE.md`](./infra/CLAUDE.md) |

> **Cutover status.** The spec 021 cutover PR is being assembled but not yet merged/deployed. Until the Vercel project root is swapped to `savepoint-tanstack/` at merge time, production still serves the legacy `savepoint-app/`. Both apps share the same Postgres DB and Better Auth tables. See the rollback runbook at [`docs/cutover-rollback.md`](./docs/cutover-rollback.md).

## System-wide decisions

System-wide architectural decisions live in `docs/adr/` (created lazily — none recorded yet). Context-scoped decisions live under each context's own `docs/adr/` when they exist (e.g. `savepoint-app/docs/adr/`).

## Conventions

- When your output names a domain concept (issue title, refactor proposal, test name), use the term as defined in the relevant `CONTEXT.md`. Don't drift to synonyms.
- If a concept isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use, or there's a real gap to note.
- If your output contradicts an existing ADR, surface it explicitly rather than silently overriding.
