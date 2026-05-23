# Slice 23 — Cross-App Session Check (static mechanism review)

> **Spec:** 021 Migrate to TanStack Start · **Slice:** 23 (Final parity audit) · **Date:** 2026-05-22
> **Agent:** `feature-dev:code-reviewer` · **Scope:** STATIC — prove by construction (config + code, both apps) that a Better Auth session created by `savepoint-app/` is valid in `savepoint-tanstack/` and vice-versa against the shared Postgres DB. No running apps. The migration's central risk (functional-spec §2.1: users signed in before cutover stay signed in).
> **Gate verdict:** ✅ **PASS** — 8/8 session-interop invariants hold by construction; 0 diverging.

## Summary

8 invariants checked, **8 holding, 0 blocking divergences**. Same signing secret, Better Auth cookie defaults unchanged in both apps, identical `/api/auth` basePath, byte-identical auth-model Prisma schemas against the same `POSTGRES_URL`, symmetric `auth.api.getSession` resolution, identical account-linking config, shared Cognito provider, and native `Set-Cookie` passthrough in the tanstack handler.

## Invariant table

| # | Invariant | savepoint-app evidence | savepoint-tanstack evidence | Verdict |
|---|---|---|---|---|
| 1 | Same signing secret | `env.mjs:10` + `auth.ts:52` (`secret: env.BETTER_AUTH_SECRET`) | `env.ts:87` (same var, same Zod rule) + `auth.server.ts:46` | HOLDS — both require the same env var, no default; ops supply same value |
| 2 | Same cookie identity (name/domain/sameSite/secure) | `auth.ts:51–78` — no `advanced`/`cookies`/`cookiePrefix` override | `auth.server.ts:45–71` — no override | HOLDS — both use BA defaults (`better-auth.session_token`); cookies port-agnostic on localhost; same Vercel origin in prod |
| 3 | Same `basePath` `/api/auth` | `app/api/auth/[...all]/route.ts:4` (BA default) | `auth.server.ts:48` explicit `basePath:"/api/auth"`; `routes/api/auth/$.ts:20` | HOLDS — identical effective value |
| 4 | Shared session/account/user tables | `auth.ts:55` `prismaAdapter` on `POSTGRES_URL` (`env.mjs:25`); schema models account/session/user/verification | `auth.server.ts:50–52` same adapter, same `POSTGRES_URL` (`env.ts:102`); auth models byte-identical; CI diff-checks schema | HOLDS — same physical DB, identical auth models; rows cross-readable |
| 5 | Server-side session resolution reads shared cookie | `auth.ts:84–87` `getServerUserId()` → `auth.api.getSession({headers: await headers()})` | `get-session.server.ts:3–8` `getServerUserId(request)` → `auth.api.getSession({headers: request.headers})`; `require-user-id.ts:17–18`; `_authed.tsx:6` | HOLDS — symmetric validation of same token vs same table |
| 6 | Account-linking parity (no user fork) | `auth.ts:60–63` `accountLinking.enabled=true, trustedProviders:["cognito"]` | `auth.server.ts:56–60` identical | HOLDS — first sign-in reuses `account` on `@@unique([providerId,accountId])` |
| 7 | Cognito provider parity | `auth.ts:39–45` `socialProviders.cognito` from `AUTH_COGNITO_*`; dev callback `localhost:6060/api/auth/callback/cognito` | `auth.server.ts:32–39` identical block, same four env vars; shares `:6060` dev callback (`tasks.md:79`) | HOLDS — prod callback added at Slice 24 (out of scope) |
| 8 | Cookie-persistence-on-mutation (`Set-Cookie` flows) | `auth.ts:77` `plugins:[nextCookies()]` + `toNextJsHandler` | `auth.server.ts` — no `nextCookies()` (intentional, tech spec §2.3); `api/auth/$.ts:13` `return auth.handler(request)` passes native `Set-Cookie` through | HOLDS — TanStack Start Web Response passthrough doesn't strip `Set-Cookie`; sign-in `Set-Cookie` integration test GREEN (`tasks.md:60`) |

## Divergences

**None blocking.** One non-blocking note: `authClient` basePath is explicit in tanstack (`auth-client.ts:4` `basePath:"/api/auth"`) vs BA default in canonical — same effective value, a documentation improvement, no action.

## Static-review limits (covered elsewhere)

Static review proves the invariants, not the live flow. Not provable from code:
1. Live OAuth round-trip through Cognito (hosted UI → callback → `verifyIdToken` vs live JWKS).
2. Real-browser cookie-jar sharing across ports (standard per RFC 6265, but not live-tested here).
3. `Set-Cookie` round-trip under TanStack Start's server layer (code path correct + integration test asserts it, but not browser-tested end-to-end).

Covered by: **Slice 7 parallel-run** (precedent — both apps ran against the same DB, session sharing was the deliverable; `DIVERGENCES.md`, `tasks.md:143`); the optional live form of this Slice 23 check; and the **Slice 24 HUMAN-IN-THE-LOOP cutover verification** (prod sessions persist + Cognito sign-in on prod host).

## Gate verdict

✅ **PASS.** All 8 session-interoperability invariants hold by construction with file:line evidence in both apps; no divergence would fork user records or invalidate cross-app sessions. Live confirmation is covered by the Slice 7 precedent and the Slice 24 human-in-the-loop step.
