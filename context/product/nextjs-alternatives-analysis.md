# Next.js Alternatives Analysis for SavePoint

## Executive Summary

SavePoint's architecture is **well-positioned for a framework migration**. Thanks to the layered architecture (Repository → Service → Use-Case → Presentation), approximately **~70-80% of business logic has zero Next.js coupling**. The main migration cost is in the presentation layer, auth system, and server action patterns — not in core business logic.

---

## 1. Current Next.js Coupling Inventory

| Category | Files Affected | Coupling Level |
|----------|---------------|----------------|
| Next.js imports (`next/*`) | 88 files (14.6%) | High |
| Server Actions (`"use server"`) | 34 files | High |
| Client Components (`"use client"`) | 109 files | Low (just a directive) |
| API Routes (`app/api/`) | 10 files | Medium |
| NextAuth v5 | 27 files | Very High |
| Pages & Layouts | 15 files | High |
| Caching (`revalidatePath`, `unstable_cache`) | 78 instances | Medium |
| Middleware | 1 file | Low |
| Metadata/SEO (`generateMetadata`) | 5 files | Medium |

---

## 2. What's Fully Portable (Zero Effort)

These layers have **no Next.js imports** and can be used as-is with any Node.js framework:

| Layer | Location | Notes |
|-------|----------|-------|
| **Repository Layer** | `data-access-layer/repository/` | Pure Prisma operations |
| **Service Layer** (most) | `data-access-layer/services/` | `ServiceResult<T>` pattern, Pino logging |
| **Domain Models** | `data-access-layer/domain/` | Pure TypeScript types, DTOs, mappers |
| **Shared Types** | `shared/types/` | Pure interfaces |
| **Zod Schemas** | `features/*/schemas.ts` | Framework-agnostic validation |
| **Prisma Schema** | `prisma/schema.prisma` | Works with any Node.js framework |
| **Utilities** | `shared/lib/` (most) | date, rate-limit, string, platform-mapper, S3, Steam utils |
| **Logger** | `shared/lib/app/logger.ts` | Pino — no Next.js dependency |
| **Config/Constants** | `shared/config/`, `shared/constants/` | Pure TypeScript |

**Estimated portable code: ~80% of actual business logic.**

### Minor Adaptations Needed

- Remove `"server-only"` imports from `shared/lib/app/db.ts` and a few service files
- Remove `"use server"` from use-cases (logic inside is 100% portable)
- Replace `@t3-oss/env-nextjs` with standard Zod env validation

---

## 3. What Must Be Replaced

### 3.1 Authentication (NextAuth v5) — **Highest barrier**
- 27 files, deeply integrated
- AWS Cognito OAuth flow configured via NextAuth
- PrismaAdapter for session persistence
- JWT strategy with custom callbacks
- `getServerUserId()` / `auth()` used across all protected pages

### 3.2 Server Actions (34 files)
- All mutations go through `"use server"` functions
- Heavy use of `revalidatePath()` for cache invalidation (70 instances)
- `next-safe-action` library for type-safe action creation
- Would become standard API endpoints + client-side mutation calls

### 3.3 App Router Pages (15 files)
- Server Components calling services directly
- `generateMetadata()` for dynamic SEO
- Route groups `(protected)` for auth enforcement
- Suspense boundaries with skeleton fallbacks
- Promise-based `params`/`searchParams` (Next.js 15 pattern)

### 3.4 API Routes (10 files)
- `NextRequest`/`NextResponse` types
- `unstable_cache` for server-side caching
- Thin adapters over handlers/services — logic is portable

### 3.5 Image Optimization (9 files)
- `next/image` with remote patterns for IGDB and Steam CDNs

---

## 4. Framework Alternatives

### Option A: React Router v7 (Remix)

**Maturity**: Production-ready, large ecosystem
**Philosophy**: Web standards, progressive enhancement, server/client split

