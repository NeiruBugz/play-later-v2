# Migration Plan: NextAuth v5 → Better Auth (with SOLID refactor)

## Overview

Migrate SavePoint's authentication from NextAuth v5 to Better Auth, while refactoring the auth module structure for clean separation of concerns.

Key shifts:
- JWT sessions → database sessions with cookie cache
- `auth()` → `auth.api.getSession({ headers })`
- `SessionProvider` → no wrapper needed (Better Auth uses cookies)
- bcrypt → scrypt (existing dev users re-register)
- Root `auth.ts` → `shared/lib/auth/` module with clear SRP

## New Auth Module Structure

```
shared/lib/auth/
├── auth-server.ts      # Better Auth config (library-specific implementation detail)
├── auth-client.ts      # Client-side auth (library-specific implementation detail)
├── session.ts          # getServerUserId, requireServerUserId, getOptionalServerUserId
└── index.ts            # Public API re-exports (consumers import from here)
```

**Dependency Inversion**: All consumers import from `@/shared/lib/auth` — never from the auth library directly. The auth library is a swappable implementation detail.

## Import Migration Map

### `getServerUserId` from `@/auth` → `@/shared/lib/auth` (19 files)

**Production code (7 files):**
- `shared/lib/app/auth.ts` → DELETED (merged into `shared/lib/auth/session.ts`)
- `shared/lib/server-action/create-server-action.ts`
- `app/api/library/route.ts`
- `app/api/steam/auth/route.ts`
- `app/api/steam/auth/callback/route.ts`
- `app/api/steam/connect/route.ts`
- `app/api/steam/games/route.ts`
- `app/api/steam/sync/route.ts`

**Test files (12 files):**
- `test/setup/auth-mock.ts`
- `test/setup/integration.ts`
- `shared/lib/server-action/create-server-action.test.ts`
- `features/journal/server-actions/*.server-action.test.ts` (3 files)
- `features/manage-library-entry/server-actions/*.test.ts` (2 files)
- `features/profile/server-actions/*.test.ts` (1 file)
- `features/setup-profile/server-actions/*.test.ts` (1 file)
- `features/steam-import/server-actions/__tests__/*.test.ts` (1 file)

### `next-auth/react` → `@/shared/lib/auth` (5 files)
- `shared/providers/providers.tsx` — remove SessionProvider
- `features/profile/ui/logout-button.tsx` — use authClient.signOut
- `test/utils/test-provider.tsx` — remove SessionProvider
- `features/library/ui/library-page-view.test.tsx` — remove SessionProvider
- `shared/lib/app/auth/oauth-callbacks.ts` — DELETED

### Other auth imports
- `auth.ts` imports `sessionErrorHandler`, callbacks, password — all DELETED
- `data-access-layer/services/auth/auth-service.ts` — DELETED (Better Auth built-in signup)
- `features/auth/server-actions/sign-in.ts` — rewrite for Better Auth API
- `features/auth/server-actions/sign-up.ts` — rewrite for Better Auth API
- `features/auth/server-actions/sign-in-google.ts` — rewrite for Better Auth API

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Cognito `identity_provider: "Google"` via genericOAuth plugin | **High** | Verify in Phase 1 before committing to full migration |
| `emailVerified` is `DateTime?` in Prisma but Better Auth expects `Boolean` | **Medium** | Use field mapping or add a migration |
| Session table missing `createdAt`/`updatedAt` columns | **Low** | Additive Prisma migration |
| Server action redirect pattern change (throw→explicit) | **Low** | Replace with explicit `redirect()` calls |

---

## Phase 1: Install + Create New Auth Module

### 1.1 Install Better Auth
```bash
cd savepoint-app && pnpm add -E better-auth
```

### 1.2 Create `shared/lib/auth/auth-server.ts`
Better Auth server config:
- `prismaAdapter` with field mapping for Account/Session columns
- `genericOAuth` plugin for Cognito with `identity_provider: "Google"`
- `emailAndPassword` conditionally enabled
- `nextCookies()` plugin
- Default scrypt hashing
- `session.expiresIn: 30 days`, `updateAge: 24h`, `cookieCache: 5min`

