# Technical Specification: SavePoint Foundation Replacement (Migrate to TanStack Start)

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Status:** Completed
- **Author(s):** Nail Badiullin

---

## 1. High-Level Technical Approach

Stand up a sibling Next.js-replacement application — `savepoint-tanstack/` — built on **TanStack Start v1 (stable)**. It lives in the same pnpm workspace as `savepoint-app/` but is fully isolated: its own dependencies, its own build, its own routes, its own UI. The two apps share **only** the underlying PostgreSQL database (and a small set of operational facts: same Better Auth secret, same Cognito App Client, same S3 bucket).

The new app is **not deployed** during development. Verification happens locally by running both apps against the same local DB on different ports. When parity is reached across all verticals (auth+profile → IGDB → library → game detail → journal → search → settings), the Vercel project root flips from `savepoint-app/` to `savepoint-tanstack/` in a single PR; this is the user-invisible cutover described in the functional spec.

Methodology: **TDD per slice.** Tests come before implementation for each query function and server function. Integration tests use real PostgreSQL via Docker (already configured for `savepoint-app/`). No E2E layer initially — added after cutover.

DAL philosophy is intentionally simpler than today's four-layer architecture: **server functions + thin query modules, throw on error, no Result wrappers, no handler/use-case/repository split.** Documented in §2.4.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1 Workspace and Project Layout

New top-level package `savepoint-tanstack/` registered in root `pnpm-workspace.yaml`. Mirrors the existing `savepoint-app/` patterns where they still apply (TS strict, Tailwind config, env validation), but does not share runtime code.

| Path | Purpose |
|---|---|
| `savepoint-tanstack/app/` | TanStack Start application root (Vite + TanStack Start config) |
| `savepoint-tanstack/app/routes/` | File-based routes (`__root.tsx`, `index.tsx`, `login.tsx`, `profile.tsx`, `u.$username.tsx`, `games.$slug.tsx`, etc.) |
| `savepoint-tanstack/app/routes/api/auth/$.ts` | Better Auth catch-all handler (Web Request/Response) |
| `savepoint-tanstack/app/lib/db.ts` | Prisma client singleton |
| `savepoint-tanstack/app/lib/queries/` | Domain-organized thin query functions (one file per aggregate) |
| `savepoint-tanstack/app/lib/server-fns/` | `createServerFn`-wrapped action functions; thin Zod + delegate-to-query layer |
| `savepoint-tanstack/app/lib/auth/` | `auth.ts` (BA instance), `auth-client.ts`, `get-session.ts` helper, `AppError` types |
| `savepoint-tanstack/app/lib/storage/` | S3 client + presigned URL helpers (mirrors `savepoint-app/shared/lib/storage/`) |
| `savepoint-tanstack/app/components/` | Shared, non-feature UI primitives (shadcn/ui ports) |
| `savepoint-tanstack/app/features/` | Feature surfaces (auth, profile, library, journal, etc.) — UI + RHF forms only; no server code |
| `savepoint-tanstack/prisma/` | Copy of `schema.prisma` and `migrations/`. **Read-only**: `prisma generate` allowed; `prisma migrate dev` is **not** run from this app. |
| `savepoint-tanstack/env.ts` | Zod-validated env (replaces `env.mjs`); split into `serverEnv` and `clientEnv` |
| `savepoint-tanstack/CLAUDE.md` | App-specific architecture doc, grows per slice |
| `savepoint-tanstack/vite.config.ts` | Vite + TanStack Start plugin |
| `savepoint-tanstack/vitest.config.ts` | Two projects: `unit` and `integration` (no `components` initially; component tests live alongside under jsdom-configured project once needed) |

**Migration ownership rule:** `savepoint-app/` remains the canonical migration source. Every Prisma schema change happens there; the resulting `migration.sql` files are copied into `savepoint-tanstack/prisma/migrations/` so the two apps stay in lockstep without divergent migration histories. `savepoint-tanstack/` runs `prisma generate` only.