| Aspect | Fit for SavePoint |
|--------|-------------------|
| **Routing** | File-based routing similar to Next.js App Router. Route groups, nested layouts, dynamic segments all supported. |
| **Data Loading** | `loader` functions (server) replace RSC data fetching. Services can be called directly in loaders. |
| **Mutations** | `action` functions replace server actions. Similar mental model — form submissions handled server-side. |
| **Auth** | No built-in auth. Use `remix-auth` (similar to Passport.js) or roll your own with AWS Cognito SDK directly. |
| **Caching** | HTTP caching headers + `clientLoader`/`clientAction` for client-side cache. No built-in revalidation — use TanStack Query (already in stack). |
| **SSR/SSG** | Full SSR support. No RSC (React Server Components). All components are "universal." |
| **Image** | No built-in optimization. Use `unpic-img` or a CDN (Cloudflare Images, imgproxy). |
| **Deployment** | Runs on any Node.js server, Cloudflare Workers, Deno, etc. Not tied to Vercel. |

**Migration effort**: Medium
**Pros**: Web-standard forms, loaders/actions map well to existing service layer, flexible deployment
**Cons**: No RSC (lose automatic server/client splitting), need to replace image optimization, auth requires manual setup

---

### Option B: TanStack Start

**Maturity**: Beta (as of early 2026), rapidly evolving
**Philosophy**: Full-stack type safety, server functions, TanStack Router integration

| Aspect | Fit for SavePoint |
|--------|-------------------|
| **Routing** | File-based with TanStack Router. Type-safe routes (already have `typedRoutes` in Next.js config). |
| **Data Loading** | `createServerFn` for server functions — similar to server actions but more flexible. Services callable directly. |
| **Mutations** | Server functions + TanStack Query mutations. You already use TanStack Query — natural fit. |
| **Auth** | No built-in auth. Integrate AWS Cognito directly or use a library. |
| **Caching** | TanStack Query is the cache layer (already in your stack). `staleTime`/`gcTime` already configured. |
| **SSR/SSG** | Full SSR support. Server functions provide server/client boundary. |
| **Image** | No built-in optimization. Same solution as React Router. |
| **Deployment** | Runs on Vinxi/Nitro — Node.js, Bun, edge runtimes, etc. |

**Migration effort**: Medium-High (beta API may shift)
**Pros**: Leverages existing TanStack Query investment, excellent TypeScript DX, server functions replace both API routes and server actions
**Cons**: Beta stability risk, smaller community, less battle-tested in production

---

### Option C: Hono + React SPA (or Hono + htmx)

**Maturity**: Production-ready (Hono), but this is a "build your own framework" approach
**Philosophy**: Lightweight server, client-side React (or hypermedia with htmx)

| Aspect | Fit for SavePoint |
|--------|-------------------|
| **Routing** | Hono server routes + React Router (client) or file-based with Vite plugin. |
| **Data Loading** | Hono API routes calling your services directly. Clean REST or RPC style. |
| **Mutations** | Standard HTTP endpoints. Client uses TanStack Query `useMutation`. |
| **Auth** | `hono/jwt` middleware or integrate AWS Cognito SDK. Full control. |
| **Caching** | HTTP headers + TanStack Query client-side. Redis/Memcached for server-side. |
| **SSR** | Optional — can do SSR with React or skip it entirely (SPA). |
| **Image** | Use a CDN or image proxy service. |
| **Deployment** | Cloudflare Workers, AWS Lambda, Node.js, Bun, Deno — extremely flexible. |

**Migration effort**: High (more assembly required)
**Pros**: Maximum flexibility, Hono is extremely fast, your entire service layer plugs in trivially, great for API-first architecture
**Cons**: No SSR out of the box (unless added), more decisions to make, lose RSC benefits, need to assemble pieces yourself

---

### Option D: SvelteKit

**Maturity**: Production-ready, v2 stable
**Philosophy**: Compiler-first, less JavaScript shipped to client

