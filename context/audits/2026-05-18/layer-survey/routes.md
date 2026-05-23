# Layer survey: routes/

## Route inventory

| File | URL | Loader shape | Component | Guarded | Notes |
| --- | --- | --- | --- | --- | --- |
| `__root.tsx` | (root) | n/a | shell + providers | n/a | Mounts QueryClient, Sonner, ErrorBoundary, sidebar slots |
| `_authed.tsx` | (group guard) | `beforeLoad: requireUserIdOrRedirectFn()` | none | Y | |
| `_authed/profile.tsx` | `/profile` | `getProfilePageDataFn` (feature) | `<ProfileOverview/>` | Y | parallel-loaded |
| `_authed/library.tsx` | `/library` | feature fn + `validateSearch(zod)` + `loaderDeps` | `<LibraryPage/>` | Y | Canonical search-param wiring |
| `_authed/settings/profile.tsx` | `/settings/profile` | feature fn | settings widget | Y | |
| `_authed/journal.tsx` | `/journal` | stub | stub | Y | S15/16 placeholder |
| `index.tsx` | `/` | none | landing widget | N | Public |
| `login.tsx` | `/login` | redirect-if-authed (beforeLoad) | auth-page widget | N | |
| `about.tsx` | `/about` | static | inline | N | |
| `games.$slug.tsx` | `/games/:slug` | `getGameDetailPageDataFn` (returns deferred Promises) | `<GameDetail/>` + Suspense + Await | N | errorComponent branches on AppError.code; inline `SectionErrorBoundary` class |
| `u.$username.tsx` | `/u/:username` | entity query (loader-direct) | `<ProfileOverview/>` | N | Privacy gate inside entity |
| `api/auth/$.ts` | `/api/auth/*` | Better Auth catch-all | — | n/a | Web Request handler |
| `dev/igdb-search.tsx` | `/dev/igdb-search` | feature fn | inline | **N** | Dev tooling, publicly reachable (drift) |

Test files (5): all use leading `-` prefix. 100% compliance.

## Dominant patterns (from code)

- **Routes are thin** — components render widgets; zero business logic.
- **Loader split** — 9/12 feature fns, 2/12 entity queries direct, 1/12 static.
- **Auth pattern** — `beforeLoad` guards via `requireUserIdOrRedirectFn()`; group-level only.
- **Search-params** — `validateSearch(zod)` + `loaderDeps` (canonical: `library.tsx`).
- **Error isolation** — both `errorComponent` (route) and inline `SectionErrorBoundary` (per-section Suspense).
- **Streamed phase-2 data** — bare `Promise<...>` from loader, rendered via `<Suspense>` + `<Await>`.
- **Test `-` prefix** — 100% compliance.
- **No upward imports.**

## Drifts

1. **No `src/routes/README.md` exists (HIGH).** All other layers have one.
2. **`/dev/igdb-search` publicly reachable (MEDIUM).** No env-gate, no auth gate.
3. **`unratedOnly` validated but not yet applied at backend (LOW).** Awaiting slice 14B.
4. **`u.$username.tsx` loader-direct entity read (LOW).** Bypasses the documented "wrap in createServerFn" pattern; works today, but inconsistency.

## Proposed rules

- Rule: routes are thin — render widgets; loaders call feature fns or entity queries; zero business logic.
- Rule: authed routes inside `_authed/`; group guard via `requireUserIdOrRedirectFn()`.
- Rule: `beforeLoad` for guards (redirects), `loader` for data.
- Rule: search params validated with Zod via `validateSearch`; reactive deps in `loaderDeps`.
- Rule: route-level errors → `errorComponent` branching on `AppError.code`; per-section → inline `SectionErrorBoundary`.
- Rule: test files use leading `-` prefix, colocated.
- Rule: `/dev/*` MUST env-gate.
- Rule: API routes are thin handler mounts; no business logic.
- Rule: loader-only reads of server-only modules wrap in a `createServerFn` exported from a non-`.server.ts` file (foot-gun #2).
- Rule: no sibling route imports.

## Draft routes/README.md

```markdown
# routes/

TanStack Router file-based routes. Files define route segments; dynamic
params use `$name`; guarded groups use `_authed/`.

## FSD position

Below `app/`, above `widgets/`/`features/`/`entities/`/`shared/`. Routes
import DOWN only.

## File shapes

| Pattern | Meaning |
| --- | --- |
| `<segment>.tsx` | Route at `/segment` |
| `$param.tsx` | Dynamic segment |
| `_authed.tsx` + `_authed/` | Auth-guarded group |
| `-<name>.test.tsx` | Colocated test (leading `-` opts out of route generation) |
| `api/<path>.ts` | API endpoint (Web Request handler) |
| `dev/<name>.tsx` | Dev-only tooling, MUST env-gate |

## Route anatomy

`Route = createFileRoute(...)({...})` exposes:

- `beforeLoad` — guards. `requireUserIdOrRedirectFn` (authed) or
  `getCurrentUserIdFn` (redirect-if-authed).
- `validateSearch` — Zod schema for search params; pair with `loaderDeps`.
- `loader` — data. Prefer feature server fns. Loader-only reads of
  server-only modules MUST wrap in `createServerFn` (foot-gun #2).
- `component` — renders widgets.
- `errorComponent` — branches on `AppError.code`.

## Auth pattern

Authed routes under `_authed/`. The group's `_authed.tsx` calls
`requireUserIdOrRedirectFn()`. No per-route checks.

## Error handling

Route errors → `errorComponent` branches on `AppError.code` (NOT_FOUND →
friendly 404; UNAUTHORIZED → redirect; default → generic surface).
Per-section Suspense → inline `SectionErrorBoundary` class.

## Dev routes

`/dev/*` MUST `env.NODE_ENV !== "production"` gate; time-scope in a comment.

## Tests

`-<name>.test.tsx` next to the route. Cover loader args, error-component
branches, beforeLoad redirects.
```
