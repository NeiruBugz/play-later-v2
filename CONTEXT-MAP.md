# Context Map

SavePoint is a multi-context monorepo. This file maps each top-level context to its own `CONTEXT.md` (the domain glossary the agents speak in) and to its `CLAUDE.md` (the rule book). Read the context relevant to the topic before exploring or editing.

See [`docs/agents/domain.md`](./docs/agents/domain.md) for how the engineering skills consume these docs.

## Contexts

| Context | Role | Glossary (`CONTEXT.md`) | Rule book (`CLAUDE.md`) |
|---|---|---|---|
| `savepoint-tanstack/` | **The app** (TanStack Start v1). Delivered by spec 021 (migration complete); deployed via Vercel. Owns Prisma migrations. | [`savepoint-tanstack/CONTEXT.md`](./savepoint-tanstack/CONTEXT.md) — DAL terminology (loader-direct read, UX-hint query, privacy invariant) | [`savepoint-tanstack/CLAUDE.md`](./savepoint-tanstack/CLAUDE.md) |
| `infra/` | Terraform IaC (Cognito + S3). | _(no `CONTEXT.md` today)_ | [`infra/CLAUDE.md`](./infra/CLAUDE.md) |

## System-wide decisions

System-wide architectural decisions live in `docs/adr/` (created lazily — none recorded yet). Context-scoped decisions live under each context's own `docs/adr/` when they exist.

## Conventions

- When your output names a domain concept (issue title, refactor proposal, test name), use the term as defined in the relevant `CONTEXT.md`. Don't drift to synonyms.
- If a concept isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use, or there's a real gap to note.
- If your output contradicts an existing ADR, surface it explicitly rather than silently overriding.