| Aspect | Fit for SavePoint |
|--------|-------------------|
| **Routing** | File-based routing with layouts, groups, dynamic params. Very similar to Next.js App Router. |
| **Data Loading** | `+page.server.ts` load functions. Services callable directly — excellent fit. |
| **Mutations** | Form actions (similar to Remix). Progressive enhancement built-in. |
| **Auth** | No built-in auth. Use `lucia-auth` (Prisma compatible) or AWS Cognito SDK. |
| **Caching** | `invalidateAll()` / `invalidate()` for revalidation. HTTP caching for API routes. |
| **SSR/SSG** | Full SSR, SSG, and hybrid. Adapters for Node, Vercel, Cloudflare, etc. |
| **Image** | `@sveltejs/enhanced-img` for optimization. |
| **Deployment** | Adapters for any platform. |

**Migration effort**: Very High
**Pros**: Smaller bundles, great performance, excellent DX, form actions map well to your mutation pattern
**Cons**: **Full UI rewrite required** (Svelte, not React). All 109+ React components must be rewritten. shadcn/ui has a Svelte port but it's community-maintained. Lose entire React ecosystem investment.

---

### Option E: Astro + React Islands

**Maturity**: Production-ready (v4+)
**Philosophy**: Content-first, ship zero JS by default, hydrate only interactive islands

| Aspect | Fit for SavePoint |
|--------|-------------------|
| **Routing** | File-based, similar to Next.js. |
| **Data Loading** | Astro components fetch data at build/request time. Can call your services in `.astro` files. |
| **Mutations** | API routes (like Next.js) + `astro:actions` (similar to server actions). |
| **Auth** | `auth-astro` or manual integration. |
| **SSR** | Full SSR with adapters. React components render as islands with `client:*` directives. |
| **Deployment** | Node, Cloudflare, Vercel, Netlify, etc. |

**Migration effort**: High
**Pros**: Keep React components as islands, excellent performance (zero JS by default), your service layer works perfectly in Astro server code
**Cons**: Different mental model (content-first, not app-first), islands architecture may feel limiting for a highly interactive app like a game library manager, less suited for SPA-like experiences

---

## 5. Comparison Matrix

| Criteria | React Router v7 | TanStack Start | Hono + React SPA | SvelteKit | Astro |
|----------|-----------------|----------------|-------------------|-----------|-------|
| **React reuse** | 95% | 95% | 90% | 0% (rewrite) | 70% (islands) |
| **Service layer reuse** | 100% | 100% | 100% | 100% | 100% |
| **Auth migration** | Medium | Medium | Medium | Medium | Medium |
| **Ecosystem maturity** | High | Medium | High (Hono) | High | High |
| **TypeScript DX** | Good | Excellent | Good | Good | Good |
| **SSR support** | Yes | Yes | Optional | Yes | Yes |
| **Deployment flexibility** | High | High | Very High | High | High |
| **Community/plugins** | Large | Growing | Medium | Large | Large |
| **Migration effort** | **Medium** | **Medium-High** | **High** | **Very High** | **High** |
| **Risk level** | Low | Medium (beta) | Low | Low | Low |

---

## 6. Recommended Migration Strategy

### Recommended: React Router v7 (Remix)

**Why**: Best balance of React code reuse, mature ecosystem, and architectural fit.

### Phased Migration Plan

#### Phase 0: Extract Core Package (1-2 days)
Create a shared package with all portable code:
```
packages/
├── savepoint-core/
│   ├── repository/      ← data-access-layer/repository/
│   ├── services/        ← data-access-layer/services/
│   ├── domain/          ← data-access-layer/domain/
│   ├── types/           ← shared/types/
│   ├── schemas/         ← features/*/schemas.ts
│   ├── lib/             ← shared/lib/ (portable utils)
│   └── prisma/          ← prisma/
```