### 2.2 TanStack Start Configuration

- **Version:** `@tanstack/react-start` v1 stable, `@tanstack/react-router` v1 stable.
- **Build:** Vite. No SSR adapter beyond TanStack Start defaults; targets Vercel serverless runtime when eventually deployed.
- **Routing:** file-based via `app/routes/`, generated `routeTree.gen.ts` committed.
- **Server functions:** `createServerFn` from `@tanstack/react-start` for all mutations and authenticated queries; route loaders for read-only, cacheable fetches.
- **No RSC.** Every component is client-bundle eligible; data flows via loaders + server functions. Async-component idioms from `savepoint-app/` are rewritten as loader + non-async component pairs.

### 2.3 Authentication (Better Auth)

Same Better Auth instance shape as `savepoint-app/auth.ts`, with framework adapters swapped:

| Concern | `savepoint-app/` (today) | `savepoint-tanstack/` (new) |
|---|---|---|
| Mount | `app/api/auth/[...all]/route.ts` via `toNextJsHandler` | `app/routes/api/auth/$.ts` exporting `auth.handler` directly (Web Request/Response) |
| Cookie persistence on actions | `nextCookies()` plugin | Not needed — TanStack Start uses Web Request/Response and BA's `Set-Cookie` headers flow through natively |
| Server-side session lookup | `getServerUserId()` reading Next `cookies()` | `getServerUserId()` reading the request `Headers` passed into the loader / server fn |
| Client | `authClient` from `better-auth/react` | Same; identical surface |
| Secret + DB | Same `BETTER_AUTH_SECRET`, same DB → sessions valid across both apps | Same |
| Cognito provider | `socialProviders.cognito` | Identical, with one extra Cognito callback URL added during the parallel-run window: `<dev-host>/api/auth/callback/cognito` (dev pool — already on the URL list from spec 020). Production callback added at cutover. |
| `basePath` | `"/api/auth"` (production), `"/api/auth-ba-dev"` was retired | `"/api/auth"` from day one |

**Account-linking rule preserved:** `account.accountLinking.enabled = true`, `trustedProviders: ["cognito"]`. First-time sign-in on the new app reuses the existing `account` row keyed on `accountId = <cognito-sub>`, so no user data fork.

### 2.4 Data Access Layer (DAL Pattern "C2")

Two layers only:

**Query layer** — `app/lib/queries/<aggregate>.ts`. One file per aggregate (`profile.ts`, `library.ts`, `journal.ts`, `game.ts`, `social.ts`, `igdb.ts`). Plain async functions. Direct Prisma calls. Throw on error using `AppError` subclasses (`NotFoundError`, `ConflictError`, `ValidationError`, `UnauthorizedError`, `UpstreamError`). No Result wrapper. No classes. No DI. No mock-friendly seams beyond Prisma's own injection point.

```ts
// app/lib/queries/profile.ts (shape only)
export async function getProfileByUsername(username: string): Promise<Profile> { ... }
export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> { ... }
export async function isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> { ... }
```

**Server-function layer** — `app/lib/server-fns/<aggregate>.ts`. Thin `createServerFn` wrappers. Zod validate input → resolve session → call query function → return data. Translate thrown `AppError` into a serializable failure shape on the client.

```ts
// app/lib/server-fns/profile.ts (shape only)
export const updateProfileFn = createServerFn({ method: "POST" })
  .validator(UpdateProfileSchema)
  .handler(async ({ data, context }) => {
    const userId = context.session?.userId;
    if (!userId) throw new UnauthorizedError();
    return updateProfile(userId, data);
  });
```

**Loader pattern** — for reads: route `loader` calls a query function directly (loaders run on the server). No server function indirection unless the data needs to be re-fetchable from the client mid-route.

**Error rendering** — every route gets an `errorComponent` that branches on `AppError.code`. Top-level `__root.tsx` provides a default fallback.

