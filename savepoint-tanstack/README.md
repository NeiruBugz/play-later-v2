# savepoint-tanstack

> **Under construction.** This app is the side-by-side TanStack Start v1 rewrite of [`../savepoint-app/`](../savepoint-app/), built per [spec 021](../context/spec/021-migrate-to-tanstack-start/). Until cutover at Slice 20, `savepoint-app/` is the canonical, deployed app — do **not** modify it from work in this directory unless explicitly aligned via the spec.

## Quick links

- **Architecture, FSD layer map, DAL conventions, foot-guns** → [`./CLAUDE.md`](./CLAUDE.md) — start here. This README is intentionally thin; CLAUDE.md is the source of truth.
- **Why this app exists, slice-by-slice plan, methodology** → [`../context/spec/021-migrate-to-tanstack-start/`](../context/spec/021-migrate-to-tanstack-start/).
- **Root project context** → [`../README.md`](../README.md), [`../CLAUDE.md`](../CLAUDE.md).

## What's different from `savepoint-app/`

| Concern | `savepoint-app/` | `savepoint-tanstack/` |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) | TanStack Start v1 + TanStack Router (file-based) |
| Data access | Handler → Service → Repository (DAL) | C2 pattern: thin entity queries + feature `createServerFn`s, throw `AppError` |
| Auth | Better Auth (Next.js handlers) | Better Auth (catch-all Web Request handler) |
| Server-side framework | RSC + Server Actions | `createServerFn` (TanStack RPC bridge) |
| Test runner | Vitest (3-project: unit/integration/components) | Vitest (3-project: unit/integration/components) + boundary-rule regression test |
| FSD enforcement | ESLint boundaries | `eslint-plugin-boundaries` (same shape) |
| Database, IGDB, S3, Cognito | shared via `../infra/` and externally managed services | **identical** — both apps point at the same instances during the migration |
| Dev port | `:6060` | `:6060` (swap-and-compare against same Postgres on `:6432`) |

Side-by-side parity at the same port means verification happens by stopping one app and starting the other; pixel-diff style side-by-side is deferred to the S20 cutover.

## Getting started

This package is part of the root pnpm workspace. From the repo root:

```bash
pnpm install                                    # installs both apps
docker compose up -d                            # Postgres (:6432) + LocalStack S3 (:4568)
pnpm --filter savepoint prisma migrate dev      # canonical schema migrations
                                                # tanstack schema is a CI-diff-checked mirror
pnpm --filter savepoint-tanstack dev            # starts the rewrite on :6060
```

Stop the canonical app before starting this one — both bind to `:6060`.

## Common commands

| Task | Command |
| --- | --- |
| Dev server | `pnpm --filter savepoint-tanstack dev` |
| Typecheck | `pnpm --filter savepoint-tanstack typecheck` |
| Lint (incl. FSD boundary rule) | `pnpm --filter savepoint-tanstack lint` |
| Format check | `pnpm --filter savepoint-tanstack format:check` |
| Unit tests | `pnpm --filter savepoint-tanstack test:unit` |
| Integration tests | `pnpm --filter savepoint-tanstack test:integration` |
| Generate Prisma client | `pnpm --filter savepoint-tanstack prisma:generate` |
| Format Prisma schema | `pnpm --filter savepoint-tanstack prisma:format` |

CI runs an additional Prisma schema-drift check against `../savepoint-app/prisma/schema.prisma`. If you change the schema here without also re-copying from the canonical app, CI fails.

## Notes for contributors

- All env reads go through `@env` (typed via `@t3-oss/env-core`). **Never** `process.env.*` outside [`env.ts`](./env.ts) — see [foot-gun #9 in `CLAUDE.md`](./CLAUDE.md#env-boundary-trap).
- `*.server.ts` is a bundler-enforced "no client imports" tag, **not** a runtime marker. `createServerFn`-wrapped feature modules must NOT use the suffix — see [foot-gun #1](./CLAUDE.md#bundler-graph-traps).
- Component / file conventions (one component per folder + barrel; element/action test vocabulary; describe-given-when-then nesting) are documented in [`CLAUDE.md`](./CLAUDE.md) and enforced by review, not lint.
- TDD policy is binding: every slice is RED → GREEN → REFACTOR, with failing tests authored before implementation. Canary harness tests in [`test/canary/`](./test/canary/) and [`test/eslint/`](./test/eslint/) are load-bearing — do not delete.

## Where things are

| You want to | Look here |
| --- | --- |
| Add a route | [`src/routes/`](./src/routes/) (file-based) |
| Add a server fn | `src/features/<name>/api/<fn-name>.ts` (NO `.server` suffix) |
| Add an entity query | `src/entities/<noun>/api/<query-name>.server.ts` |
| Add a composite UI block | `src/widgets/<name>/ui/...` |
| Add a shared primitive | [`src/shared/lib/`](./src/shared/lib/) or [`src/shared/ui/`](./src/shared/ui/) |
| Add an env var | [`env.ts`](./env.ts) (Zod schema first, then `import { env } from "@env"`) |
| Schema change | **Don't migrate here.** Migrate in `../savepoint-app/`, then re-copy `prisma/schema.prisma` + migrations. CI diff-checks divergence. |