#### Phase 1: Auth Migration (3-5 days)
- Replace NextAuth with direct AWS Cognito integration using `remix-auth` + `remix-auth-oauth2`
- Alternatively: use `@auth/core` (the framework-agnostic part of NextAuth) directly
- Adapt `getServerUserId()` to work with new auth system

#### Phase 2: API & Data Layer (2-3 days)
- Convert 10 API routes to React Router resource routes
- Replace `unstable_cache` with HTTP caching headers + TanStack Query
- Replace `revalidatePath` with TanStack Query `invalidateQueries`

#### Phase 3: Server Actions → Route Actions (3-5 days)
- Convert 34 server actions to React Router `action` functions
- Use `useFetcher` for non-navigation mutations
- Replace `next-safe-action` with Zod validation in actions (schemas already exist)

#### Phase 4: Pages & Layouts (3-5 days)
- Convert 15 pages/layouts to React Router routes
- Replace `generateMetadata` with React Router `meta` function
- Convert route groups to layout routes

#### Phase 5: Components & Polish (2-3 days)
- Replace `next/image` with `<img>` + CDN or `unpic-img`
- Replace `next/link` with React Router `<Link>`
- Replace `next/navigation` hooks with React Router equivalents
- Update middleware logic to Express/Hono middleware or proxy config

**Total estimated migration: 2-3 weeks for a focused developer.**

---

## 7. What You Keep No Matter What

Regardless of which framework you choose, these are **permanently yours**:

- All Prisma models, migrations, and schema
- All repository functions (game, library, journal, user, review, platform, genre)
- All service classes (Game, Library, Journal, Platform, Profile, IGDB, ImportedGame, Onboarding)
- All domain models, DTOs, and mappers
- All Zod validation schemas
- All shared utilities (date, rate-limit, string, platform-mapper, S3, Steam)
- All TypeScript type definitions
- TanStack Query hooks and patterns (framework-agnostic)
- Pino logging setup
- Docker/PostgreSQL configuration
- Terraform infrastructure (AWS Cognito, etc.)

---

## 8. Pre-Migration: NextAuth → Better Auth (on Next.js)

**Recommended first step before any framework migration.** Swap auth while everything else stays stable.

### Why Migrate Auth First

1. **Decouple risks** — change one thing at a time, not auth + framework simultaneously
2. **Better Auth supports both Next.js and TanStack Start** — migrate auth once, carry it forward
3. **Better Auth has a first-class Prisma adapter** — your existing DB works
4. **Native AWS Cognito provider** — dedicated support, not generic OAuth
5. **Official NextAuth migration guide** exists

### Current Auth Architecture

```
auth.ts (NextAuth v5 config)
  ├── Providers: Cognito (primary), Credentials (dev/test)
  ├── Strategy: JWT (30-day max age, 24h update)
  ├── Adapter: @auth/prisma-adapter (PrismaAdapter)
  └── Callbacks: onSignIn, onRedirect, onJwt, onSession

getServerUserId()          → auth() → session.user.id (CUID)
requireServerUserId()      → cached wrapper, redirects to /login
getOptionalServerUserId()  → cached wrapper, returns null if anon

createServerAction()       → calls getServerUserId() when requireAuth=true
SessionProvider            → next-auth/react (client-side, refetch every 5min)
```

### Database Schema: What Changes

**User table — NO CHANGES.** All app-managed fields stay exactly as-is.

