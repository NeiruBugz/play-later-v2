# savepoint-tanstack

> **Under construction.** This app is being built per spec 021 to replace `savepoint-app/`. Until cutover (Slice 20), `savepoint-app/` is the canonical, deployed app. Do NOT modify `savepoint-app/` from work in this directory unless explicitly aligned via the spec.

## Spec

Spec 021 lives at [`../context/spec/021-migrate-to-tanstack-start/`](../context/spec/021-migrate-to-tanstack-start/):

- [`functional-spec.md`](../context/spec/021-migrate-to-tanstack-start/functional-spec.md) — what behavior must match `savepoint-app/`.
- [`technical-considerations.md`](../context/spec/021-migrate-to-tanstack-start/technical-considerations.md) — stack, DAL pattern (C2), auth wiring, env, testing.
- [`tasks.md`](../context/spec/021-migrate-to-tanstack-start/tasks.md) — slice-by-slice TDD task list. Methodology header is binding.

## Purpose

Side-by-side TanStack Start v1 rewrite of the Next.js app at `savepoint-app/`. Same Postgres database, same Better Auth tables, same S3 bucket, same IGDB client. Both apps run locally during the migration; cutover is a single Vercel root-directory change at Slice 20.

## TDD policy

Binding rule from the spec methodology header:

- Every slice lists test sub-tasks **before** implementation sub-tasks.
- Tests are authored failing first (RED), then made to pass (GREEN), then refactored.
- PR descriptions reference the failing-test commit.
- Canary harness sentinel tests live in [`test/canary/`](./test/canary/) and [`test/integration/canary.integration.test.ts`](./test/integration/canary.integration.test.ts) — do not delete them. They prove the unit + integration harnesses are wired.
- The boundary-rule regression guard at [`test/eslint/`](./test/eslint/) is also load-bearing — do not delete.

## FSD layer map

Top → bottom. Lower may not import upper.

| Layer      | Path                               | Holds                                                                                                                     |
| ---------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `app`      | [`src/app/`](./src/app/)           | Providers, root wiring, global styles, root error boundary                                                                |
| `routes`   | [`src/routes/`](./src/routes/)     | TanStack file-based routes — thin loaders + route components                                                              |
| `widgets`  | [`src/widgets/`](./src/widgets/)   | Composite UI blocks (header, profile overview, library grid)                                                              |
| `features` | [`src/features/`](./src/features/) | User-intent slices. Each has `model/`, `api/` (server fns), `ui/`                                                         |
| `entities` | [`src/entities/`](./src/entities/) | Domain nouns. Each has `model/` (zod + types), `api/` (plain async query fns throwing `AppError`), `ui/` (display-only)   |
| `shared`   | [`src/shared/`](./src/shared/)     | `lib/` (db, logger, errors, auth-client), `ui/` (shadcn primitives), `config/` (env), `api/` (S3, IGDB low-level clients) |

Per-layer guidance is in `src/<layer>/README.md`.

### Import rules

- **Direction:** `app` > `routes` > `widgets` > `features` > `entities` > `shared`. Lower never imports upper.
- **Server fns vs queries:** server fns live in `features/*/api/`; queries in `entities/*/api/`. Feature server fns compose entity queries. Entity queries never import features.
- **No sibling-to-sibling imports** inside `features/` or `entities/`. Cross-feature reuse goes through `shared/` or an `entity`.
- **Routes are thin:** loaders call entity queries directly (server-side); route components render widgets. No business logic in routes.
- Enforced by `eslint-plugin-boundaries` in [`eslint.config.mjs`](./eslint.config.mjs). Regression-guarded by [`test/eslint/`](./test/eslint/).

## DAL conventions (C2 pattern)

Two layers only — no service classes, no `Result` wrappers, no domain mappers:

