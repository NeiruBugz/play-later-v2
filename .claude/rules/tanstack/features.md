---
description: Rules for the FSD `features/` layer in savepoint-tanstack (user-intent slices)
paths:
  - "savepoint-tanstack/src/features/**/*"
---
# Rules — `features/` layer

User-intent slices. Each feature has `api/` (server fns + workers),
`model/` (schemas + types), `ui/` (components). Features compose entities
and shared; they do NOT import each other.

## Rules

### Structure

- **Rule:** submodules — `api/` for server fns + workers, `model/` for schemas + types, `ui/` for components, `lib/` for pure helpers. **Why:** consistent discovery across features.
- **Rule:** every feature exposes a public barrel at `features/<name>/index.ts` re-exporting only the consumer-facing surface (UI components, optional server-fn names). Internal modules (workers, schema impls) are not re-exported. **Why:** enforces a clear feature contract.
- **Rule:** feature UI lives in `features/<name>/ui/<component-name>/` with the one-folder-per-component shape. **Why:** parent CLAUDE.md convention.

### Imports

- **Rule:** no sibling-to-sibling feature imports. Period. **Why:** FSD direction; cross-feature reuse goes through entities or shared.
- **Rule:** feature UI invokes its own server fns via `useServerFn`; never another feature's server fn. **Why:** FSD direction; cross-feature flows go through routes.
- **Rule:** mutation surfaces (forms, modals, action buttons) live in features. Pure display surfaces (covers, badges, status strips) live in entities. **Why:** layer responsibility — entities are display-only.

### Server fns

See [`server-fns.md`](./server-fns.md) for the full ruleset. Per-feature highlights:

- **Rule:** feature server fns live in `features/<name>/api/<fn-name>.ts` (NO `.server` suffix). **Why:** foot-gun #1 — `.server.ts` is a bundler boundary that breaks `createServerFn`.
- **Rule:** non-trivial handlers export `<fn-name>.worker.ts` (plain async, `userId | undefined` arg); the `createServerFn` wrapper delegates to the worker. **Why:** foot-gun #8 — integration tests need a server-runtime-free import path.

### Tests

- **Rule:** every feature has a colocated UI test using the elements/actions/given-when-then convention. **Why:** regression safety + agent template. See [`testing.md`](./testing.md).
- **Rule:** integration tests for worker-split features import the worker directly, not the `createServerFn` wrapper. **Why:** foot-gun #8 — the wrapper requires the TanStack Start runtime.

## Documented exceptions

None today. The previously-flagged `game-detail → browse-related-games` cross-feature import was lifted to `entities/game/api/` (2026-05-18 audit follow-up).

## See also

- [`server-fns.md`](./server-fns.md) — full `createServerFn` rules
- [`testing.md`](./testing.md) — test conventions
- [`entities.md`](./entities.md) — what to use entities for vs. features
- [`../../../savepoint-tanstack/FOOT-GUNS.md`](../../../savepoint-tanstack/FOOT-GUNS.md) — foot-guns #1 (`.server.ts`) and #8 (worker-split)
