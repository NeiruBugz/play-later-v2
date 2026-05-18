---
description: AppError catalog, single-seam mapping, throw vs redirect, where errors are caught
paths:
  - "savepoint-tanstack/src/**/*.{ts,tsx}"
  - "savepoint-tanstack/test/**/*.{ts,tsx}"
---
# Rules — Errors (cross-cutting)

`AppError` taxonomy, where errors are thrown, where they're caught, the
throw-vs-redirect split, and the single-seam mapping rule.

## The `AppError` catalog

There are exactly **5 subclasses** in `src/shared/lib/errors.ts`:

| Class | `code` | Use when |
| --- | --- | --- |
| `NotFoundError` | `"NOT_FOUND"` | Record doesn't exist OR caller isn't allowed to see it (privacy invariant) |
| `ConflictError` | `"CONFLICT"` | Unique-constraint violation (e.g., username taken) |
| `ValidationError` | `"VALIDATION"` | Input shape OK but value invalid (e.g., reserved username) |
| `UnauthorizedError` | `"UNAUTHORIZED"` | No valid session for an authed endpoint |
| `UpstreamError` | `"UPSTREAM"` | External service failure (IGDB, S3, Cognito) |

- **Rule:** new `AppError` subclasses require spec review. **Why:** bounded error surface keeps route `errorComponent` branching tractable.
- **Rule:** every error thrown across layer boundaries is an `AppError` subclass. Raw `throw new Error` is reserved for defensive invariant checks (e.g., exhaustiveness assertions, unreachable branches). **Why:** uniform shape; routes can match on `.code`.

## Where errors are thrown

- **Rule:** Prisma error mapping happens at the **entity layer**, narrowly scoped via `error.meta?.target`. Each unique constraint is translated to `ConflictError` in **exactly one place**. **Why:** single source of truth; features don't pre-check.
- **Rule:** Privacy invariants throw `NotFoundError` for both "missing" and "denied". **Why:** prevents enumeration attacks; prevents callers from accidentally exposing the distinction.
- **Rule:** Input parsing failures throw `ZodError` (not `ValidationError`). Use `ValidationError` for *semantic* validation that Zod can't express (e.g., "username is reserved", "date range invalid"). **Why:** Zod errors carry their own structure; the route boundary handles `ZodError` separately.
- **Rule:** External service failures are wrapped in `UpstreamError` at the `shared/api/<service>/` boundary; downstream callers re-throw as-is. **Why:** layer responsibility.

## Where errors are caught

- **Rule:** Route `errorComponent` branches on `AppError.code` (`NOT_FOUND` → 404, `UNAUTHORIZED` → redirect to `/login`, `CONFLICT`/`VALIDATION` → inline message, default → generic). **Why:** routes own their error UX.
- **Rule:** Per-section Suspense errors (streamed `<Await>` content) are caught by an inline `SectionErrorBoundary` class component in the same route file. **Why:** failures in one section don't blow up the whole page.
- **Rule:** The root `<ErrorBoundary/>` in `__root.tsx` is the last-resort fallback for unexpected errors. Routes should NOT delegate to it for known-bad paths. **Why:** the root surface is intentionally generic; route-level UX should be specific.

## Throw vs. redirect

Auth paths use a SPECIFIC split. Don't mix:

- **Rule:** in `beforeLoad` (route guards), use `requireUserIdOrRedirectFn` from `entities/session/api/` — it calls `redirect({ to: "/login" })`. **Why:** redirects belong in guards.
- **Rule:** in a handler body (`createServerFn` handler), use `requireUserId()` from `entities/session/api/` — it throws `UnauthorizedError`. **Why:** redirects don't compose inside handlers; throws bubble up the call stack.
- **Rule:** the low-level `getServerUserId(request)` returns `string | undefined`; use it ONLY for anonymous-allowed reads (e.g., `getPublicProfile`, `checkUsername`) or for the session entity itself. **Why:** narrow exception; everywhere else, use the throw/redirect helpers.

## UX-hint vs. enforcement

- **Rule:** queries that exist purely for live UI feedback (e.g., `getUsernameAvailability`) carry a docstring stating they are **NOT** for enforcement. Feature handlers do NOT call them as preconditions. **Why:** preconditions race the DB; the entity-layer unique constraint is the only true source. UX hints are advisory.

## See also

- [`server-fns.md`](./server-fns.md) — handler error patterns
- [`entities.md`](./entities.md) — Prisma error mapping
- [`routes.md`](./routes.md) — `errorComponent` branching
- [`../../../savepoint-tanstack/CONTEXT.md`](../../../savepoint-tanstack/CONTEXT.md) — vocabulary (privacy invariant, UX-hint query)
