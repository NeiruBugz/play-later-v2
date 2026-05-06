# search-games

User-intent slice for searching the IGDB game catalog.

## Layer fit

- **Layer:** `features` — wraps the IGDB search worker (`@/shared/api/igdb`) in a `createServerFn` so client UI can invoke it across the RPC bridge.
- **Imports:** `@/shared/api/igdb` (worker). No entity dependency.
- **Consumers:** add-game flow (Slice 10) — game search UI dispatches `searchGamesFn`.
- **Auth:** anonymous-allowed; mirrors the canonical app's public search route.
