# Technical Specification: Migrate Authentication System to Better Auth

- **Functional Specification:** [`functional-spec.md`](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Nail

---

## 1. High-Level Technical Approach

Replace NextAuth v5 (beta) end-to-end with [Better Auth](https://better-auth.com), keeping Cognito (with Google federation) as the upstream identity provider via Better Auth's [first-class Cognito provider](https://better-auth.com/docs/authentication/cognito). Switch from JWT to Better Auth's database-backed sessions. Run a one-shot Prisma migration that reshapes the existing `Account` / `Session` / `VerificationToken` tables to Better Auth's schema, preserving every user's identity link via the existing Cognito `sub` so users can sign in with the same Google account post-cutover.

User-facing surfaces (login page, sign-in button, protected redirects, Steam connect flow) keep their current shape. Two new UI surfaces are added: a 48-hour pre-cutover banner and a one-shot post-cutover login message. The cutover is a hard cutover at a configurable timestamp (`AUTH_MIGRATION_CUTOVER_AT`).

The Steam OpenID flow at `app/api/steam/auth/*` is independent and untouched — it only consumes `getServerUserId()`, whose internals change but whose contract does not.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1. Architecture Changes

| Concern | Today | After |
|---|---|---|
| Auth library | `next-auth@5.0.0-beta.30` + `@auth/prisma-adapter` | `better-auth` + `better-auth/adapters/prisma` |
| Session strategy | JWT | DB-backed (`session` table) |
| Mount point | `app/api/auth/[...nextauth]/route.ts` | `app/api/auth/[...all]/route.ts` (BA's catch-all) |
| Config entry | `auth.ts` (root) — exports `auth`, `handlers`, `signIn` | `auth.ts` (root) — exports `auth` (BA instance) and a thin `getServerUserId` wrapper |
| Server-side session helper | `auth()` from `auth.ts` | `auth.api.getSession({ headers })` from BA |
| Server actions | Plain `"use server"` functions; existing `createServerAction` factory in `shared/lib/server-action/` | Unchanged — sign-in/sign-up actions internally call BA's client/server APIs instead of NextAuth's |
| Middleware | None | New `middleware.ts` to detect old session cookies post-cutover and trigger the one-shot login message |

The four-layer DAL, FSD layout, and the homegrown `createServerAction` factory are not touched. The architecture doc (`context/product/architecture.md` §2) and `shared/CLAUDE.md` both contain stale references — those are cleaned up as part of this spec.

### 2.2. Data Model / Database Changes

Single Prisma migration (`prisma/migrations/<timestamp>_better_auth_migration/`) executed at cutover. Better Auth's expected schema (see [BA Prisma docs](https://better-auth.com/docs/adapters/prisma)) drives the target shape.

**Tables — final shape**

| Table (BA) | Replaces | Key columns | Notes |
|---|---|---|---|
| `user` | `User` (kept, lowercased) | `id`, `email`, `emailVerified` (Boolean — BA shape), `name`, `image`, `createdAt`, `updatedAt` | All SavePoint extensions preserved as `additionalFields`: `username`, `usernameNormalized`, `password`, `isPublicProfile`, `profileSetupCompletedAt`, `onboardingDismissedAt`, `steamProfileURL`, `steamId64`, `steamUsername`, `steamAvatar`, `steamConnectedAt`. Existing relations (`LibraryItem`, `JournalEntry`, `Review`, `Follow`, `ImportedGame`, `IgnoredImportedGames`) preserved. |
| `account` | `Account` | `id`, `userId`, `providerId`, `accountId`, `accessToken`, `refreshToken`, `idToken`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`, `scope`, `password`, `createdAt`, `updatedAt` | Column rename map: `provider`→`providerId`, `providerAccountId`→`accountId`, `refresh_token`→`refreshToken`, `access_token`→`accessToken`, `id_token`→`idToken`, `expires_at`→`accessTokenExpiresAt` (epoch→DateTime conversion). Cognito `sub` lives in `accountId`, preserving identity. |
| `session` | `Session` | `id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent`, `createdAt`, `updatedAt` | `sessionToken`→`token`. Existing rows are deleted in the migration (every user is forced to re-sign-in anyway). |
| `verification` | `VerificationToken` | `id`, `identifier`, `value`, `expiresAt`, `createdAt`, `updatedAt` | `token`→`value`. Existing rows truncated (verification tokens are short-lived). |

**Migration SQL outline** (informational — exact DDL generated via `prisma migrate dev` after `prisma/schema.prisma` is updated to BA shape):

1. `ALTER TABLE "Account" RENAME TO "account"` and column renames listed above.
2. Convert `expires_at INTEGER` → `accessTokenExpiresAt TIMESTAMP` via `to_timestamp()`.
3. `ALTER TABLE "Session" RENAME TO "session"`; rename `sessionToken`→`token`. `TRUNCATE "session"` to invalidate all live sessions at cutover.
4. `ALTER TABLE "VerificationToken" RENAME TO "verification"`; rename + truncate.
5. `ALTER TABLE "User" RENAME TO "user"`. No column drops — BA `additionalFields` covers everything.
6. Update relation FKs to point at lowercased table names.

**Rollback:** the migration is reversible via the symmetric down migration. `Session`/`VerificationToken` data is not restored on rollback (acceptable — short-lived tokens). `Account` data is fully reversible because no information is lost in the rename.

**Out of this migration:** zero data loss for `User`, `Account`, `LibraryItem`, `JournalEntry`, `Review`, `Follow`, Steam fields, `ImportedGame`, `IgnoredImportedGames`.

### 2.3. API / Route Changes

| Route | Change | Notes |
|---|---|---|
| `app/api/auth/[...nextauth]/route.ts` | **Deleted** | Replaced by BA's catch-all. |
| `app/api/auth/[...all]/route.ts` | **New** | Mounts `auth.handler` (Better Auth's request handler). Handles all of `/api/auth/*`. |
| `app/api/steam/auth/route.ts` | Unchanged contract; internal `getServerUserId()` reimplemented | Steam OpenID flow stays as-is. |
| `app/api/steam/auth/callback/route.ts` | Unchanged contract; internal `getServerUserId()` reimplemented | Same. |

**Cognito callback URL**: changes from `https://<host>/api/auth/callback/cognito` (NextAuth's shape) to `https://<host>/api/auth/oauth2/callback/cognito` (BA's Cognito provider shape). **Both URLs registered in the Cognito App Client before deploy** so the transition is seamless. Old URL removed after migration is verified stable.

### 2.4. Component Breakdown

**New files**

| Path | Responsibility |
|---|---|
| `savepoint-app/widgets/auth-migration-banner/` | New widget. Renders the pre-cutover banner. Reads cutover timestamp from a server-rendered prop, computes visibility window (`now ∈ [cutover-48h, cutover)`), persists per-browser dismissal in `localStorage`. Mounted inside `app/(protected)/layout.tsx` and `app/games/layout.tsx`. |
| `savepoint-app/middleware.ts` | New. On every request, detects a stale session cookie format post-cutover (presence of NextAuth's `next-auth.session-token` / `__Secure-next-auth.session-token` cookies after `AUTH_MIGRATION_CUTOVER_AT`); clears the cookie and sets `auth_migrated=1` (one-shot, HttpOnly off so client can read, ~10min TTL). |
| `savepoint-app/features/auth/lib/cutover.ts` | Pure helpers: `getCutoverAt()`, `isInBannerWindow(now)`, `isPostCutover(now)`. |
| `savepoint-app/features/auth/ui/migration-notice.tsx` | Component rendered on the login page when `auth_migrated` cookie is present. Reads cookie, deletes it, displays the one-shot message. |
| `savepoint-app/auth.ts` (rewrite) | Better Auth instance with Cognito provider + email/password plugin (gated to non-prod). Re-exports `auth` and `getServerUserId()`. |
| `savepoint-app/shared/lib/auth/get-session.ts` | Thin wrapper around `auth.api.getSession({ headers })` — used by `getServerUserId()` and any direct callers. |

**Modified files (high-level surface)**

| Path | Change |
|---|---|
| `savepoint-app/auth.ts` | Full rewrite. |
| `savepoint-app/shared/lib/app/auth.ts` | `requireServerUserId` / `getOptionalServerUserId` keep their signatures; internals call new `getSession`. |
| `savepoint-app/shared/lib/auth/handle-next-auth-error.ts` | **Deleted**. BA does not throw `NEXT_REDIRECT`-style sentinels with the same shape; the auth server actions are simplified. |
| `savepoint-app/shared/lib/app/auth/oauth-callbacks.ts` | **Deleted**. The redirect-loop guard becomes a Better Auth `redirect` callback (or a `signInCallbackUrl` middleware); the JWT/session shape callbacks are no-ops with DB sessions. |
| `savepoint-app/shared/lib/app/auth/credentials-callbacks.ts` | **Deleted**. Replaced by BA's email+password plugin. |
| `savepoint-app/features/auth/server-actions/sign-in.ts` | Calls BA's email+password sign-in (still test/dev only). |
| `savepoint-app/features/auth/server-actions/sign-in-google.ts` | Calls BA's Cognito provider sign-in. |
| `savepoint-app/features/auth/server-actions/sign-up.ts` | Calls BA's email+password sign-up (test/dev only). |
| `savepoint-app/features/auth/ui/auth-page-view.tsx` | Wires the new server actions; conditionally renders `MigrationNotice` if `auth_migrated` cookie is set. |
| `savepoint-app/widgets/sidebar/ui/sidebar-user-menu.tsx` | Sign-out invokes `auth.api.signOut()`. |
| `savepoint-app/features/profile/ui/logout-button.tsx` | Same. |
| `savepoint-app/shared/providers/providers.tsx` | Drops `<SessionProvider>` (NextAuth-specific). BA does not require a provider; client session is read via `authClient.useSession()` if needed. |
| `savepoint-app/test/setup/auth-mock.ts`, `e2e/auth.setup.ts`, `e2e/helpers/auth.ts` | Re-seed test accounts via BA's email+password API; replace NextAuth-specific mocks. |
| `savepoint-app/app/(protected)/layout.tsx`, `app/games/layout.tsx` | Mount `<AuthMigrationBanner />`. |
| `savepoint-app/prisma/schema.prisma` | Update model definitions to BA shape; mark SavePoint extensions as additional fields. |
| `context/product/architecture.md` | Cleanup §2 (Authentication) and `next-safe-action` references. |
| `savepoint-app/shared/CLAUDE.md` | Remove stale `authorizedActionClient` / `next-safe-action` claims. |

### 2.5. Logic / Algorithm

**Cutover-window computation** (`features/auth/lib/cutover.ts`)
- `getCutoverAt()`: parses `AUTH_MIGRATION_CUTOVER_AT` (ISO-8601 UTC). Returns `null` if unset or invalid → both banner and one-shot message no-op.
- `isInBannerWindow(now)`: `cutoverAt - 48h ≤ now < cutoverAt`.
- `isPostCutover(now)`: `now ≥ cutoverAt`.

**Banner visibility** (`AuthMigrationBanner`)
- Server component reads cutover env var, renders banner only when `isInBannerWindow(now)`.
- Client island reads `auth_migration_dismissed` from `localStorage`; hides itself if set; setting the flag on dismiss persists across reloads.

**Forced sign-out detection** (`middleware.ts`)
- For every request matched by `config.matcher` (all paths except static assets and Better Auth's own routes):
  - If `isPostCutover(now)` and request carries any of `next-auth.session-token`, `__Secure-next-auth.session-token`, or the legacy CSRF cookie:
    - Build a response that clears those cookies (`Set-Cookie ...; Max-Age=0`).
    - Set a `auth_migrated=1` cookie (Path=/, Max-Age=600, SameSite=Lax). HttpOnly is **off** so client UI can detect it; this is intentionally low-sensitivity.
    - Continue the request — Better Auth will see no valid session and the existing protected-layout redirect to `/login` triggers.
- If the request is already on `/login` and carries `auth_migrated=1`, do nothing (the page reads + clears it).

**One-shot post-cutover message** (`MigrationNotice`)
- Server component reads `auth_migrated` cookie via `next/headers`. If present:
  - Renders the notice text.
  - Sets a response cookie clearing `auth_migrated` (Max-Age=0).
- Else renders nothing.

**Account linking on first post-cutover sign-in** — handled by Better Auth's built-in account linking, configured with `accountLinking: { enabled: true, trustedProviders: ["cognito"] }`. Because the `account` table preserves `accountId` (the Cognito `sub`) and `providerId="cognito"` from the migration, BA finds the existing user by exact match on first sign-in — no email lookup actually needed in the steady state. Email-based linking is the fallback path if the Cognito identity ever drifts (it won't).

### 2.6. Environment Variables

New / changed:

| Variable | Purpose | Required |
|---|---|---|
| `BETTER_AUTH_SECRET` | BA secret (replaces `AUTH_SECRET`; can reuse the same value for continuity) | Yes |
| `BETTER_AUTH_URL` | Public URL of the app (replaces `AUTH_URL`) | Yes |
| `AUTH_COGNITO_ID`, `AUTH_COGNITO_SECRET`, `AUTH_COGNITO_ISSUER` | Cognito client credentials — unchanged | Yes |
| `AUTH_ENABLE_CREDENTIALS` | Toggles BA email+password plugin in non-prod — unchanged semantics | No (default off) |
| `AUTH_MIGRATION_CUTOVER_AT` | ISO-8601 UTC timestamp for cutover. Drives banner + middleware. Empty → no-op (both surfaces hidden). | Yes pre-cutover; can be removed afterwards |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Pass-through to Cognito federation; not consumed by BA directly | No |

`AUTH_SECRET` and `AUTH_URL` retired (kept until cutover for the dual-mount window if any; otherwise removed).

### 2.7. Build / Deployment

- **Vercel:** standard Next.js build. No new build steps. Add the new env vars to the Vercel project before deploy.
- **Cognito side:** add the new BA callback URL (`https://<host>/api/auth/oauth2/callback/cognito`) to the App Client's allowed callbacks **before** the migration deploy. Old URL stays whitelisted during the transition window. Removed after migration is verified.
- **Migration runs in CI** before serving traffic: `prisma migrate deploy` against production DB. Same model as today.

---

## 3. Impact and Risk Analysis

### 3.1. System Dependencies

- **Cognito User Pool** — config update required (callback URL). Otherwise unchanged.
- **PostgreSQL** — schema migration; one-shot, ~seconds to run on production volume.
- **Vercel** — env var update; deploy.
- **Steam OpenID flow** — depends only on `getServerUserId()` contract; unchanged.
- **TanStack Query / client cache** — unaffected; no client-side session state changes shape (BA's `useSession` returns a comparable user object).
- **All ~82 call sites of `getServerUserId()`/`auth()`** — covered by keeping the helper signatures stable. No call-site rewrites beyond trivial import path changes (handled by codemod).

### 3.2. Potential Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Migration corrupts `Account` table; users can't sign in | Low | Critical | Dry-run migration on a prod-snapshot in staging before cutover. Keep a verified DB backup taken immediately pre-migration. Rollback plan: restore backup + redeploy NextAuth code (kept on a release tag for ≥7 days). |
| Cognito callback URL misconfigured at cutover | Low | High | Register **both** URLs in Cognito App Client ahead of deploy. Verified by manual sign-in on staging. |
| Better Auth session table grows unbounded | Medium | Medium | BA prunes expired sessions; configure `session.cleanup` job or rely on BA defaults. Add a Vercel cron if needed. |
| Per-request DB hit for session (vs JWT) regresses page latency | Low–Medium | Medium | Spec-018 caching already covers hot reads. Measure p50/p99 in staging vs prod baseline before promoting. If meaningful regression, evaluate BA's `cookieCache` plugin. |
| Edge middleware can't access Prisma; cookie detection logic must be Edge-safe | High | Low | Middleware only inspects request cookies + env-var timestamps; no DB / Prisma calls. Keep it pure-string logic. |
| Banner remains visible past cutover for a user who never reloads | Low | Low | Cutover hits middleware on next nav anyway, which forces sign-out → user is no longer "signed-in", so banner can't render regardless. |
| `auth_migrated` cookie set during normal sign-out flow misfires the message | Low | Low | Middleware sets it **only** when a *NextAuth-shaped* cookie is detected post-cutover. After ~10 min TTL, the legacy cookie won't exist for any session created by BA. |
| Test re-seeding misses an account used by an E2E spec | Medium | Low (test only) | Catalog all test users in `e2e/auth.setup.ts`; the seeding script is the single source of truth. CI fails fast on missing accounts. |
| Stale `next-auth` types leak into TS build after removal | Low | Low | Removal of `next-auth` from `package.json` + `pnpm typecheck` in CI catches any orphan imports. |
| Account-linking edge case: a user changes Cognito email post-migration but accountId is stable | Low | Low | BA links by `accountId` (Cognito `sub`) first; email change doesn't break linking. |
| `oauth-callbacks.ts` redirect-loop guard not reproduced | Medium | Low | Guard is replicated in BA's `signIn` callback (same `r=` counter logic). Smoke-tested via the existing E2E suite. |
| 82 call sites of `auth()`/`getServerUserId` quietly behave differently | Low | Medium | The helper keeps the same return shape (`string \| undefined`). Add a typecheck-time assertion. Smoke E2E covers all primary protected routes. |
| `next-safe-action` references in architecture.md / shared/CLAUDE.md remain misleading | High | Low | Documentation cleanup included in the spec. |

### 3.3. Out-of-Scope (Reaffirmed)

- TanStack Start migration — separate effort.
- Replacing Cognito.
- New sign-in methods.
- Email verification / password reset flows.
- Steam OpenID changes.

---

## 4. Testing Strategy

### 4.1. Unit Tests
- `features/auth/lib/cutover.ts` — table-driven tests for `isInBannerWindow` / `isPostCutover` boundary conditions (exactly at cutoverAt, 48h-1s before, env unset, malformed).
- `widgets/auth-migration-banner` — renders only inside window; respects dismissal; renders nothing outside.
- `features/auth/ui/migration-notice.tsx` — renders when cookie present; clears cookie; renders nothing otherwise.
- New `auth.ts` — BA instance instantiates without throwing under each env-var permutation.

### 4.2. Integration Tests (Vitest, node env)
- BA Cognito provider: mock provider, assert sign-in flow produces a `session` row + an `account` row with `providerId="cognito"` and `accountId=<sub>`.
- Email+password plugin (when `AUTH_ENABLE_CREDENTIALS=true`): sign-up → sign-in → session validation.
- `getServerUserId()` returns `userId` when a valid BA session is in headers; returns `undefined` otherwise.
- Account-linking: pre-existing `user` row + matching `account` row + first sign-in → no duplicate user created.

### 4.3. Migration Tests
- Seed a snapshot DB representative of production: create users with Account+Session rows in NextAuth shape.
- Run the migration.
- Assert: zero rows lost in `User`, `Account`; column renames applied; relations intact; `Session`/`VerificationToken` truncated.
- Run `prisma migrate diff` in both directions; rollback restores schema (data restoration not required for `session`/`verification`).

### 4.4. E2E Tests (Playwright)
- Existing `auth-session.spec.ts` adapted to the new flow; should pass with no spec-text changes.
- New scenario: post-cutover, given an old session cookie, user is redirected to `/login` and sees the migration notice exactly once.
- New scenario: pre-cutover, signed-in user sees the banner; dismissing persists; reload still hides.
- New scenario: signed-out user on `/login` does NOT see the banner.
- Steam connect E2E (existing): unchanged, passes.

### 4.5. Manual Verification (Pre-Cutover, Staging)
- Sign in via Cognito → Google.
- Inspect `account` row: `providerId="cognito"`, `accountId` matches Cognito `sub`.
- Sign out → sign in again on a new browser → session persists 30 days nominal.
- Steam connect end-to-end.
- Banner appears at `cutoverAt - 48h`; disappears after `cutoverAt`.
- Forced sign-out: simulate by setting clock forward; old NextAuth cookie triggers middleware; login page shows one-shot notice.

### 4.6. Production Cutover Verification
- Deploy → `prisma migrate deploy` runs → app boots.
- Smoke check: a test user (Vercel preview) signs in via Cognito within 5 min.
- Watch error logs for `NEXT_REDIRECT`/auth-related errors for 1h post-cutover.
- Roll back plan: redeploy previous tag + restore DB snapshot if migration cannot be patched forward in <30 min.