**ID compatibility** — Better Auth emits 32-char nanoid user IDs (already in DB). Query inputs use `z.string().min(1)`, never `z.string().cuid()` (regression already addressed in spec 020).

### 2.5 Prisma & Database

- `savepoint-tanstack/prisma/schema.prisma` is a copy of `savepoint-app/prisma/schema.prisma`, kept in sync manually (one repo, one PR per migration touches both).
- `savepoint-tanstack/` runs only `prisma generate` and `prisma format`.
- Connection pool: same `POSTGRES_URL` (Neon pooled), same `POSTGRES_URL_NON_POOLING` (used by Prisma for migrations on the canonical app side).
- Singleton client at `app/lib/db.ts` with `globalThis` cache for dev HMR, identical pattern to `savepoint-app/shared/lib/app/db.ts`.

### 2.6 IGDB Integration (Vertical 2)

- Token cache + service-shaped functions ported into `app/lib/queries/igdb.ts` as plain async functions (no class).
- Token state held module-level, refreshed lazily with the same 60-second safety margin as today.
- `app/lib/server-fns/igdb.ts` exposes `searchGamesFn`, `getGameByIdFn`, `getGameBySlugFn`, etc.
- Game persistence (cache into local `Game` table on first lookup) handled by a `lib/queries/game.ts` `upsertGameFromIgdb()` helper.

### 2.7 File Storage (Avatars)

- `app/lib/storage/s3.ts` instantiates the AWS SDK v3 S3 client (same env vars: `S3_BUCKET_NAME`, `S3_AVATAR_PATH_PREFIX`, `AWS_*`, `AWS_ENDPOINT_URL` for LocalStack).
- Presigned PUT generation behind `getAvatarPresignedUrlFn` server function with Zod-validated `contentType` and `contentLength` (10 MB max, image MIME allow-list mirrors today).
- Client uploads directly to S3, then calls `setAvatarUrlFn` to persist the public URL on the user row.

### 2.8 UI Layer (Tailwind + shadcn)

- `tailwind.config.ts` copied verbatim from `savepoint-app/` (theme tokens, `y2k:` namespace, font stack).
- `globals.css` copied; CSS variables identical.
- shadcn primitives copied file-by-file into `app/components/ui/` (Sidebar, Dropdown, Button, Form, Toast, Dialog, etc.). No transitive Next-specific imports — the few that exist (`next/link`, `next/image`, `next/navigation`) are swapped for `@tanstack/react-router`'s `Link`, plain `<img>`, and router hooks.
- Feature UI ported file-by-file per slice. RHF + Zod patterns unchanged.

### 2.9 Slice Plan (TDD per slice; tests precede implementation)

**Vertical 1 — Foundation + Auth + Profile**

| Slice | Deliverable | Verification |
|---|---|---|
| S0 | Workspace scaffold; TanStack Start renders `/`; Vitest configured; Tailwind+shadcn primitives copied; Prisma schema copied + `generate` works; `env.ts` validated | `pnpm --filter savepoint-tanstack typecheck/lint/test` clean; `/` renders |
| S1 | Better Auth wired (`auth.ts` + `routes/api/auth/$.ts`); `getServerUserId()` helper; `auth-client.ts` | Integration test asserts `/api/auth/get-session` returns null when unauth; full BA round-trip test mirrors spec 020's pattern |
| S2 | Login route (`routes/login.tsx`) — Cognito button + (dev-only) credentials form; protected-route `beforeLoad` guard; sign-out via `authClient.signOut()` + `router.invalidate()` | Manual: sign in via Cognito at `localhost:6061` → land on `/profile` → session row in shared DB |
| S3 | DAL conventions doc'd in `savepoint-tanstack/CLAUDE.md`; `lib/db.ts`, `lib/queries/profile.ts`, `lib/server-fns/profile.ts`, `AppError` taxonomy | First query covered by integration test against real Postgres |
| S4 | `/profile` (auth-gated) + `/u/$username` (public) routes; loaders fetch via query layer; ProfileHeader / ProfileStatsBar / OverviewTab / LibraryGrid (read-only) ported | Loader returns proper 404 on unknown user; signed-in user sees own profile correctly |
| S5 | `updateProfileFn`, `checkUsernameFn`; ProfileSettingsForm + UsernameInput + ProfileVisibilityToggle ported; `useUsernameValidation` hook ported | Integration tests for each server function; manual: edit username + visibility, refresh, persisted |
| S6 | Avatar upload: `getAvatarPresignedUrlFn`, `setAvatarUrlFn`, AvatarUpload component ported; S3 client + LocalStack working | Integration: presigned URL is valid against LocalStack; full upload+display flow |
| S7 | Verification + parallel-run check; logger decision (deferred from S0) made and documented | Both apps run simultaneously (`:6060` Next, `:6061` TanStack), session signed in on one is valid on the other |

