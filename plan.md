# Migration Plan: NextAuth v5 → Better Auth

## Overview

Migrate SavePoint's authentication from NextAuth v5 to Better Auth. ~25-30 files affected. Key shifts:
- JWT sessions → database sessions with cookie cache
- `auth()` → `auth.api.getSession({ headers })`
- `SessionProvider` → no wrapper needed (Better Auth uses cookies)
- bcrypt → scrypt (existing dev users re-register)

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Cognito `identity_provider: "Google"` via genericOAuth plugin | **High** | Verify in Phase 1 before committing to full migration |
| `emailVerified` is `DateTime?` in Prisma but Better Auth expects `Boolean` | **Medium** | Use field mapping or add a migration |
| Session table missing `createdAt`/`updatedAt` columns | **Low** | Additive Prisma migration |
| Server action redirect pattern change (throw→explicit) | **Low** | Replace with explicit `redirect()` calls |

---

## Phase 1: Install + Create New Config (side-by-side with NextAuth)

### 1.1 Install Better Auth
```bash
cd savepoint-app && pnpm add -E better-auth
```

### 1.2 Create `savepoint-app/shared/lib/auth/auth-server.ts`

Better Auth server config. Key points:
- `prismaAdapter` with field mapping for Account/Session columns (no schema renames)
- `genericOAuth` plugin for Cognito with `identity_provider: "Google"` in `authorizationUrlParams`
- `emailAndPassword` enabled only when `AUTH_ENABLE_CREDENTIALS=true` or test env
- `nextCookies()` plugin for Next.js cookie handling
- Default scrypt hashing (no bcrypt compat needed — user chose to reset dev passwords)
- `session.expiresIn: 30 days`, `updateAge: 24h`, `cookieCache: 5min`

### 1.3 Create `savepoint-app/shared/lib/auth/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react";
import { genericOAuthClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:6060",
  plugins: [genericOAuthClient()],
});
```

### 1.4 Update `env.mjs`
- Add `NEXT_PUBLIC_AUTH_URL` as a client env var
- Keep all existing Cognito env vars
- Remove `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` (legacy, no longer needed)

---

## Phase 2: Prisma Schema Migration

Add `createdAt`/`updatedAt` to Session model. Investigate `emailVerified` type (DateTime vs Boolean). Create migration:

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Handle Account field mapping in Better Auth config rather than renaming columns.

---

## Phase 3: New API Route

- Delete `app/api/auth/[...nextauth]/route.ts`
- Create `app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from "@/shared/lib/auth/auth-server";
import { toNextJsHandler } from "better-auth/next-js";
export const { GET, POST } = toNextJsHandler(auth);
```

---

## Phase 4: Rewrite Core Auth Exports (The Switch)

### 4.1 Rewrite `savepoint-app/auth.ts`

Replace NextAuth config with thin wrapper around Better Auth:

```typescript
import { auth } from "@/shared/lib/auth/auth-server";
import { headers } from "next/headers";

export { auth };

export const getServerUserId = async (): Promise<string | undefined> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return undefined;
    return session.user.id;
  } catch (error) {
    console.error(error);
    return undefined;
  }
};
```

**No changes needed** to `shared/lib/app/auth.ts` — `requireServerUserId()` and `getOptionalServerUserId()` keep working since `getServerUserId` signature is preserved.

**No changes needed** to `shared/lib/server-action/create-server-action.ts` — imports `getServerUserId` which keeps same signature.

### 4.2 Update pages calling `auth()` directly

3 pages (`app/page.tsx`, `app/login/page.tsx`, `app/games/search/page.tsx`) call `auth()` from `@/auth`. Replace with `auth.api.getSession({ headers: await headers() })` or use `getOptionalServerUserId()`.

---

## Phase 5: Rewrite Auth Server Actions

### 5.1 `sign-in.ts`
- Replace `signIn("credentials", ...)` with `auth.api.signInEmail({ body: { email, password }, headers })`
- Replace throw-catch redirect pattern with explicit `redirect("/dashboard")`
- Remove `isNextAuthRedirect`/`isAuthenticationError` usage

### 5.2 `sign-up.ts`
- Replace `AuthService.signUp()` + `signIn()` with `auth.api.signUpEmail({ body: {...}, headers })`
- Better Auth's `autoSignIn: true` handles auto-login after signup
- Explicit `redirect("/dashboard")`

### 5.3 `sign-in-google.ts`
- Replace `signIn("cognito", ...)` with client-side `authClient.signIn.social({ provider: "cognito" })` in the component, OR redirect to `/api/auth/sign-in/social?provider=cognito&callbackURL=/dashboard`

---

## Phase 6: Replace SessionProvider + Client Hooks

### 6.1 `shared/providers/providers.tsx`
- Remove `SessionProvider` from `next-auth/react`
- Remove `next-auth/react` import entirely
- Better Auth manages sessions via cookies, no provider wrapper needed

### 6.2 `features/profile/ui/logout-button.tsx`
- Replace `signOut()` from `next-auth/react` with `authClient.signOut()` from `@/shared/lib/auth/auth-client`

---

## Phase 7: Redirect Loop Protection

Move `onRedirect` logic (max 2 redirects for `/profile/setup` and `/dashboard`) to middleware since Better Auth has no redirect callback. This is actually a cleaner location.

---

## Phase 8: Delete Obsolete Files

- `shared/lib/app/auth/oauth-callbacks.ts` — JWT/session callbacks not needed
- `shared/lib/app/auth/credentials-callbacks.ts` — `onAuthorize` replaced by built-in email/password
- `shared/lib/auth/handle-next-auth-error.ts` — redirect error utils obsolete
- `shared/lib/app/session-error-handler.ts` — no longer used
- `shared/lib/app/password.ts` — bcrypt no longer needed (scrypt default)
- `data-access-layer/services/auth/` — `AuthService.signUp` replaced by Better Auth built-in

Update `shared/lib/index.ts` to remove deleted exports.

---

## Phase 9: Update Test Infrastructure

### 9.1 `test/setup/auth-mock.ts`
- Mock `getServerUserId` from `@/auth` (same as before, signature unchanged)
- Add mock for `@/shared/lib/auth/auth-server` → `auth.api.getSession`

### 9.2 `test/setup/client-setup.ts`
- Replace `next-auth/react` mocks with `@/shared/lib/auth/auth-client` mocks
- Mock `authClient.useSession`, `authClient.signIn`, `authClient.signOut`

### 9.3 `test/utils/test-provider.tsx`
- Remove `SessionProvider` wrapper

### 9.4 Server action tests
- Update mocks for sign-in/sign-up to mock Better Auth's API instead of NextAuth's `signIn`

---

## Phase 10: Remove Old Dependencies

```bash
pnpm remove next-auth @auth/prisma-adapter bcryptjs @types/bcryptjs
```

Run `pnpm ci:check` and `pnpm test` to verify everything passes.

---

## Implementation Order

1. Phase 1 (install + config) — can coexist with NextAuth
2. Phase 2 (Prisma migration) — additive, safe
3. Phase 3 (new API route) — **the switch point**
4. Phase 4 (core auth rewrite)
5. Phase 5 (server actions)
6. Phase 6 (providers + client)
7. Phase 7 (redirect protection)
8. Phase 8 (cleanup)
9. Phase 9 (tests)
10. Phase 10 (remove deps)
