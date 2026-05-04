# ADR: API handlers and server actions share one error classifier

**Status**: Proposed
**Date**: 2026-04-30
**Deciders**: Nail Badiullin
**Related**: [DAL_TYPED_THROW.md](./DAL_TYPED_THROW.md), [USE_CASE_PATTERN.md](./USE_CASE_PATTERN.md), [data-access-layer/handlers/CLAUDE.md](../../savepoint-app/data-access-layer/handlers/CLAUDE.md)

## Context

After [DAL_TYPED_THROW](./DAL_TYPED_THROW.md), services and repositories throw typed errors and edges catch them. Two edges exist between the UI and the service layer:

- **API route handlers** (`data-access-layer/handlers/*`) — invoked from `app/api/**/*.ts`. Catch typed errors and call `mapErrorToHandlerResult` to produce `HandlerResult<T>` with HTTP status + headers.
- **Server actions** (`features/*/server-actions/*`) — invoked from RSC/Client components. Wrapped by `createServerAction` from `shared/lib/server-action/`. Today's `catch` block stringifies any thrown error into `ActionResult.error: string` with no status awareness.

The two edges diverged on **typed-error fidelity**. `mapErrorToHandlerResult` knew about `NotFoundError`, `RateLimitError`, `ExternalServiceError`, etc. and mapped each to a distinct status. `createServerAction` did not — every typed throw became a generic `error: string`, forcing form callers to regex-match messages or treat all failures the same.

Each handler also reinvented the same scaffolding by hand: parse Zod schema, resolve `userId`, optionally enforce a rate limit, `try`/`catch` around the service call, call `mapErrorToHandlerResult`. Per-handler error overrides (e.g. `SteamProfilePrivateError → 403` in `fetch-steam-games.handler.ts`) were inline `instanceof` ladders before the catch-all, duplicating knowledge that arguably belongs on the error class itself.

A survey of 8 handlers found ~70-80% of each file was scaffolding; the remaining work was a single service call. A survey of `createServerAction` found 65 lines doing the same scaffolding job for actions, but with weaker error translation.

## Decision

Treat handlers and server actions as **two adapters at one seam** between UI and services. Both share a single deep module for error classification; neither owns business policy.

**1. Extract `classifyError` as the source of truth.**

`shared/lib/errors/classify.ts` exposes a pure function:

```ts
type Classified = {
  status: number
  code: string                  // error.constructor.name
  message: string
  context?: Record<string, unknown>
  retryAfter?: number
}
function classifyError(error: unknown): Classified
```

The status mapping table that today lives inside `data-access-layer/handlers/map-error.ts` moves here. `mapErrorToHandlerResult` becomes a thin HTTP adapter calling `classifyError`. A new `mapErrorToActionResult` does the action-shaped equivalent.

**2. Status of a typed error is a property of the error class.**

`DomainError` gains an optional `defaultStatus` field. `SteamProfilePrivateError` sets it to 403. `classifyError` reads `error.defaultStatus` before the `instanceof` ladder. Per-handler error overrides go away — knowledge of "this error means 403" lives with the error class, not the endpoint.

**3. `ActionResult` gains a `code` field.**

Failure shape becomes `{ success: false, error: string, code: string }` where `code` is `error.constructor.name` (e.g. `"NotFoundError"`, `"ConflictError"`). Form UIs branch on `code`; existing consumers reading `error: string` are unaffected.

**4. Both adapters get a wrapper factory; each owns identity and translation only.**

```ts
createApiHandler({ name, schema, requireAuth, handler })   // → (input, ctx) => HandlerResult<T>
createServerAction({ name, schema, requireAuth, handler }) // → (input) => ActionResult<T>  (existing, rewired)
```

Both wrappers own:

- Input parsing (Zod throws `ZodError` → classifier maps to 400)
- Identity resolution (`requireAuth: true` → throws `UnauthorizedError` → classifier maps to 401)
- `try`/`catch` around the inner handler
- Translation through their adapter

Both wrappers explicitly do NOT own:

- **Authorization (RBAC)** — services own "can THIS user do THIS thing"
- **Rate limiting** — opt-in `enforceRateLimit({...})` helper called inside the handler body when needed (mostly third-party guards: IGDB, Steam). Throws `RateLimitError` → classifier maps to 429.
- **Caching** — Next.js `"use cache"` is a parse-time directive that cannot be applied dynamically by a closure. Cached reads use a top-level `defineCachedRead` helper or stay inline at the route.

**5. Handler bodies throw.**

Inside the wrapper, the handler function may throw typed errors freely. The `data-access-layer/handlers/CLAUDE.md` line listing "Throwing errors (return HandlerResult with status)" as a mistake is reversed: the wrapper catches throws; only the outer wrapped function returns `HandlerResult`.

## Considered alternatives

- **Middleware pipeline** (`pipe(withSchema, withAuth, withRateLimit, withErrorMapping)`). Rejected: order matters and is a footgun; readers must learn the pipe convention; the codebase has no other use of this pattern.
- **No wrapper, just shared building blocks**. Rejected: leaves the per-handler scaffolding intact. The wrapper's value is concentrating the four UI↔service edge concerns (parse, identity, catch, translate) into one named module. Helpers without a wrapper still leave each handler reinventing the same `try/catch/mapError` boilerplate.
- **One wrapper returning a discriminated union of `HandlerResult | ActionResult`**. Rejected: the two return shapes diverge on `status`/`headers`, which are meaningless to a server action. Two adapters mirror-shaped is clearer than one wrapper that branches on caller type.
- **Per-handler `errorOverrides` hook on the wrapper**. Rejected in favour of `defaultStatus` on the error class. Per-endpoint overrides would mean the same typed error maps to different statuses in different routes — no real example of this exists in the codebase.

## Consequences

- The classifier is the single place to change status mapping. Both edges stay in lock-step.
- Server actions gain typed-error awareness. Form code can `switch (result.code)` instead of regex-matching `result.error`.
- Handler files shrink to ~15 lines of their own logic. Cross-handler variation (rate-limit, cache) stays explicit at the call site, not buried in wrapper config.
- `data-access-layer/handlers/CLAUDE.md` and `data-access-layer/CLAUDE.md` need updating: handler bodies now throw; wrappers catch.
- The `getStatusCountsHandler` export in `handlers/index.ts` has no caller and is removed alongside this work.
- This decision does not loosen the no-service-to-service rule from `USE_CASE_PATTERN.md`. Composition still happens in use-cases.