**Vertical 2 — IGDB**

| Slice | Deliverable |
|---|---|
| S8 | IGDB service ported as `lib/queries/igdb.ts` (token cache + REST calls); `searchGamesFn`, `getGameBySlugFn`, `getGameByIdFn` server functions; integration tests with token-mocked HTTP layer |
| S9 | Add-game flow: search modal UI, select-game → `addGameToLibraryFn` (which `upsertGameFromIgdb` + creates LibraryItem); LibraryItem create path persisted |

**Vertical 3 — Library**

| Slice | Deliverable |
|---|---|
| S10 | `/library` route + loader; library list, status filters, sort, rating filter, platform filter |
| S11 | Library mutations: status change, rating change, platform change, delete (single-entry); ManageLibraryEntry modal + form |
| S12 | Bulk surfaces (parity with current app — multi-select if shipped today, or no-op if still on the roadmap) |

**Vertical 4 — Game Detail**

| Slice | Deliverable |
|---|---|
| S13 | `/games/$slug` route + loader (IGDB lookup, game cache, library entry, journal entries, related games) |
| S14 | Browse-related-games infinite scroll pattern ported (route loader + page params, no TanStack Query needed if loader handles it) |

**Vertical 5 — Journal**

| Slice | Deliverable |
|---|---|
| S15 | `/journal` timeline route + loader |
| S16 | Journal entry CRUD: create / edit / delete server functions + UI |

**Vertical 6 — Search & Command Palette**

| Slice | Deliverable |
|---|---|
| S17 | Command palette (⌘K) — port the existing surface; `searchGamesFn` reused; navigate via TanStack router |

**Vertical 7 — Settings + Social + Onboarding**

| Slice | Deliverable |
|---|---|
| S18 | Settings shell (profile / account sections), follow/unfollow + activity feed + followers/following lists, what's-new modal, first-time onboarding (if shipped) |

**Vertical 8 — Cutover**

| Slice | Deliverable |
|---|---|
| S19 | Final parity audit: every URL in `savepoint-app/` resolves to an equivalent route in `savepoint-tanstack/` |
| S20 | Cutover PR: Vercel project root switched to `savepoint-tanstack/`; production Cognito callback URL added; smoke check across all flows; `savepoint-app/` retained in repo for one release cycle as rollback insurance, then deleted in a follow-up |

---

## 3. Impact and Risk Analysis

### System Dependencies

- **PostgreSQL** (shared DB, Neon in prod / Docker locally). Both apps coexist on the same schema for the duration.
- **Better Auth** (same secret, same Cognito App Client). Sessions interoperable between apps.
- **AWS Cognito** (existing dev + prod App Clients). At cutover, the old NextAuth callback URL is removed from the prod App Client and replaced with the TanStack callback (already same path: `/api/auth/callback/cognito`).
- **AWS S3** (avatars bucket; LocalStack locally).
- **IGDB API** (Twitch OAuth; same credentials).
- **Vercel** (single project; root path swap at cutover).
- **`savepoint-app/`** retains migration ownership and the dormant Steam/SQS surfaces; not touched by this spec until cutover.

