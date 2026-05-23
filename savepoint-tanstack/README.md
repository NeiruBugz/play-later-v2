# savepoint-tanstack

The SavePoint app — TanStack Start v1. Delivered by [spec 021](../context/spec/021-migrate-to-tanstack-start/) (migration from Next.js **complete**). This is the **sole, deployed app**, and it **owns the Prisma schema and migrations**.

## Quick links

- **Architecture, FSD layer map, DAL conventions, foot-guns** → [`./CLAUDE.md`](./CLAUDE.md) — start here. This README is intentionally thin; CLAUDE.md is the source of truth.
- **Why this app exists, slice-by-slice migration record** → [`../context/spec/021-migrate-to-tanstack-start/`](../context/spec/021-migrate-to-tanstack-start/) and [`./DIVERGENCES.md`](./DIVERGENCES.md).
- **Root project context** → [`../README.md`](../README.md), [`../CLAUDE.md`](../CLAUDE.md).

## Stack

| Concern            | Choice                                                                        |
| ------------------ | ----------------------------------------------------------------------------- |
| Framework          | TanStack Start v1 + TanStack Router (file-based)                              |
| Data access        | C2 pattern: thin entity queries + feature `createServerFn`s, throw `AppError` |
| Auth               | Better Auth (catch-all Web Request handler)                                   |
| Server bridge      | `createServerFn` (TanStack RPC)                                               |
| Database           | PostgreSQL via Prisma — **migrations owned here**                             |
| Storage / external | S3 for avatars/screenshots; IGDB for game data                                |
| Test runner        | Vitest (unit / integration / components) + boundary-rule regression test      |
| FSD enforcement    | `eslint-plugin-boundaries`                                                    |
| Deploy             | Vercel (Nitro)                                                                |
| Dev port           | `:6060`                                                                       |

## Getting started

This package is part of the root pnpm workspace. From the repo root:

```bash
pnpm install                                          # install workspace deps
docker compose up -d                                  # Postgres (:6432) + LocalStack S3 (:4568)
cp savepoint-tanstack/.env.example savepoint-tanstack/.env   # then fill in values
pnpm --filter savepoint-tanstack prisma:migrate       # apply migrations + generate client
pnpm --filter savepoint-tanstack dev                  # start the app on :6060
```

## Common commands

| Task                           | Command                                                  |
| ------------------------------ | -------------------------------------------------------- |
| Dev server                     | `pnpm --filter savepoint-tanstack dev`                   |
| Typecheck                      | `pnpm --filter savepoint-tanstack typecheck`             |
| Lint (incl. FSD boundary rule) | `pnpm --filter savepoint-tanstack lint`                  |
| Format check                   | `pnpm --filter savepoint-tanstack format:check`          |
| Unit tests                     | `pnpm --filter savepoint-tanstack test:unit`             |
| Integration tests              | `pnpm --filter savepoint-tanstack test:integration`      |
| Migrate (dev)                  | `pnpm --filter savepoint-tanstack prisma:migrate`        |
| Migrate (deploy)               | `pnpm --filter savepoint-tanstack prisma:migrate:deploy` |
| Generate Prisma client         | `pnpm --filter savepoint-tanstack prisma:generate`       |
| Format Prisma schema           | `pnpm --filter savepoint-tanstack prisma:format`         |

## Notes for contributors

- All env reads go through `@env` (typed via `@t3-oss/env-core`). **Never** `process.env.*` outside [`env.ts`](./env.ts) — see [foot-gun #9](./FOOT-GUNS.md#env-boundary-trap).
- `*.server.ts` is a bundler-enforced "no client imports" tag, **not** a runtime marker. `createServerFn`-wrapped feature modules must NOT use the suffix — see [foot-gun #1](./FOOT-GUNS.md#bundler-graph-traps).
- Component / file conventions (one component per folder + barrel; element/action test vocabulary; describe-given-when-then nesting) are documented in [`CLAUDE.md`](./CLAUDE.md) and enforced by review, not lint.
- TDD policy is binding: every slice is RED → GREEN → REFACTOR, with failing tests authored before implementation. Canary harness tests in [`test/canary/`](./test/canary/) and [`test/eslint/`](./test/eslint/) are load-bearing — do not delete.

## Where things are

| You want to              | Look here                                                                                                                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add a route              | [`src/routes/`](./src/routes/) (file-based)                                                                                                                                                                    |
| Add a server fn          | `src/features/<name>/api/<fn-name>.ts` (NO `.server` suffix)                                                                                                                                                   |
| Add an entity query      | `src/entities/<noun>/api/<query-name>.server.ts`                                                                                                                                                               |
| Add a composite UI block | `src/widgets/<name>/ui/...`                                                                                                                                                                                    |
| Add a shared primitive   | [`src/shared/lib/`](./src/shared/lib/) or [`src/shared/ui/`](./src/shared/ui/)                                                                                                                                 |
| Add an env var           | [`env.ts`](./env.ts) (Zod schema first, then `import { env } from "@env"`)                                                                                                                                     |
| Schema change            | **Migrations are owned here.** Edit [`prisma/schema.prisma`](./prisma/schema.prisma), then `pnpm --filter savepoint-tanstack prisma:migrate` (dev) to author + apply. Production runs `prisma:migrate:deploy`. |
