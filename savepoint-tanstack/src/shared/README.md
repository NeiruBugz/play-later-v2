# shared layer

Infrastructure primitives shared across all layers. No domain logic lives here.

## Import rules

- May NOT import from any other layer
- May be imported from any layer

## Subdirectories

| Dir       | Contents                                                                     |
| --------- | ---------------------------------------------------------------------------- |
| `lib/`    | Prisma singleton (`db`), logger (pino), `AppError` taxonomy, auth instance   |
| `ui/`     | Stock shadcn `base-maia` primitives (Base UI) and repo-owned base components |
| `config/` | Zod-validated env (`env` from `@env`)                                        |
| `api/`    | Low-level external clients: S3, IGDB — no business logic                     |

## Styling

Design tokens (color, radius, fonts) live in `src/styles.css`; there is no custom spacing, type or shadow layer. Primitives in `ui/` are the stock `shadcn view` output (style `base-maia`, pulled in a scratch directory, never `shadcn init` or `apply` in the repo). Deliberate deviations are listed in [`ui/README.md`](./ui/README.md). Lint (`eslint-plugin-better-tailwindcss`) rejects unknown, conflicting and retired classes.

## Key rule

`shared` has no slices. It is organised directly into segments. Never add domain-specific code here — if logic belongs to a business domain, it goes in `entities` or `features`.

## IGDB client behaviour

Every IGDB call goes through `igdbFetch` (`api/igdb/fetch.ts`):

- **Bounded:** each attempt aborts after 8 s.
- **One recovery retry:** a 401 refreshes the Twitch token and retries; a 429 waits 300–600 ms and retries. A second failure surfaces as `IgdbHttpError` → `UpstreamError` at the public wrapper.
- **Cached per server instance** (`api/igdb/response-cache.ts`): successful responses are kept 10 min (LRU, 500 entries) keyed by resource + query, and identical concurrent calls share one request. Failures are never cached. The cache is in-process, so it absorbs repeats within a warm instance (hover preload → click, loader re-runs after a mutation), not across Vercel instances. Tests reset it in `test/setup/*` `beforeEach`.