### Potential Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Session fork at cutover** — users signed in on old app land on new app and find themselves logged out | Same `BETTER_AUTH_SECRET`, same DB `session` table, same cookie name (BA default), same domain. Verified during S7 parallel-run. |
| **Schema drift between apps** | Lint rule / commit hook / CI step that diffs the two `schema.prisma` files and blocks PRs where they're out of sync. Implementation deferred to S0. |
| **RSC removal regressions** | Every route migration includes a manual smoke check against the canonical app. The functional spec's AC list (§2.1–2.6) acts as the parity checklist. |
| **TanStack Start v1 quirks** in route loaders + server functions (e.g., context propagation, header forwarding) | Investigated in S1 (BA wiring). If blockers surface, fall back to plain Vite + react-router or revisit before S2. |
| **`use cache` features lost** | Read-heavy routes that today rely on `"use cache"` (game detail, IGDB search) move to loader-level caching using TanStack Router's built-in stale-time / `staleTime` + `gcTime` controls. Revisit if performance regresses observably. |
| **Avatar URL format change** breaks existing rendering | Avatar paths are unchanged (same bucket + prefix). No data migration. |
| **Rollback after cutover** | `savepoint-app/` retained in repo + Vercel project root is a one-line swap. Rolling back = revert the cutover PR. No data migration to undo. |
| **Steam/SQS dormant code** drifts further | Out of scope; remains in `savepoint-app/` indefinitely (declared dead in functional spec out-of-scope). |
| **`nextCookies()`-shaped bug** (sessions silently not persisting on server actions) | Caught early in S1 by an integration test that signs in via Cognito ID-token shortcut and asserts a `Set-Cookie` header on the response, mirroring the spec 020 test. |
| **Accidental migration run from `savepoint-tanstack/`** | `savepoint-tanstack/package.json` does not expose `prisma migrate` scripts; only `generate` and `format`. Documented in `savepoint-tanstack/CLAUDE.md`. |
| **Logger decision deferred too long** | Decision deadline is end of S7. Default-on if no decision: copy `pino` setup verbatim. |

---

## 4. Testing Strategy

**TDD per slice.** Every query function and every server function has a test written before the implementation. No test-after for new code in this spec.

**Test taxonomy (matches `savepoint-app/` patterns):**

- **Unit (`*.unit.test.ts`)** — pure helpers, error mapping, Zod schema edge cases, IGDB token-cache logic. Vitest node env. Mocked Prisma where used. Located alongside source.
- **Integration (`*.integration.test.ts`)** — query functions and server functions against a real PostgreSQL database (per-test isolated DB, mirroring spec 020's `better-auth-cognito-sign-in.integration.test.ts` pattern). Includes BA sign-in/session round-trip, account-linking assertions, and at least one CRUD path per aggregate. Vitest node env, sequential.
- **Component (`*.test.tsx`)** — added per slice as components are ported. Vitest jsdom env, MSW for any client-side fetch (rare; mostly loader-driven). Initially limited; expanded if a UI surface gets non-trivial logic.
- **E2E** — explicitly **out of scope**. Added after cutover.

**Coverage:** No global threshold during the migration; the parity checklist in the functional spec is the bar. Once cutover lands, `savepoint-tanstack/` adopts the same 80% threshold as today.

**CI:** New `pr-checks-tanstack.yml` workflow added in S0, path-conditional on `savepoint-tanstack/**`. Runs typecheck, lint, unit, integration. Migration drift check (schema parity) added at S0 or S1.

**Local verification per slice:**

1. `pnpm --filter savepoint-tanstack typecheck` clean
2. `pnpm --filter savepoint-tanstack lint` clean
3. `pnpm --filter savepoint-tanstack test` green
4. Manual smoke at `localhost:6061` against the slice's deliverable
5. Cross-app session check (S2 onward): sign in on one port, refresh the other, confirm session shared

---
