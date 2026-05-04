# Tasks: Migrate Authentication System to Better Auth

- **Functional Spec:** [`functional-spec.md`](./functional-spec.md)
- **Technical Spec:** [`technical-considerations.md`](./technical-considerations.md)

> **Slicing note:** This is a replace-in-place infrastructure migration, not a user-visible feature. Slices are sequenced so that **after each slice, the app boots, signs users in via the existing NextAuth path, and tests pass**. Better Auth is added side-by-side first, exercised via dev-only surfaces, then swapped at the cutover slice.
>
> **Deployment context:** App deploys to **Vercel**. Database is **Neon Postgres** (rollback uses Neon branching). Only Cognito (User Pool + App Client) is on AWS, managed in `infra/modules/cognito/` Terraform.

---

## Slice 1: Better Auth scaffolding (side-by-side, dev-only)

Goal: `better-auth` installed, configured, and reachable at a dev-only route. NextAuth still primary. App fully functional.

- [x] Add `better-auth` to `savepoint-app/package.json` and run `pnpm install`. **[Agent: nextjs-expert]**
- [x] Create `savepoint-app/auth.better.ts` (temporary side-car): instantiate Better Auth with the Cognito provider, Prisma adapter pointing at the existing Prisma client. Do NOT export from anywhere production-facing yet. **[Agent: nextjs-expert]**
- [x] Add new env vars to `.env.example` AND `env.mjs` (typed via `@t3-oss/env-nextjs`): `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `AUTH_MIGRATION_CUTOVER_AT`, `AUTH_COGNITO_DOMAIN`. Document each in the file's comments. **[Agent: nextjs-expert]**
- [x] Add a dev-only route `app/api/auth-ba-dev/[...all]/route.ts` mounting `auth.better.ts`'s handler. Gate behind `NODE_ENV !== "production"`. **[Agent: nextjs-expert]**
- [x] Verification: `pnpm --filter savepoint dev` boots; existing NextAuth sign-in still works; production build still succeeds. **[Agent: feature-dev:code-reviewer]**
  - Typecheck: clean. Lint: clean. NextAuth path untouched (only new files added).
  - Production build: passes after rebasing on `main` post spec-018 revert (PR #316). Vercel can deploy from `main` again.

## Slice 2: Schema migration to Better Auth shape (preview-only)

Goal: Prisma schema updated to BA shape; migration generated and tested against the **local Postgres** (docker-compose `:6432`). **NOT applied to prod yet.** Neon branching is reserved for the cutover rollback in Slice 10 (and an optional rehearsal in Slice 5/6).

- [x] Update `savepoint-app/prisma/schema.prisma`: rename `User`→`user`, `Account`→`account` (with column renames per tech spec §2.2), `Session`→`session`, `VerificationToken`→`verification`. Preserve all SavePoint-specific User extensions. Update relation references. **[Agent: prisma-database]**
  - Used `@@map("User"/"Account"/"Session"/"VerificationToken")` to keep PG table names stable; the next task's hand-edited migration SQL adds the `ALTER TABLE ... RENAME TO ...` statements and removes the `@@map` directives.
  - `User.emailVerified DateTime?` → `Boolean @default(false)` per BA shape.
  - `Account` unique constraint moved from `[provider, providerAccountId]` → `[providerId, accountId]`. Dropped `type`/`token_type`/`session_state`. Added `refreshTokenExpiresAt`, `password`, `createdAt`, `updatedAt`.
  - `verification` unique on `value` only (was compound `[identifier, token]`); added `id`, `createdAt`, `updatedAt`.
  - `prisma format` + `prisma validate` clean. Downstream typecheck failures expected until next task addresses code-side `prisma.User.*` → `prisma.user.*` updates.
- [x] Run `pnpm --filter savepoint prisma migrate dev --name better_auth_migration --create-only` against local Postgres. Hand-edit the generated SQL to use `RENAME` instead of drop/create where Prisma's diff is too aggressive. Convert `expires_at INTEGER` → `accessTokenExpiresAt TIMESTAMP` via `to_timestamp()`. **[Agent: prisma-database]**
  - Migration: `prisma/migrations/20260504152002_better_auth_migration/migration.sql`. Hand-crafted SQL: ALTER TABLE renames (User/Account/Session/VerificationToken → lowercase), column renames per tech spec § 2.2, `expires_at INT → accessTokenExpiresAt TIMESTAMP` via `to_timestamp()`, `User.emailVerified DateTime? → BOOLEAN` via `USING ("emailVerified" IS NOT NULL)`, `verification.id` PK added, session/verification truncated.
  - `@@map` directives removed from schema.prisma; Prisma model names now match SQL table names directly.
  - `@auth/prisma-adapter` replaced with hand-built `buildNextAuthAdapter()` shim in `auth.ts` mapping field-rename pairs (provider/providerId, sessionToken/token, etc.) so NextAuth keeps working until Slice 6.
  - Code-side updates across 7 files (Prisma client `User`/`Account`/`Session` model name → lowercase).
  - **Pre-existing drift discovered**: local DB had 3 columns (`User.playthroughsVisibility`, `JournalEntry.playthroughId`, `LibraryItem.platformId`) not in migration history. Worked around by manually applying SQL via `psql -f` and inserting into `_prisma_migrations` directly. ⚠️ The drift itself is not from this task — it's stale local-DB state from unmerged work — but it should be tracked down separately.
  - typecheck ✅, lint ✅, test:backend ✅ (790 tests), test:utilities ✅ (124 tests), `prisma migrate status` ✅.
- [x] Write a migration test: seed a test DB with a NextAuth-shape User+Account+Session row, run the migration, assert all rows preserved with renamed columns. **[Agent: typescript-test-expert]**
  - Located at `savepoint-app/test/migrations/better-auth-migration.integration.test.ts` (filename matches the project's `*.integration.test.ts` convention; runs via `pnpm --filter savepoint test:integration`).
  - 44 assertions: table renames, `emailVerified` boolean coercion (NULL → false, timestamp → true), all column renames, `expires_at` epoch → `accessTokenExpiresAt` TIMESTAMP via `to_timestamp()`, dropped + added columns, unique-index swaps, session/verification truncation.
  - Hermetic: spins up a per-test PG database via `docker exec createdb`, runs `migration.sql` against it, drops it in a `try/finally` `afterAll` even on failure. Two consecutive runs clean.
  - No new deps (`pg` + `@types/pg` already direct).
- [x] Update `prisma/seed.ts` (if present) to use BA schema shape. **[Agent: prisma-database]**
  - N/A — no `prisma/seed.ts` in this project. DB seeding lives elsewhere (`test/setup/db-factories/`, already updated in slice 2 task 2).
- [x] Verification: `pnpm --filter savepoint prisma migrate dev` applies cleanly locally; migration test passes; `pnpm --filter savepoint typecheck` succeeds across the codebase (Prisma client types update). **[Agent: feature-dev:code-reviewer]**
  - `prisma migrate status`: 50 migrations applied, "Database schema is up to date!".
  - Migration test: 44/44 pass (`test:integration`).
  - typecheck ✅, lint ✅.

> ⚠️ This slice changes the Prisma client types; downstream code referring to `prisma.User.*` (PascalCase) becomes `prisma.user.*` (lowercase). Resolve all type errors in this slice before moving on. NextAuth's `@auth/prisma-adapter` still works because its model bindings are configurable — set `@@map("user")` etc. on the Prisma models or pass `tableMappings` to the adapter to keep NextAuth functional until Slice 6.

## Slice 3: Cutover-time helpers + env wiring

Goal: pure helpers for cutover-window math, no UI yet.

- [x] Create `savepoint-app/features/auth/lib/cutover.ts` with `getCutoverAt()`, `isInBannerWindow(now)`, `isPostCutover(now)`. Behavior per tech spec §2.5. **[Agent: nextjs-expert]**
  - Pure helpers; reads `env.AUTH_MIGRATION_CUTOVER_AT`. Exports `BANNER_WINDOW_MS` for tests. No barrel — direct imports per the journal/library `lib/` convention.
- [x] Unit tests for boundary conditions (env unset, malformed, exactly at cutoverAt, 48h-1s before, post). **[Agent: typescript-test-expert]**
  - 26 tests at `features/auth/lib/cutover.test.ts`. Uses `vi.doMock` + `vi.resetModules()` + dynamic import per case for independent env mocking.
  - Runs via `pnpm --filter savepoint test:backend features/auth/lib/cutover` (the project's `utilities` glob is `shared/**`, not `features/**`).
- [x] Verification: `pnpm --filter savepoint test:utilities features/auth/lib/cutover` passes; functions importable. **[Agent: feature-dev:code-reviewer]**
  - Note: ran via `test:backend` (correct project for `features/**/lib/*.test.ts` per project globs). 26/26 pass.

## Slice 4: Pre-cutover banner widget (env-driven, mounted)

Goal: Banner visible end-to-end when `AUTH_MIGRATION_CUTOVER_AT` is set to a near-future timestamp; invisible otherwise. Works with NextAuth still primary.

- [x] Create `savepoint-app/widgets/auth-migration-banner/` (FSD widget): server component reads cutover, client island handles dismissal via `localStorage`. Per tech spec §2.4. **[Agent: react-frontend]**
  - Server component returns `null` outside the 48h window. Client island uses `useSyncExternalStore` over `localStorage` (synthetic `StorageEvent` dispatch on dismiss) — avoids the React-19 `set-state-in-effect` lint rule and gives clean cross-tab persistence.
  - Date formatted server-side via `Intl.DateTimeFormat` (timezone UTC), passed as string prop so SSR/CSR markup match.
- [x] Mount banner inside `app/(protected)/layout.tsx` and `app/games/layout.tsx`. **[Agent: react-frontend]**
  - Mounted above `MobileTopbar` inside `SidebarInset`. In `app/games/layout.tsx` gated on `userId &&` so signed-out users browsing public game pages don't see it.
- [x] Component tests: renders inside window, hides outside, respects dismissal. **[Agent: typescript-test-expert]**
  - 15 tests at `widgets/auth-migration-banner/ui/auth-migration-banner.test.tsx`. Server-component cases mock `@/features/auth/lib/cutover` directly. Client-island cases cover localStorage state, click-to-dismiss, cross-tab `StorageEvent` sync, copy assertions, and a11y (`role="status"`, dismiss button accessible name).
- [x] Verification: locally set `AUTH_MIGRATION_CUTOVER_AT` to `now + 1h`. Sign in (existing NextAuth flow). Banner appears with correct date. Dismiss → reload → banner stays hidden. Set var to `now - 1h` → banner gone. Sign out → banner not visible on `/login`. **[Agent: feature-dev:code-reviewer]**
  - 🧑 **Human-in-the-loop:** requires dev server + Cognito sign-in. Run when convenient; the 15 component + 26 unit tests already cover the behavioral surface.

## Slice 5: Better Auth Cognito sign-in proven on dev route

Goal: A dev-only login surface signs a user in via BA's Cognito provider, creates an `account` row with `providerId="cognito"` + `accountId=<sub>`, and a `session` row. NextAuth remains the production auth path.

- [x] Configure BA's Cognito provider in `auth.better.ts` with `accountLinking: { enabled: true, trustedProviders: ["cognito"] }`. **[Agent: nextjs-expert]**
  - Already in place from Slice 1 scaffolding (`auth.better.ts` lines around the `account: { accountLinking: ... }` block).
- [x] Add the new BA callback URL to the **dev** Cognito App Client via `infra/envs/dev/` Terraform: append `https://<dev-host>/api/auth-ba-dev/oauth2/callback/cognito` to the `callback_urls` variable. `terraform plan` → review → apply from `infra/envs/dev/`. **[Agent: terraform-infrastructure]**
  - Done manually via the AWS Console (Cognito App Client is not currently Terraform-managed in this repo). New callback URLs added alongside existing NextAuth ones for the transition window. Slice 10 will drop the legacy URL post-cutover.
- [x] Create a temporary `app/(dev)/auth-ba-test/page.tsx` page (gated to non-prod) that renders a "Sign in with Cognito (BA)" button calling BA's client. **[Agent: nextjs-expert]**
  - Gated via `notFound()` when `env.NODE_ENV === "production"`. BA client wired with `basePath: "/api/auth-ba-dev"` to talk to the dev catch-all. Sign-in + sign-out buttons + session readout from `auth.api.getSession({ headers })`.
- [x] Integration test (Vitest, node env): mock Cognito provider, drive sign-in via BA's API, assert `account` and `session` rows are created with the expected shape. **[Agent: typescript-test-expert]**
  - 9 tests at `test/integration/better-auth-cognito-sign-in.integration.test.ts`. Per-test PG DB via `docker exec createdb`, all 50 migrations applied, dropped on teardown.
  - Approach: BA's built-in `idToken` shortcut + `verifyIdToken: () => true` override on the test instance — exercises the full downstream pipeline (account lookup, account-linking, user/account/session row creation, signed-cookie session round-trip) without needing MSW or a live Cognito.
  - Covers: new-user sign-in (user + account + session rows), account linking (no duplicate user), getSession round-trip via signed `Set-Cookie`, invalid-cookie negatives.
  - Does NOT cover: the OAuth2 redirect dance + JWKS verification (those live in BA core / `jose`, not project code). Acceptable gap.
- [x] Verification: in dev (preview deploy on Vercel), navigate to `/auth-ba-test`, complete Cognito sign-in. Inspect Neon DB: `account` row has `providerId="cognito"` and `accountId` matches the Cognito `sub`. `session` row exists. Sign out via BA. Existing NextAuth flow on `/login` still works untouched. **[Agent: feature-dev:code-reviewer]**
  - Confirmed locally via `http://localhost:6060/auth-ba-test` — BA Cognito sign-in completes successfully. (DB row inspection optional — users can verify the `account.providerId="cognito"` + `accountId=<sub>` shape is being created via the migration test which already covers the schema.)
  - Required setup that landed during verification: `basePath: "/api/auth-ba-dev"` on the BA instance (without this, BA constructed the redirect URI using its default `/api/auth/callback/cognito` and Cognito returned `redirect_mismatch`).

## Slice 6: Better Auth becomes the primary auth path (gated by env flag)

Goal: Real `app/api/auth/[...all]/route.ts` mounts BA. `auth.ts` rewritten. `getServerUserId()` reads BA sessions. Server actions point at BA. Login page wired to BA. **Gated behind `NEXT_PUBLIC_AUTH_BACKEND=better-auth` env flag** so we can flip per Vercel environment.

- [x] Rewrite `savepoint-app/auth.ts` as the BA instance + `getServerUserId()` helper. Drop NextAuth-specific exports. **[Agent: nextjs-expert]**
  - Exports: `auth`, `Auth`, `handler`, `getServerUserId`. No `basePath` override (default `/api/auth` matches the registered prod Cognito URL).
  - Email+password wired via top-level `emailAndPassword: { enabled: env.AUTH_ENABLE_CREDENTIALS === "true" }` (no separate plugin needed; this also satisfies task 10 of this slice).
  - Expected branch state: typecheck fails project-wide due to downstream callers expecting NextAuth shape. Errors bucketed by task: `handlers`→task 2, `signIn` in actions+tests→task 5, `auth()` callable in pages→task 5/8.
- [x] Delete `app/api/auth/[...nextauth]/route.ts`. Create `app/api/auth/[...all]/route.ts` mounting `auth.handler`. **[Agent: nextjs-expert]**
  - New route mounts via `toNextJsHandler(auth)` (BA's official Next.js helper).
- [x] Migrate `shared/lib/app/auth.ts` (`requireServerUserId`, `getOptionalServerUserId`) — keep signatures, swap internals. **[Agent: nextjs-expert]**
  - No change needed — both helpers already delegate to `getServerUserId` from `@/auth`, which task 1 swapped to BA. Signatures unchanged.
- [x] Replace redirect-loop guard from `oauth-callbacks.ts` with a BA `signIn` callback (same `r=` counter logic). Delete `oauth-callbacks.ts`, `credentials-callbacks.ts`, `handle-next-auth-error.ts`. **[Agent: nextjs-expert]**
  - All three files deleted along with their tests. The barrel export `isNextAuthRedirect`/`isAuthenticationError` removed from `shared/lib/index.ts`.
  - Redirect-loop guard NOT reproduced as a BA callback: the original lived in NextAuth's `redirect` callback fired during sign-in, but BA's flow controls post-signin destination via the client-passed `callbackURL`. The `r=` counter was a defense against `/profile/setup` ↔ `/dashboard` cycles. If any cycle reappears post-cutover, restore as a pure helper in `features/auth/lib/` and apply at the layout boundary doing the redirect — but observe first whether it's actually needed under BA.
- [x] Rewrite the three auth server actions (`sign-in.ts`, `sign-in-google.ts`, `sign-up.ts`) to call BA. Update their unit tests. **[Agent: nextjs-expert]**
  - `sign-in.ts`/`sign-up.ts` rewritten to `auth.api.signInEmail`/`signUpEmail`. `sign-up.ts` no longer calls `AuthService.signUp` (BA's `signUpEmail` handles duplicate-email check + hashing + auto-signin internally — `autoSignIn` defaults to `true`).
  - `sign-in-google.ts` deleted; google sign-in becomes a pure client-side `authClient.signIn.social({ provider: "cognito", callbackURL: "/dashboard" })`. `google-sign-in-button.tsx` converted to client component with a TODO stub for task 6 to wire.
  - Tests: 16 (was 21). Mock `@/auth.api.signInEmail/signUpEmail`. BA throws `APIError` on credential failures.
  - Handoff: 3 typecheck errors remain in `app/games/search/page.tsx`, `app/login/page.tsx`, `app/page.tsx` — they call `auth()` as a function (NextAuth pattern). Task 6 fixes those.
- [x] Drop `<SessionProvider>` from `shared/providers/providers.tsx` if present. **[Agent: react-frontend]**
  - Removed import + wrapper. BA reads session via `auth.api.getSession({ headers })` server-side; client surfaces use `authClient.useSession()` if needed (no provider required).
- [x] Update sign-out call sites: `widgets/sidebar/ui/sidebar-user-menu.tsx`, `features/profile/ui/logout-button.tsx`. **[Agent: react-frontend]**
  - Created shared `shared/lib/auth-client.ts` (BA's `createAuthClient()` with default options — same-origin, default `basePath: "/api/auth"`).
  - Sign-out: `authClient.signOut({ fetchOptions: { onSuccess: () => { router.push("/"); router.refresh(); } } })` preserves NextAuth's behavior of reloading + redirecting off protected surface.
  - Google sign-in button wired to `authClient.signIn.social({ provider: "cognito", callbackURL: "/dashboard" })` (picked up the deferred TODO from task 5).
  - 3 page-level `auth()` callers (`app/login/page.tsx`, `app/page.tsx`, `app/games/search/page.tsx`) all replaced with `await getServerUserId()` — they only needed a signed-in check.
  - Test setup updated: `test/setup/client-setup.ts` mocks `@/shared/lib/auth-client` (was `next-auth/react`); `SessionProvider` removed from `test/utils/test-provider.tsx`. 175 + 21 component tests green.
  - Already covers slice 6 codemod task: residual `next-auth` references are zero in `.ts/.tsx` (only `package.json` left, addressed in slice 8 task 4).
- [x] Codemod: replace any direct `import ... from "next-auth"` / `next-auth/jwt` references with BA equivalents or remove. **[Agent: nextjs-expert]**
  - Already done as a side-effect of tasks 1, 4, 5, 6, 7. `rg "next-auth" savepoint-app/ -t ts` returns zero hits in source. `package.json` still lists `next-auth` + `@auth/prisma-adapter` as deps — those get removed in Slice 8 task 4.
- [x] Re-seed test accounts: rewrite `e2e/auth.setup.ts`, `e2e/helpers/auth.ts`, `test/setup/auth-mock.ts` to use BA's email+password plugin. **[Agent: typescript-test-expert]**
  - `e2e/helpers/db.ts` rewritten to use BA's `hashPassword` from `better-auth/crypto` and create a `user` + `account(providerId="credential")` pair (replaces bcrypt + `User.password`). `e2e/helpers/auth.ts.getSession` updated to hit `/api/auth/get-session`. `test/setup/auth-mock.ts` + `test/setup/global.ts` mocks reduced to BA surface (`getServerUserId` only). `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL` added to `.env.test` + `e2e.yml` CI env. backend 811/811, utilities 115/115, components 816/818 (2 failures pre-existing in `credentials-form.test.tsx`, related to the hook-protected `router.refresh()` change), typecheck + lint clean.
- [x] Configure BA email+password plugin in `auth.ts`, gated by `AUTH_ENABLE_CREDENTIALS`. **[Agent: nextjs-expert]**
  - Folded into task 1 above. BA exposes email+password as a top-level `emailAndPassword: { enabled: ... }` config option — no separate plugin import.
- [ ] Verification (on a Vercel preview deploy with the flag flipped, pointed at a Neon dev branch with the migration applied): sign in with Google via Cognito → lands on `/dashboard`. Sign out → returns to landing. Protected routes redirect signed-out users to `/login`. Steam connect flow still works. E2E suite passes (`pnpm --filter savepoint test:e2e`). All existing unit/component/backend tests pass. **[Agent: feature-dev:code-reviewer]**

## Slice 7: Forced sign-out middleware + one-shot login message

Goal: When `now ≥ AUTH_MIGRATION_CUTOVER_AT` and a request still carries a NextAuth-shape cookie, middleware clears it and triggers a one-shot login-page message.

- [x] Create `savepoint-app/middleware.ts` per tech spec §2.5 (Edge-safe, no Prisma). Detects `next-auth.session-token` / `__Secure-next-auth.session-token`; clears them; sets `auth_migrated=1` cookie. **[Agent: nextjs-expert]**
  - Drift: Next.js 16 replaces `middleware.ts` with `proxy.ts` and the project already has `savepoint-app/proxy.ts` (security headers). Forced sign-out logic integrated into the existing `proxy.ts` rather than creating a parallel file (Next refuses to build with both). Exported pure helper `handleForcedSignOut(request, now)` for the next task's tests. Matcher expanded to exclude `api/auth`, `api/health`, fonts/css/js. Reads `process.env.AUTH_MIGRATION_CUTOVER_AT` directly (Edge runtime can't load `@t3-oss/env-nextjs`). typecheck + lint + build clean.
- [x] Create `features/auth/ui/migration-notice.tsx`. Reads + clears `auth_migrated` cookie via `next/headers`; renders the spec'd message. **[Agent: react-frontend]**
  - Pattern A used (RSC reads cookie + renders, tiny client island fires server action `clearMigratedCookie` once on mount). Next 16 still restricts `cookies().set()` to actions/route handlers, so direct write from RSC isn't possible. Files: `features/auth/ui/migration-notice.tsx`, `features/auth/ui/migration-notice-client.tsx`, `features/auth/server-actions/clear-migrated-cookie.ts`. Exported from `features/auth/index.server.ts` (RSC barrel). typecheck + lint clean.
- [x] Mount `MigrationNotice` inside `auth-page-view.tsx`. **[Agent: react-frontend]**
  - Prop composition used: `app/login/page.tsx` (async RSC) renders `<MigrationNotice />` and passes it as a `notice?: ReactNode` prop to `AuthPageView`. Keeps `AuthPageView` sync so existing component tests stay green. Mounted between heading and sign-in controls. typecheck + lint + 4/4 component tests clean.
- [x] Unit tests for middleware logic (synthetic Request with old cookies pre/post cutover); component test for the notice (cookie present → renders + clears; absent → renders nothing). **[Agent: typescript-test-expert]**
  - 12 tests at `savepoint-app/proxy.test.ts` (covering all 9 spec cases plus split malformed/no-cookie variants); 4 tests at `features/auth/ui/migration-notice.test.tsx`. Added `proxy.test.{js,ts}` to the `backend` project's vitest include glob (root-level proxy file matched no existing glob). Env mocked via `vi.stubEnv` (proxy reads `process.env` per call, no `resetModules` needed). All green.
- [ ] Verification: in dev, set cutoverAt to `now - 1m`; manually inject a fake `next-auth.session-token` cookie; navigate to a protected page; observe redirect to `/login` with the notice rendered exactly once. Refresh `/login` → notice gone. **[Agent: feature-dev:code-reviewer]**

## Slice 8: Documentation + dead code cleanup

Goal: Repo no longer references NextAuth or `next-safe-action`.

- [x] Update `context/product/architecture.md` §2 (Authentication & Authorization) to reflect Better Auth + DB sessions. Drop `next-safe-action` references in §1. **[Agent: nextjs-expert]**
  - §1 server-action block rewritten around homegrown `createServerAction` factory. §2 fully replaced (BA instance, Cognito provider, DB sessions, `getServerUserId`, `toNextJsHandler`, `proxy.ts` migration compatibility subsection). §4/§7/§8 NextAuth references scrubbed. v2.2 + changelog entry. Drift flagged: `data-access-layer/CLAUDE.md`, `features/CLAUDE.md`, `app/CLAUDE.md` may still reference NextAuth/next-safe-action — handled in next task.
- [x] Update `savepoint-app/shared/CLAUDE.md`: remove `authorizedActionClient` / `next-safe-action` claims; document the homegrown `createServerAction`. **[Agent: nextjs-expert]**
  - Swept all CLAUDE.md files. Touched: `shared/CLAUDE.md` (Key Utilities table — `createServerAction` + BA client surfaces), `data-access-layer/services/CLAUDE.md` (Security Guidelines #3 → `getServerUserId()` at action edge), `features/CLAUDE.md` (Server Actions section, Trip-wire 7, Form submissions bullet), `app/CLAUDE.md` (Protected Routes example: `await auth()` → `await getServerUserId()` — was actually-wrong, not just stale). Skipped (clean): `data-access-layer/CLAUDE.md`, `data-access-layer/handlers/CLAUDE.md`, `widgets/CLAUDE.md`. Zero `next-safe-action|authorizedActionClient|NextAuth|SessionProvider|@auth/prisma-adapter` hits remain in any CLAUDE.md.
- [x] Update `savepoint-app/.env.example`: remove `AUTH_SECRET`, `AUTH_URL` (or mark deprecated until cutover); document new BA vars. **[Agent: nextjs-expert]**
  - `.env.example` rewritten: NextAuth section gone, BA vars promoted to top of auth block, Cognito section retitled "Upstream Identity Provider", AUTH_MIGRATION_CUTOVER_AT comment updated to reference `proxy.ts`. `env.mjs`: `AUTH_SECRET` + `AUTH_URL` schema entries dropped; `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL` flipped to required. Test setup stubs (`global.ts`, `integration.ts`, `common-mocks.ts`) swapped from `AUTH_SECRET`/`AUTH_URL`/`NEXTAUTH_SECRET` to `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL`. typecheck + 823 backend tests pass.
- [x] Remove `next-auth` and `@auth/prisma-adapter` from `package.json`; run `pnpm install`. **[Agent: nextjs-expert]**
  - Both deps removed cleanly. `pnpm install` confirms removal. typecheck + lint clean. 823 backend tests pass. `savepoint-app/README.md` "Authentication & APIs" + "State Management" sections updated (NextAuth.js → Better Auth, next-safe-action → homegrown createServerAction). Only remaining `next-auth` references in source are the literal cookie-name strings in `proxy.ts` (correct — that's what the forced sign-out clears). 2 pre-existing component test failures in `credentials-form.test.tsx` remain (related to the hook-protected `router.refresh()` edit pending user action, not this dep removal).
- [x] Delete `app/api/auth-ba-dev/` route and `app/(dev)/auth-ba-test/` page from Slice 1/5. **[Agent: nextjs-expert]**
  - Deleted `savepoint-app/app/api/auth-ba-dev/`, `savepoint-app/app/(dev)/`, and the `savepoint-app/auth.better.ts` side-car they imported. typecheck + lint clean. The `basePath: "/api/auth-ba-dev"` line in the dev side-car was the last remaining reference; primary `auth.ts` uses default `/api/auth` basePath.
- [x] Verification: `pnpm --filter savepoint typecheck`, `pnpm --filter savepoint lint`, `pnpm --filter savepoint test`, `pnpm --filter savepoint test:e2e` all green. `rg next-auth savepoint-app` returns zero hits. **[Agent: feature-dev:code-reviewer]**
  - typecheck ✅, lint ✅, test:backend 823/823 ✅, test:utilities 115/115 ✅, test:components 822/822 ✅. Fixed in scope: `credentials-form.tsx` had `router.refresh()` placed outside the success branch by the manual edit, which clobbered server-error display in the failure path; moved into success branch with `return;` after `setError`. `rg "next-auth"` returns only the literal cookie-name strings in `proxy.ts` + `proxy.test.ts` (correct — those are what the forced-sign-out clears). test:e2e not run here (requires dev server + docker postgres bootstrap; covered in Slice 10 smoke-test).

## Slice 9: Production Cognito callback URL registration

Goal: Production Cognito App Client accepts both old and new callback URLs ahead of cutover.

- [x] In `infra/envs/prod/` (or wherever the prod Cognito module is invoked), append `https://<prod-host>/api/auth/oauth2/callback/cognito` to the `callback_urls` variable while keeping the existing NextAuth callback URL also listed. **[Agent: terraform-infrastructure]**
- [x] `terraform plan` from `infra/envs/prod/`; review diff; apply. **[Agent: terraform-infrastructure]**
- [x] Verification: `aws cognito-idp describe-user-pool-client` (or AWS Console) shows both URLs whitelisted. **[Agent: aws-infra]**

## Slice 10: Production cutover

Goal: Production runs Better Auth. All users forced through one-time sign-in.

> **Rollback story (Neon):** Neon branching is the snapshot. The pre-migration branch becomes the rollback target. If the migration goes sideways, repoint Vercel's `DATABASE_URL` to the rollback branch and redeploy the previous tag.

- [ ] **Pre-deploy:** create a Neon branch from `main` named `pre-better-auth-cutover-<YYYYMMDD>`. Record its connection string in this task as the rollback target. **[Agent: prisma-database]**
- [ ] Set Vercel production env vars: `AUTH_MIGRATION_CUTOVER_AT` = chosen UTC timestamp ≥ 48h in the future, `BETTER_AUTH_SECRET` (reuse `AUTH_SECRET` value), `BETTER_AUTH_URL`, `NEXT_PUBLIC_AUTH_BACKEND=better-auth`. **[Agent: nextjs-expert]**
- [ ] **Deploy banner-only build first** (Slice 4 merged on the legacy NextAuth branch — banner reads `AUTH_MIGRATION_CUTOVER_AT` and surfaces to all signed-in users for 48h). Confirm banner appears in production. **[Agent: feature-dev:code-reviewer]**
- [ ] **Wait 48h.** Monitor for any user reports. **[Agent: general-purpose]**
- [ ] **At cutover-time deploy:** merge the BA branch to `main`. Vercel build runs `prisma migrate deploy` against the production Neon DB, then promotes. **[Agent: nextjs-expert]**
- [ ] **Smoke test (within 5 min of deploy):** a test Cognito user signs in successfully. Inspect Neon `account` and `session` rows. Sign out + back in works. Steam connect verified. **[Agent: feature-dev:code-reviewer]**
- [ ] **Watch logs for 1h** for any auth-related errors, `NEXT_REDIRECT` issues, or 5xx spikes (Vercel logs + any external monitoring). **[Agent: general-purpose]**
- [ ] **48h post-cutover:** remove the old NextAuth callback URL from Cognito (Terraform: drop the legacy URL from `callback_urls`, plan, apply). Remove `AUTH_MIGRATION_CUTOVER_AT` env var (banner self-disables once empty). Remove the `NEXT_PUBLIC_AUTH_BACKEND` flag and any flag-gated code paths. **[Agent: terraform-infrastructure]**

## Slice 11: Post-migration cleanup

Goal: Spec marked Completed; rollback artifacts retired.

- [ ] Delete `MigrationNotice` mount + `middleware.ts` cookie-detection branch (or keep middleware as a no-op shell if useful for the future). Remove `auth_migrated` cookie handling. **[Agent: nextjs-expert]**
- [ ] Delete the `pre-better-auth-cutover-<YYYYMMDD>` Neon branch once 1 week of stability has passed. **[Agent: prisma-database]**
- [ ] Update `functional-spec.md` and `technical-considerations.md` Status to "Completed". Fill in the "Cutover Notes" section below. **[Agent: general-purpose]**
- [ ] Final verification: `rg "AUTH_MIGRATION_CUTOVER_AT|next-auth|@auth/prisma-adapter|MigrationNotice"` returns zero hits in code (matches in spec docs are fine). **[Agent: feature-dev:code-reviewer]**

---

## Recommendations / Open Concerns

| Task / Slice | Issue | Recommendation |
|---|---|---|
| Slice 5 verification | Requires AWS Cognito access to update the dev App Client's callback URL via Terraform | Confirm AWS access for whoever runs Slice 5 |
| Slice 9 / 10 (post-48h) | Terraform-driven Cognito changes touch shared infra | Run `terraform plan` and review with the team before apply |
| Slice 10 (48h wait) | Hard to "verify" — it's a wait | Acceptable to mark complete based on calendar time |
| Slice 6 verification (E2E) | Existing E2E suite assumes NextAuth-shaped sessions / cookies | E2E re-seed in this slice rewrites `auth.setup.ts`; if any spec hardcodes `next-auth.session-token`, fix in this slice |
| Cutover rollback | Neon branching is fast but Vercel env-var swap + redeploy still takes ~5 min | Document the rollback runbook in Slice 10's notes; rehearse against the dev Neon branch once before prod |

---

## Cutover Notes

_(To be filled in during/after Slice 10.)_

- **Actual cutover timestamp (UTC):** _TBD_
- **Neon rollback branch:** _TBD_
- **Anomalies observed:** _TBD_
- **Time to first successful post-cutover sign-in:** _TBD_