1. **`entities/<noun>/api/*.server.ts`** — plain async functions. Direct Prisma calls. Throw `AppError` subclasses (`NotFoundError`, `ConflictError`, `ValidationError`, `UnauthorizedError`, `UpstreamError`) on failure. No DI, no classes.
2. **`features/<intent>/api/*.server.ts`** — thin `createServerFn` wrappers from `@tanstack/react-start`: `.validator(zodSchema).handler(async ({ data, context }) => …)`. Resolve `userId` from session inside the handler — never trust it from input. Delegate to entity queries.

Errors bubble up to the route `errorComponent` (or root error boundary in `src/app/`), which branches on `AppError.code` for user-facing copy.

**ID format:** Better Auth emits 32-char nanoid user IDs. Never use `z.string().cuid()`; use `z.string().min(1)`.

## Path aliases

From [`tsconfig.json`](./tsconfig.json):

- `@/*` → `src/*` (preferred)
- `#/*` → `src/*` (alternative — also wired in `package.json` `imports`; both resolve identically; may be consolidated later)
- `@env` → root [`env.ts`](./env.ts) (typed env from `@t3-oss/env-core`). **Never read `process.env.*` outside `env.ts`.**

## Where to look first

| If you want to...                           | Look here                                                                                                                                                                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add a route                                 | [`src/routes/`](./src/routes/) (TanStack file-based; `$param` for dynamic segments, `_authed/` for guarded group)                                                                                                                           |
| Add a server fn (mutation, authed re-fetch) | `src/features/<name>/api/<fn-name>.server.ts`                                                                                                                                                                                               |
| Add an entity query (read)                  | `src/entities/<name>/api/<query-name>.server.ts`                                                                                                                                                                                            |
| Add a composite UI block                    | `src/widgets/<name>/ui/...`                                                                                                                                                                                                                 |
| Add a shared primitive                      | [`src/shared/lib/`](./src/shared/lib/) or [`src/shared/ui/`](./src/shared/ui/)                                                                                                                                                              |
| Add an env var                              | Add to [`env.ts`](./env.ts) Zod schema first, then `import { env } from "@env"`                                                                                                                                                             |
| Schema change                               | **Don't migrate from this app.** [`prisma/schema.prisma`](./prisma/schema.prisma) is a mirror of `savepoint-app/prisma/schema.prisma`. Migrate in `savepoint-app/` first, then re-copy schema + migrations here. CI diff-checks divergence. |
| Run tests                                   | `pnpm --filter savepoint-tanstack test:unit` (jsdom, mocked Prisma) / `test:integration` (real PG, sequential)                                                                                                                              |
| Understand FSD layer rules                  | This file + per-layer `src/<layer>/README.md`                                                                                                                                                                                               |

## Quick commands

| Task                        | Command                                                             |
| --------------------------- | ------------------------------------------------------------------- |
| Dev server                  | `pnpm --filter savepoint-tanstack dev` (port 6061 — see known gaps) |
| Typecheck                   | `pnpm --filter savepoint-tanstack typecheck`                        |
| Lint (incl. FSD boundaries) | `pnpm --filter savepoint-tanstack lint`                             |
| Format check                | `pnpm --filter savepoint-tanstack format:check`                     |
| Format (write)              | `pnpm --filter savepoint-tanstack format`                           |
| Unit tests                  | `pnpm --filter savepoint-tanstack test:unit`                        |
| Integration tests           | `pnpm --filter savepoint-tanstack test:integration`                 |
| Generate Prisma client      | `pnpm --filter savepoint-tanstack prisma:generate`                  |
| Format Prisma schema        | `pnpm --filter savepoint-tanstack prisma:format`                    |

## Known gaps / pending decisions

- **Logger** not yet ported — Slice 7 decides (default: copy `savepoint-app/shared/lib/logger.ts` pino verbatim).
- **Real `db.ts`** (Prisma singleton) not yet wired — Slice 3 implements.
- **Auth** not yet wired — Slice 1 (Better Auth, no `nextCookies()` plugin).
- **Tailwind** scaffolded as v4 (CSS-first); `savepoint-app/` uses v3 (JS config). Tokens are translated, not copy-pasted verbatim.
- **No production deployment** until Slice 20 cutover. Verification is local-only until then.
