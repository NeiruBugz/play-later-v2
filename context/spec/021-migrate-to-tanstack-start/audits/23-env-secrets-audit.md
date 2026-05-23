# Slice 23 — Env + Secrets Audit (`savepoint-tanstack/`)

> **Spec:** 021 Migrate to TanStack Start · **Slice:** 23 (Final parity audit) · **Date:** 2026-05-22
> **Agent:** `tanstack-fullstack` · **Scope:** READ-ONLY. Every required `env.ts` var documented in `.env.example` + present in prod; Cognito callback URLs on dev + prod App Clients. Repo-verifiable clauses audited fully; deployment-state clauses flagged + deferred (not claimed green).
> **Gate verdict:** ✅ **PASS** — all repo-verifiable clauses hold (1 LOW, benign); live-state (Vercel prod vars, applied AWS Cognito config) cleanly deferred to Slice 24.

## Summary

| Metric | Result |
|---|---|
| Required vars in `env.ts` | 22 (21 server + `NODE_ENV` shared) |
| Documented in `.env.example` | 21/22 |
| Missing | 1 — `NODE_ENV` (LOW, benign — runtime fallback `?? "development"` at `env.ts:95`; savepoint-app omits it too) |
| `process.env` hygiene outside `env.ts` | OK — only `env.ts` (boundary), `prisma.config.ts:8` (CLI tooling), test harness/fixtures. No `src/**` runtime leak |
| Real secrets in `.env.example` | None — all placeholders / LocalStack dummies (`test`/`test`) |
| Cognito callback (code-declared) | dev `${app_url}/api/auth/callback/cognito` (`app_url=http://localhost:6060`) + prod path declared; tanstack dev `:6061` callback NOT in repo (uncommitted tfvars / live AWS); prod cutover callback deferred to S24 (expected) |
| Cross-app name parity | EXACT — same 31 keys, same Zod rules; same `.env` satisfies both apps |
| Live-state deferred | Vercel prod env var presence; applied dev Cognito `:6061` callback; prod cutover callback (all Slice 24) |

## Clause 1 — required-var parity

All 21 strictly-required SERVER vars are documented in `.env.example`: `AUTH_COGNITO_{ID,SECRET,ISSUER}`, `BETTER_AUTH_{SECRET,URL}`, `IGDB_CLIENT_{ID,SECRET}`, `POSTGRES_{DATABASE,HOST,PASSWORD,PRISMA_URL,URL,URL_NO_SSL,URL_NON_POOLING,USER}`, `STEAM_API_KEY`, `AWS_{REGION,ACCESS_KEY_ID,SECRET_ACCESS_KEY}`, `S3_{BUCKET_NAME,AVATAR_PATH_PREFIX}` — each cited to a `.env.example` line. Optional/defaulted vars (`AUTH_COGNITO_DOMAIN`, `AUTH_MIGRATION_CUTOVER_AT`, `AUTH_GOOGLE_*`, `AUTH_ENABLE_CREDENTIALS`, `DATABASE_LOGGING`, `AWS_ENDPOINT_URL`, `UPSTASH_REDIS_*`, `LOG_LEVEL`) are also present (some commented). 

**F1 (LOW):** `NODE_ENV` (`env.ts:77`, `z.enum(...)` no default) is technically required but absent from `.env.example`. Benign: `runtimeEnv` supplies `process.env.NODE_ENV ?? "development"` (`env.ts:95`); framework-injected; savepoint-app omits it too. Optional fix: add a commented `# NODE_ENV=development`. Not a blocker.

## Clause 2 — hygiene

- **Orphans:** none — every `.env.example` key maps to an `env.ts` entry (incl. the documented `SKIP_ENV_VALIDATION` escape hatch).
- **Committed secrets:** none — all placeholders or non-sensitive local-dev defaults (`localhost:6432`, `us-east-1`, LocalStack `test`/`test`).
- **`process.env` boundary:** holds. Outside-`env.ts` reads are all documented exceptions — `prisma.config.ts:8` (Prisma CLI tooling), `test/setup/integration.ts` + integration fixtures (test harness). Zero `src/**` runtime reads (ripgrep-confirmed).

## Clause 3 — Cognito callbacks (code-declared part)

`infra/` declares: `modules/cognito/{variables.tf:21,26, main.tf:63-64}`; dev (`envs/dev/main.tf:15-18`) builds `["${app_url}/api/auth/callback/cognito"] + additional_callback_urls`, `app_url=http://localhost:6060`, `additional_callback_urls` default `[]` (`envs/dev/variables.tf:63-67`); prod (`envs/prod/main.tf:15-17`) single `["${app_url}/api/auth/callback/cognito"]`.

- dev `:6060` + prod callback paths code-declared correctly (`/api/auth/callback/cognito` — same path both apps share).
- The tanstack dev callback (`BETTER_AUTH_URL=http://localhost:6061`, `.env.example:20`) is **NOT code-declared** — it would live in an uncommitted `additional_callback_urls` tfvars and applied AWS state. Tech spec §2.3 (`technical-considerations.md:66`) asserts it was added during the parallel-run window (S2/S7). Repo can't confirm → live-verification item (§ deferred), not a repo blocker.
- prod cutover callback: added AT cutover (`technical-considerations.md:191`, Slice 24) — correctly absent now, expected.

## Clause 4 — cross-app name parity (repo part)

`savepoint-tanstack/env.ts` vs `savepoint-app/env.mjs`: **exact name-for-name match, zero drift**, identical Zod rules (incl. `S3_AVATAR_PATH_PREFIX` `.endsWith("/")`, `AUTH_MIGRATION_CUTOVER_AT` ISO/`""` union). Only intentional differences (documented, no value impact): `@t3-oss/env-core` vs `env-nextjs` adapter; `NODE_ENV`/`LOG_LEVEL` in a `shared:` block vs `server:`; `clientPrefix:"VITE_"` with empty `client:{}` (forward-compat, zero client vars). The same `.env` values satisfy both apps.

## Live-state deferred (Slice 24 owns — NOT claimed green)

1. **Vercel prod env var presence** (clause 4) — whether all required vars are set on the tanstack Vercel project. Needs `vercel env ls`/dashboard.
2. **Applied dev Cognito `:6061` callback** (clause 3) — whether the tanstack dev host callback is on the live dev App Client. Needs AWS console / `terraform output` against live dev state. Verify before final cutover sign-off (S2/S7 manual sign-in depends on it).
3. **Prod cutover Cognito callback** (clause 3) — added at cutover by design; Slice 24 task already owns it.

## Gate verdict

✅ **PASS.** All repo-verifiable clauses hold: required-var parity (1 LOW benign gap), clean hygiene (no orphans/secrets/`process.env` leak), code-declared Cognito callbacks correct, exact cross-app name parity. No CRITICAL/blocking repo-level failure. The 3 live-state items are appropriately deferred to the Slice 24 human-in-the-loop cutover.
