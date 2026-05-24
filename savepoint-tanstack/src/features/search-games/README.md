# search-games

User-intent slice for searching the IGDB game catalog.

## Layer fit

- **Layer:** `features` — wraps the IGDB search worker (`@/shared/api/igdb`) in a `createServerFn` so client UI can invoke it across the RPC bridge.
- **Imports:** `@/shared/api/igdb` (worker). No entity dependency.
- **Consumers:** add-game flow (Slice 10) — game search UI dispatches `searchGamesFn`.
- **Auth:** anonymous-allowed; mirrors the canonical app's public search route.

## Conventions

- **Search server fn lives at the entity layer.** The single source of truth for `searchGamesFn` (and `SEARCH_GAMES_INPUT`) is `@/entities/game/api/search-games`. Feature modules import downward from the entity rather than from each other (FSD: no cross-feature sibling imports). `api/search-games.ts` is a thin re-export kept only so this feature's UI can reference `../api/search-games` without a path change.
- **Worker-split for non-trivial server fns.** `searchLibraryAwareGamesFn` delegates to `search-library-aware-games.worker.ts` (plain async, `userId: string | undefined`); integration tests import the worker, not the `createServerFn` wrapper (foot-gun #8).
- **Anonymous-allowed handlers resolve `userId` via `getServerUserId(getRequest())`** (returns `undefined` when signed out), not `requireUserId()` — search needs no auth; only the library-state annotation does.
