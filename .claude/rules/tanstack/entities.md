---
description: Rules for the FSD `entities/` layer in savepoint-tanstack (domain queries + display UI)
paths:
  - "savepoint-tanstack/src/entities/**/*"
---
# Rules — `entities/` layer

Domain nouns. Each entity has `api/` (server-only queries that throw
`AppError`), `model/` (types + schemas), `ui/` (display-only components).
Entities compose `shared/` only.

## Rules

### Queries (`api/`)

- **Rule:** every Prisma-calling query ends in `.server.ts`. **Why:** bundler boundary (foot-gun #1) — `.server.ts` is enforced as no-client-import.
- **Rule:** every query throws an `AppError` subclass; raw `throw new Error` is forbidden except in defensive invariant checks (e.g., exhaustiveness assertions). **Why:** uniform error surface for callers and route error boundaries. See [`errors.md`](./errors.md).
- **Rule:** Prisma error mapping happens at the entity layer, narrowly scoped via `error.meta?.target`. Each unique constraint is translated to `ConflictError` in **exactly one place**. **Why:** single source of truth; features don't pre-check.
- **Rule:** privacy invariants are encoded inside the entity query that throws `NotFoundError` for both "missing" and "denied". **Why:** prevents enumeration attacks; prevents callers from accidentally exposing the distinction.
- **Rule:** UX-hint queries (e.g., `getUsernameAvailability`) carry a docstring stating they are NOT for enforcement. **Why:** prevents misuse as a precondition in feature handlers.
- **Rule:** no specialized subset queries. If query B's result is a field of aggregate A's result, delete B and read from A. **Why:** avoids "god aggregate vs. tiny query" drift.
- **Rule:** ownership checks are two-step: `findUnique({ id })` + `if (row.userId !== userId) throw NotFoundError(...)`. **Why:** features can render correct copy ("not found" vs. "forbidden") while entities throw uniformly.
- **Rule:** query functions are async even when not awaiting anything. **Why:** signature consistency at the call site.

### Models (`model/`)

- **Rule:** domain types are TS-first (`type X = Prisma.<X>WithRelations`); Zod is for input validation or genuine schema metadata only. **Why:** Prisma owns the shape; doubling with Zod creates drift.
- **Rule:** status taxonomies and enum-like shapes live in `model/<noun>.ts` with the label-resolver colocated. **Why:** one place to extend the taxonomy + its label.

### UI (`ui/`)

- **Rule:** entity UI is display-only — no mutations, no `useServerFn`, no event handlers (beyond navigation `<Link>` clicks). **Why:** mutation surfaces belong in features.
- **Rule:** entity UI lives in `entities/<noun>/ui/<component>/` with the one-folder-per-component shape. **Why:** parent CLAUDE.md convention.

### ID validation

- **Rule:** never `z.string().cuid()` for user IDs or session IDs. Use `z.string().min(1)`. **Why:** Better Auth emits 32-char nanoids, not cuids.

## Documented exceptions

### Session entity (`entities/session/api/`)

`entities/session/api/*.ts` may contain `createServerFn` wrappers (without `.server.ts` suffix) — specifically `requireUserIdOrRedirectFn`, `getCurrentUserIdFn`. This is the documented architectural carve-out: session is the access ticket, not a domain entity, and route guards need a `createServerFn` for `beforeLoad`. See [`../../../savepoint-tanstack/CONTEXT.md`](../../../savepoint-tanstack/CONTEXT.md).

## See also

- [`errors.md`](./errors.md) — `AppError` catalog + single-seam mapping
- [`server-fns.md`](./server-fns.md) — `.server.ts` discipline
- [`../../../savepoint-tanstack/CONTEXT.md`](../../../savepoint-tanstack/CONTEXT.md) — vocabulary (privacy invariant, UX-hint query, etc.)
