# Vercel deployment runbook — savepoint-tanstack

How to deploy the TanStack Start app (`savepoint-tanstack/`) to Vercel. Read
this with [`../CLAUDE.md`](../CLAUDE.md) and [`../FOOT-GUNS.md`](../FOOT-GUNS.md).

## How the build produces a deployable artifact

- The app builds with Vite: `pnpm --filter savepoint-tanstack build` (script
  `build` = **`prisma generate && vite build`**).
- **Prisma client is generated as part of the build.** The generator outputs to
  the source tree (`shared/lib/prisma/`, per `prisma/schema.prisma`
  `output = "../shared/lib/prisma"`), which is **gitignored** — so a fresh
  checkout (every Vercel build) has no client until generated. Folding
  `prisma generate` into `build` guarantees it exists before bundling.
  `prisma.config.ts` loads `.env` locally and requires
  `POSTGRES_URL_NON_POOLING` (or `POSTGRES_PRISMA_URL`) at config-load — even
  though generate never connects — so **that DB URL must be present in the
  Vercel build environment** (it is, if set for the deploying environment; see
  Required environment variables).
- `vite.config.ts` runs `tanstackStart()` **then** `nitro()` (the `nitro/vite`
  plugin from the `nitro` package). Nitro is the agnostic server layer
  TanStack Start v1 deploys through — without it, `vite build` only emits
  `dist/client` + `dist/server` and the `start` script (`node
.output/server/index.mjs`) has nothing to run.
- With `nitro()` present, the build also emits `.output/` containing
  `.output/server/index.mjs` (the server entry the `start` script runs) and
  `.output/nitro.json` (records the selected preset).
- `@tanstack/react-start@1.168.6` does **not** bundle Nitro transitively, so
  the `nitro` package is a direct, exact-pinned dependency
  (`nitro@3.0.260522-beta`, the current `nitro` v3 line; peer on
  `vite@^7 || ^8`, all other peers optional).

## How Nitro selects the deployment preset

Nitro auto-detects its preset from the build environment:

- **Locally / CI without `VERCEL`:** defaults to the `node-server` preset →
  `.output/server/index.mjs`, runnable with `node .output/server/index.mjs`
  (the repo `start` script and `vite preview`). This is what the new CI
  `build` step exercises.
- **On Vercel:** Vercel's build container sets the `VERCEL=1` env var; Nitro
  detects it and switches to the Vercel preset automatically, emitting the
  Vercel Build Output API artifact instead of a plain node server. No preset
  override is needed in `vite.config.ts`. (To force a preset elsewhere you
  would pass `nitro({ preset: "..." })`, e.g. `bun` — we do not.)

## Vercel project settings (set once, by the human operator)

This is a pnpm workspace with two app packages. The cleaner path is to
configure the Vercel **project settings in the dashboard** rather than commit a
`vercel.json` — a `vercel.json` cannot relocate the install to the workspace
root, and the dashboard Root Directory + workspace-aware install handles the
monorepo correctly. **No `vercel.json` is committed.**

In the Vercel project (Settings → General / Build & Development):

| Setting              | Value                                                                | Why                                                                                                                                                                                   |
| -------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Root Directory**   | `savepoint-tanstack`                                                 | Points Vercel at the app package. Leave "Include files outside the root directory" **enabled** so the workspace root (`pnpm-workspace.yaml`, root lockfile) is available for install. |
| **Framework Preset** | Other / Vite (auto)                                                  | Nitro drives the server build; the framework preset only affects defaults we override below.                                                                                          |
| **Install Command**  | `pnpm install --frozen-lockfile` (run at workspace root)             | pnpm resolves the whole workspace from the root lockfile; do not scope install to the subdir or workspace deps won't resolve.                                                         |
| **Build Command**    | `pnpm --filter savepoint-tanstack build`                             | Builds only this package; Nitro emits the Vercel artifact under the package.                                                                                                          |
| **Output Directory** | leave default (Nitro/Vercel preset writes the Build Output API tree) | The Vercel preset bypasses the static `dist/` output dir.                                                                                                                             |
| **Node.js Version**  | 22.x                                                                 | Matches CI (`pnpm-lock` / `.nvmrc`) and the `@types/node` line.                                                                                                                       |

If Vercel's monorepo auto-detection offers to set Root Directory =
`savepoint-tanstack`, accept it, then override Install/Build commands as above.

## Required environment variables

Set every server-side key defined in [`../env.ts`](../env.ts) on the Vercel
project (Production + Preview). All are server-only (no `VITE_`/client-exposed
vars in this app).

**Auth (Better Auth + Cognito):** `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (set
to the deployed origin), `AUTH_MIGRATION_CUTOVER_AT`, `AUTH_COGNITO_ID`,
`AUTH_COGNITO_SECRET`, `AUTH_COGNITO_ISSUER`, `AUTH_COGNITO_DOMAIN` (optional),
`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` (optional),
`AUTH_ENABLE_CREDENTIALS` (optional).

**Database (Postgres):** `POSTGRES_DATABASE`, `POSTGRES_HOST`,
`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`,
`POSTGRES_URL_NON_POOLING`, `POSTGRES_URL_NO_SSL`, `DATABASE_LOGGING`
(optional).

**IGDB:** `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET`.

**Steam:** `STEAM_API_KEY`.

**S3 / AWS:** `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`AWS_ENDPOINT_URL` (optional — leave unset in prod; only for LocalStack).

**Redis (optional):** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

**Runtime:** `NODE_ENV=production`, `LOG_LEVEL` (optional).

`env.ts` validates these at startup; a missing required key fails the boot fast
with a clear message. Separately, a missing `POSTGRES_URL_NON_POOLING` /
`POSTGRES_PRISMA_URL` fails the **build** (the `prisma generate` step's
`prisma.config.ts` throws) — so ensure those are set for the deploying
environment, not just at runtime.

## Verifying a build locally before deploy

```bash
docker compose up -d                              # local Postgres on :6432 (runtime; build only needs the DB URL in .env, not a live connection)
pnpm --filter savepoint-tanstack build            # prisma generate (reads .env) + vite build; must exit 0
test -f savepoint-tanstack/.output/server/index.mjs && echo OK   # Nitro server entry present
pnpm --filter savepoint-tanstack start            # boots node .output/server/index.mjs
```

## Rollback

To roll back a bad production deploy, revert the offending change on `main` (or
promote a known-good prior Vercel deployment) and redeploy — no data migration
is involved, and Better Auth sessions in the shared Postgres survive. The full
runbook, including the disaster-case path, is at
[`../../docs/cutover-rollback.md`](../../docs/cutover-rollback.md).
