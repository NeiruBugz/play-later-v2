---
description: Rules for createServerFn — .server.ts boundary, worker-split, validate-twice, auth
paths:
  - "savepoint-tanstack/src/features/**/api/**/*"
  - "savepoint-tanstack/src/entities/**/api/**/*"
  - "savepoint-tanstack/src/routes/**/*"
---
# Rules — `createServerFn` (cross-cutting)

The TanStack Start server-function shape, the `.server.ts` boundary, the
worker-split pattern, and the auth conventions. Read before writing any
`createServerFn`.

## The shape

```ts
export const myFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => MyInputSchema.parse(data))
  .handler(async ({ data }): Promise<MyResult> => {
    const userId = await requireUserId();          // or getServerUserId if anonymous-allowed
    const parsed = MyInputSchema.parse(data);      // validate-twice (see below)
    return myWorker(userId, parsed);               // delegate to worker if non-trivial
  });
```

## File-naming rules

- **Rule:** files containing `createServerFn` MUST NOT use the `.server.ts` suffix. **Why:** foot-gun #1 — `.server.ts` is a bundler-enforced no-client-import tag; `createServerFn` files are intentionally client-importable (the bundler stubs the handler body on the client).
- **Rule:** plain async workers (foot-gun #8 split) DO use the `.server.ts` suffix when they live under `entities/` (since entity queries are always `.server.ts`). Under `features/`, workers use `<fn-name>.worker.ts` (no `.server.ts`). **Why:** consistent with the layer's overall naming.

## Auth gates

- **Rule:** authed handlers resolve `userId` via `requireUserId()` only. **Why:** single seam for `UnauthorizedError` throw semantics.
- **Rule:** `getServerUserId(getRequest())` is reserved for (a) anonymous-allowed reads (e.g., `getPublicProfile`), (b) route guards in `entities/session/api/*.ts`. **Why:** documented narrow exceptions; using it elsewhere bypasses the auth-throw seam.
- **Rule:** the route-guard `requireUserIdOrRedirectFn` is for `beforeLoad` only (it redirects). Inside a handler body, use `requireUserId()` (it throws). **Why:** redirects don't compose inside handlers; throws do.

## Validate-twice

- **Rule:** every handler with input re-parses with the same Zod schema inside `.handler(...)`, even though `.inputValidator(...)` already parsed it. **Why:** `.inputValidator` runs only on cross-network calls; programmatic callers (other server fns, tests, route loaders calling another server fn) bypass it.
- **Rule:** the schema is a top-level `const`, exported if the worker imports it. Never inline the schema inside `inputValidator`. **Why:** the worker needs the same schema for its own validation.

## Worker-split (foot-gun #8)

When a handler does non-trivial work (DB writes, multi-step orchestration, anything that needs integration testing), split it:

```ts
// features/<name>/api/<fn-name>.worker.ts  — plain async, server-runtime-free
export const MY_INPUT = z.object({ /* ... */ });
export async function myWorker(userId: string | undefined, data: unknown): Promise<MyResult> {
  if (!userId) throw new UnauthorizedError("Sign in required");
  const parsed = MY_INPUT.parse(data);
  // ... do the work ...
}

// features/<name>/api/<fn-name>.ts  — thin createServerFn wrapper
export const myFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => MY_INPUT.parse(data))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    return myWorker(userId, data);
  });
```

- **Rule:** workers accept `userId: string | undefined` and own their own auth gate (throw `UnauthorizedError` on undefined). **Why:** tests can drive the unauthorized branch without the TanStack runtime.
- **Rule:** integration tests import the worker, not the `createServerFn` wrapper. **Why:** foot-gun #8 — the wrapper requires the Start runtime which vitest doesn't load.
- **Rule:** the worker file is colocated with its wrapper in the same `api/` folder. **Why:** discoverability — the pair lives together.

## Single-source error mapping

- **Rule:** Prisma errors are translated to `AppError` subclasses only inside entity queries, scoped via `error.meta?.target`. Handlers do not pre-check unique constraints or pre-check existence. **Why:** single source of truth; pre-checks race the DB and create false negatives. See [`errors.md`](./errors.md).

## See also

- [`errors.md`](./errors.md) — `AppError` catalog
- [`features.md`](./features.md) — server fns under `features/`
- [`entities.md`](./entities.md) — server-only queries under `entities/`
- [`../../../savepoint-tanstack/FOOT-GUNS.md`](../../../savepoint-tanstack/FOOT-GUNS.md) — foot-guns #1, #3, #8