| Table | Current (NextAuth) | Target (Better Auth) | Action |
|-------|-------------------|---------------------|--------|
| **User** | `emailVerified DateTime?` | `emailVerified Boolean` | Alter column type |
| **User** | `name String?`, `email String?` | `name String`, `email String` | Make non-nullable (already populated via Cognito) |
| **Session** | `sessionToken String` | `token String` | Rename column OR use field mapping |
| **Session** | `expires DateTime` | `expiresAt DateTime` | Rename column OR use field mapping |
| **Session** | — | `ipAddress String?`, `userAgent String?` | Add columns |
| **Session** | — | `createdAt`, `updatedAt` | Add columns |
| **Account** | `type String` | — | Drop column |
| **Account** | `provider String` | `providerId String` | Rename column OR use field mapping |
| **Account** | `providerAccountId String` | `accountId String` | Rename column OR use field mapping |
| **Account** | `access_token` (snake_case) | `accessToken` (camelCase) | Rename OR field mapping |
| **Account** | `refresh_token` | `refreshToken` | Rename OR field mapping |
| **Account** | `expires_at Int?` | `accessTokenExpiresAt DateTime?`, `refreshTokenExpiresAt DateTime?` | Split into two |
| **Account** | `token_type`, `session_state` | — | Drop columns |
| **Account** | — | `password String?`, `createdAt`, `updatedAt` | Add columns |
| **VerificationToken** | `identifier + token + expires` | `id + identifier + value + expiresAt + createdAt + updatedAt` | Restructure |

**Strategy choice**: Use Better Auth's **field mapping** to avoid column renames, OR write a Prisma migration. Field mapping is safer for zero-downtime.

### Existing User Records: How They Survive

1. `User.id` is a CUID generated by Prisma — **never changes**
2. All app data (`LibraryItem`, `JournalEntry`, `Review`, `ImportedGame`) references `User.id` via FK — **untouched**
3. When an existing user logs in via Cognito after the switch:
   - Better Auth looks up by **email** → finds existing User row
   - Creates a new `Account` row linking Cognito to the existing `User.id`
   - All data relationships preserved through the unchanged CUID

**No data loss. No orphaned records. No FK changes needed on app tables.**

### Files to Change (Complete Checklist)

#### Critical (auth core) — 5 files
| File | Change |
|------|--------|
| `auth.ts` | **Replace entirely** — new Better Auth config with Cognito provider, Prisma adapter |
| `app/api/auth/[...nextauth]/route.ts` | **Replace** — Better Auth uses `/api/auth/[...all]/route.ts` with `auth.handler` |
| `shared/lib/app/auth.ts` | **Update** — `requireServerUserId()` and `getOptionalServerUserId()` call Better Auth's `auth.api.getSession()` instead of `auth()` |
| `shared/lib/app/auth/oauth-callbacks.ts` | **Delete** — Better Auth handles callbacks differently (hooks/events) |
| `shared/lib/app/auth/credentials-callbacks.ts` | **Delete** — Better Auth has built-in email/password plugin |

#### High priority (consuming auth) — 7 files
| File | Change |
|------|--------|
| `shared/lib/server-action/create-server-action.ts` | Update `getServerUserId` import (same function signature, just new internals) |
| `shared/providers/providers.tsx` | Remove `SessionProvider` from `next-auth/react`, no equivalent needed (Better Auth uses cookies) |
| `features/auth/server-actions/sign-in.ts` | Replace `signIn("credentials", ...)` with Better Auth `authClient.signIn.email()` |
| `features/auth/server-actions/sign-up.ts` | Replace `signIn()` + `AuthService.signUp()` with Better Auth `authClient.signUp.email()` |
| `features/auth/server-actions/sign-in-google.ts` | Replace `signIn("cognito", ...)` with Better Auth `authClient.signIn.social({ provider: "cognito" })` |
| `features/profile/ui/logout-button.tsx` | Replace `signOut()` from `next-auth/react` with Better Auth `authClient.signOut()` |
| `shared/lib/auth/handle-next-auth-error.ts` | **Delete** — NextAuth-specific error handling |

#### Medium priority (pages using `auth()` directly) — 3 files
| File | Change |
|------|--------|
| `app/page.tsx` | Replace `auth()` with Better Auth session check |
| `app/login/page.tsx` | Replace `auth()` with Better Auth session check |
| `app/games/search/page.tsx` | Replace `auth()` with Better Auth session check |

