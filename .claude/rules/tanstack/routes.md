---
description: Rules for the FSD `routes/` layer in savepoint-tanstack (TanStack Router file-based routes)
paths:
  - "savepoint-tanstack/src/routes/**/*"
---
# Rules — `routes/` layer

TanStack Router file-based routes. Routes are below `app/` and above
`widgets/features/entities/shared/` in the FSD graph; import DOWN only.

## Rules

- **Rule:** routes are thin — components render widgets; loaders call feature server fns or entity queries; **zero business logic** in route files. **Why:** keeps layer scan-able; logic belongs in features.
- **Rule:** authed routes live inside `_authed/`. The group's `_authed.tsx` calls `requireUserIdOrRedirectFn()` in `beforeLoad`. **Why:** single auth-gate seam; per-route guards proliferate.
- **Rule:** `beforeLoad` is for guards (redirects); `loader` is for data. Never mix. **Why:** TanStack Router's mental model — guards short-circuit before data loads.
- **Rule:** search params validated with Zod via `validateSearch`; reactive deps declared in `loaderDeps`. **Why:** untrusted input + deep-link safety.
- **Rule:** route-level errors → `errorComponent` branching on `AppError.code`; per-section Suspense failures → inline `SectionErrorBoundary` class in the same route file. **Why:** routes own their error UX.
- **Rule:** test files use the leading `-` prefix (`-<name>.test.tsx`), colocated with the route. **Why:** TanStack file-router otherwise treats them as routes.
- **Rule:** `/dev/*` routes MUST gate on `env.NODE_ENV !== "production"` and redirect in prod. **Why:** closes accidentally-shipped dev surfaces.
- **Rule:** API routes (`/api/*`) mount Web Request handlers — no business logic in the handler file. **Why:** keep API surface a thin shim.
- **Rule:** loader-only reads of server-only modules wrap the work in a `createServerFn` exported from a non-`.server.ts` file. **Why:** foot-gun #2 — route extractor doesn't strip `.server.ts` from client preload.
- **Rule:** no sibling-to-sibling route imports. **Why:** shared logic belongs in `features/` or `widgets/`.

## Documented exceptions

None today.

## See also

- [`server-fns.md`](./server-fns.md) — what server fns the loader can call
- [`errors.md`](./errors.md) — `AppError.code` branching in `errorComponent`
- [`../../../savepoint-tanstack/FOOT-GUNS.md`](../../../savepoint-tanstack/FOOT-GUNS.md) — foot-gun #2 (loader-direct `.server.ts` hang)