### 1.3 Create `shared/lib/auth/auth-client.ts`
Client-side auth with `createAuthClient` + `genericOAuthClient` plugin.

### 1.4 Create `shared/lib/auth/session.ts`
Consolidate all session helpers:
- `getServerUserId()` — uses `auth.api.getSession()`
- `requireServerUserId()` — redirects to /login if no session (from `shared/lib/app/auth.ts`)
- `getOptionalServerUserId()` — returns `string | null` (from `shared/lib/app/auth.ts`)

### 1.5 Create `shared/lib/auth/index.ts`
Public API barrel file exporting session helpers and authClient.

### 1.6 Update `env.mjs`
- Add `NEXT_PUBLIC_AUTH_URL` as client env var
- Keep Cognito env vars
- Make `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` removable (already optional)

---

## Phase 2: Prisma Schema Migration

Add `createdAt`/`updatedAt` to Session model. Investigate `emailVerified` type. Handle Account field mapping in Better Auth config.

---

## Phase 3: New API Route

- Delete `app/api/auth/[...nextauth]/route.ts`
- Create `app/api/auth/[...all]/route.ts` with `toNextJsHandler(auth)`

---

## Phase 4: Update All Import Sites

### 4.1 Production code — update `@/auth` → `@/shared/lib/auth`
Update 6 API route files + `create-server-action.ts`.

### 4.2 Delete `shared/lib/app/auth.ts`
Merged into `shared/lib/auth/session.ts`. Update any imports of `requireServerUserId`/`getOptionalServerUserId` to come from `@/shared/lib/auth`.

### 4.3 Delete root `auth.ts`
No longer needed — all exports moved to `shared/lib/auth/`.

### 4.4 Update pages calling `auth()` directly
3 pages use `getOptionalServerUserId()` or `requireServerUserId()` instead.

---

## Phase 5: Rewrite Auth Server Actions

### 5.1 `sign-in.ts` — use `auth.api.signInEmail()` + explicit `redirect()`
### 5.2 `sign-up.ts` — use `auth.api.signUpEmail()` (replaces AuthService.signUp)
### 5.3 `sign-in-google.ts` — client-side `authClient.signIn.social({ provider: "cognito" })`

---

## Phase 6: Replace SessionProvider + Client Hooks

### 6.1 `shared/providers/providers.tsx` — remove SessionProvider
### 6.2 `features/profile/ui/logout-button.tsx` — use `authClient.signOut()`

---

## Phase 7: Redirect Loop Protection

Move `onRedirect` logic to middleware (cleaner location).

---

## Phase 8: Delete Obsolete Files

- `shared/lib/app/auth.ts` — merged into `shared/lib/auth/session.ts`
- `shared/lib/app/auth/oauth-callbacks.ts`
- `shared/lib/app/auth/credentials-callbacks.ts` + test
- `shared/lib/auth/handle-next-auth-error.ts`
- `shared/lib/app/session-error-handler.ts`
- `shared/lib/app/password.ts`
- `data-access-layer/services/auth/` (entire directory)
- Root `auth.ts`

Update `shared/lib/index.ts` to remove deleted exports.

---

## Phase 9: Update Test Infrastructure

### 9.1 Update all 12 test files mocking `@/auth` → mock `@/shared/lib/auth`
### 9.2 Replace `next-auth/react` mocks with `authClient` mocks
### 9.3 Remove `SessionProvider` from test providers

---

## Phase 10: Remove Old Dependencies

```bash
pnpm remove next-auth @auth/prisma-adapter bcryptjs @types/bcryptjs
```

Run `pnpm ci:check` and `pnpm test` to verify.

---

## Implementation Order

1. Phase 1 (install + new auth module)
2. Phase 2 (Prisma migration)
3. Phase 3 (new API route)
4. Phase 4 (update imports + delete root auth.ts)
5. Phase 5 (server actions)
6. Phase 6 (providers + client)
7. Phase 7 (redirect protection)
8. Phase 8 (cleanup obsolete files)
9. Phase 9 (tests)
10. Phase 10 (remove deps)