#### Low priority (no code changes needed) — ~20 files
All files that only use `requireServerUserId()` or `getOptionalServerUserId()` (protected layouts, pages, API routes, server actions) — **these don't change** since the wrapper functions keep the same signature.

#### Tests — 8 files
| File | Change |
|------|--------|
| `test/setup/auth-mock.ts` | Update mock to match Better Auth session shape |
| `test/setup/client-setup.ts` | Remove `next-auth/react` mocks |
| `test/utils/test-provider.tsx` | Remove `SessionProvider` |
| `features/auth/server-actions/*.server-action.test.ts` (3) | Update mocks for new sign-in/sign-up functions |
| `e2e/helpers/auth.ts` | Update E2E auth flow (session endpoint changes) |
| `e2e/profile.spec.ts` | Update session assertions |

#### Environment variables
| Current | Better Auth |
|---------|------------|
| `AUTH_SECRET` | `BETTER_AUTH_SECRET` |
| `AUTH_URL` | `BETTER_AUTH_URL` |
| `AUTH_COGNITO_ID` | Same (rename optional) |
| `AUTH_COGNITO_SECRET` | Same |
| `AUTH_COGNITO_ISSUER` | Split into `domain` + `region` |
| `AUTH_ENABLE_CREDENTIALS` | Better Auth email/password plugin toggle |
| `AUTH_GOOGLE_ID/SECRET` | Remove (Google goes through Cognito) |

### Migration Steps

```
Step 1: Install dependencies
  pnpm add -E better-auth @better-auth/prisma-adapter
  pnpm remove next-auth @auth/prisma-adapter

Step 2: Create Better Auth config (new auth.ts)
  - Configure Prisma adapter with field mappings
  - Add Cognito social provider
  - Optionally add email/password plugin for dev

Step 3: Prisma schema migration
  Option A: Field mapping (no schema changes, configure in Better Auth)
  Option B: Prisma migration (rename columns, add new ones)

Step 4: Update auth API route
  - Replace [...nextauth] with Better Auth handler

Step 5: Update getServerUserId / requireServerUserId
  - Call auth.api.getSession({ headers }) instead of auth()
  - Same return type (string | undefined)

Step 6: Update client-side auth
  - Remove SessionProvider from providers.tsx
  - Create Better Auth client: createAuthClient()
  - Update sign-in, sign-up, sign-out calls
  - Update logout button

Step 7: Delete NextAuth artifacts
  - oauth-callbacks.ts
  - credentials-callbacks.ts
  - handle-next-auth-error.ts

Step 8: Update tests
  - Adjust auth mocks
  - Remove next-auth/react mocks
  - Update E2E auth helpers

Step 9: Update env.mjs
  - New env var names/validation
```

### After Auth Migration: Path to TanStack Start

With Better Auth in place on Next.js, the TanStack Start migration becomes **purely a framework concern**:

1. Better Auth's TanStack Start integration is a drop-in (`tanstackStartCookies()` plugin)
2. `getServerUserId()` becomes a TanStack `createServerFn` — same logic, different wrapper
3. No auth re-migration needed — carry Better Auth config forward as-is
4. Focus entirely on routing, data loading, and server functions

---

## 9. Alternative Approach: Keep Next.js, Reduce Lock-in

If the goal is reducing vendor lock-in rather than fully replacing Next.js:

1. **Extract `savepoint-core` package** — Make business logic independently testable/deployable
2. **Minimize Next.js surface area** — Move caching to TanStack Query, reduce `revalidatePath` usage
3. **Migrate auth to Better Auth** (Section 8) — Framework-agnostic auth
4. **Use standard `<img>` tags** — Drop `next/image` dependency
5. **Containerize** — Run Next.js standalone (not Vercel-dependent) with `output: "standalone"` in next.config

This gets you 80% of the portability benefit with 20% of the migration effort.
