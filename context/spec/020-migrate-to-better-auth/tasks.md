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
- [ ] Write a migration test: seed a test DB with a NextAuth-shape User+Account+Session row, run the migration, assert all rows preserved with renamed columns. Lives in `savepoint-app/prisma/__tests__/better-auth-migration.test.ts`. **[Agent: typescript-test-expert]**
- [ ] Update `prisma/seed.ts` (if present) to use BA schema shape. **[Agent: prisma-database]**
- [ ] Verification: `pnpm --filter savepoint prisma migrate dev` applies cleanly locally; migration test passes; `pnpm --filter savepoint typecheck` succeeds across the codebase (Prisma client types update). **[Agent: feature-dev:code-reviewer]**

> ⚠️ This slice changes the Prisma client types; downstream code referring to `prisma.User.*` (PascalCase) becomes `prisma.user.*` (lowercase). Resolve all type errors in this slice before moving on. NextAuth's `@auth/prisma-adapter` still works because its model bindings are configurable — set `@@map("user")` etc. on the Prisma models or pass `tableMappings` to the adapter to keep NextAuth functional until Slice 6.

## Slice 3: Cutover-time helpers + env wiring

Goal: pure helpers for cutover-window math, no UI yet.

- [ ] Create `savepoint-app/features/auth/lib/cutover.ts` with `getCutoverAt()`, `isInBannerWindow(now)`, `isPostCutover(now)`. Behavior per tech spec §2.5. **[Agent: nextjs-expert]**
- [ ] Unit tests for boundary conditions (env unset, malformed, exactly at cutoverAt, 48h-1s before, post). **[Agent: typescript-test-expert]**
- [ ] Verification: `pnpm --filter savepoint test:utilities features/auth/lib/cutover` passes; functions importable. **[Agent: feature-dev:code-reviewer]**

## Slice 4: Pre-cutover banner widget (env-driven, mounted)

Goal: Banner visible end-to-end when `AUTH_MIGRATION_CUTOVER_AT` is set to a near-future timestamp; invisible otherwise. Works with NextAuth still primary.

- [ ] Create `savepoint-app/widgets/auth-migration-banner/` (FSD widget): server component reads cutover, client island handles dismissal via `localStorage`. Per tech spec §2.4. **[Agent: react-frontend]**
- [ ] Mount banner inside `app/(protected)/layout.tsx` and `app/games/layout.tsx`. **[Agent: react-frontend]**
- [ ] Component tests: renders inside window, hides outside, respects dismissal. **[Agent: typescript-test-expert]**
- [ ] Verification: locally set `AUTH_MIGRATION_CUTOVER_AT` to `now + 1h`. Sign in (existing NextAuth flow). Banner appears with correct date. Dismiss → reload → banner stays hidden. Set var to `now - 1h` → banner gone. Sign out → banner not visible on `/login`. **[Agent: feature-dev:code-reviewer]**

## Slice 5: Better Auth Cognito sign-in proven on dev route

Goal: A dev-only login surface signs a user in via BA's Cognito provider, creates an `account` row with `providerId="cognito"` + `accountId=<sub>`, and a `session` row. NextAuth remains the production auth path.

- [ ] Configure BA's Cognito provider in `auth.better.ts` with `accountLinking: { enabled: true, trustedProviders: ["cognito"] }`. **[Agent: nextjs-expert]**
- [ ] Add the new BA callback URL to the **dev** Cognito App Client via `infra/envs/dev/` Terraform: append `https://<dev-host>/api/auth-ba-dev/oauth2/callback/cognito` to the `callback_urls` variable. `terraform plan` → review → apply from `infra/envs/dev/`. **[Agent: terraform-infrastructure]**
- [ ] Create a temporary `app/(dev)/auth-ba-test/page.tsx` page (gated to non-prod) that renders a "Sign in with Cognito (BA)" button calling BA's client. **[Agent: nextjs-expert]**
- [ ] Integration test (Vitest, node env): mock Cognito provider, drive sign-in via BA's API, assert `account` and `session` rows are created with the expected shape. **[Agent: typescript-test-expert]**
- [ ] Verification: in dev (preview deploy on Vercel), navigate to `/auth-ba-test`, complete Cognito sign-in. Inspect Neon DB: `account` row has `providerId="cognito"` and `accountId` matches the Cognito `sub`. `session` row exists. Sign out via BA. Existing NextAuth flow on `/login` still works untouched. **[Agent: feature-dev:code-reviewer]**

## Slice 6: Better Auth becomes the primary auth path (gated by env flag)

Goal: Real `app/api/auth/[...all]/route.ts` mounts BA. `auth.ts` rewritten. `getServerUserId()` reads BA sessions. Server actions point at BA. Login page wired to BA. **Gated behind `NEXT_PUBLIC_AUTH_BACKEND=better-auth` env flag** so we can flip per Vercel environment.

- [ ] Rewrite `savepoint-app/auth.ts` as the BA instance + `getServerUserId()` helper. Drop NextAuth-specific exports. **[Agent: nextjs-expert]**
- [ ] Delete `app/api/auth/[...nextauth]/route.ts`. Create `app/api/auth/[...all]/route.ts` mounting `auth.handler`. **[Agent: nextjs-expert]**
- [ ] Migrate `shared/lib/app/auth.ts` (`requireServerUserId`, `getOptionalServerUserId`) — keep signatures, swap internals. **[Agent: nextjs-expert]**
- [ ] Replace redirect-loop guard from `oauth-callbacks.ts` with a BA `signIn` callback (same `r=` counter logic). Delete `oauth-callbacks.ts`, `credentials-callbacks.ts`, `handle-next-auth-error.ts`. **[Agent: nextjs-expert]**
- [ ] Rewrite the three auth server actions (`sign-in.ts`, `sign-in-google.ts`, `sign-up.ts`) to call BA. Update their unit tests. **[Agent: nextjs-expert]**
- [ ] Drop `<SessionProvider>` from `shared/providers/providers.tsx` if present. **[Agent: react-frontend]**
- [ ] Update sign-out call sites: `widgets/sidebar/ui/sidebar-user-menu.tsx`, `features/profile/ui/logout-button.tsx`. **[Agent: react-frontend]**
- [ ] Codemod: replace any direct `import ... from "next-auth"` / `next-auth/jwt` references with BA equivalents or remove. **[Agent: nextjs-expert]**
- [ ] Re-seed test accounts: rewrite `e2e/auth.setup.ts`, `e2e/helpers/auth.ts`, `test/setup/auth-mock.ts` to use BA's email+password plugin. **[Agent: typescript-test-expert]**
- [ ] Configure BA email+password plugin in `auth.ts`, gated by `AUTH_ENABLE_CREDENTIALS`. **[Agent: nextjs-expert]**
- [ ] Verification (on a Vercel preview deploy with the flag flipped, pointed at a Neon dev branch with the migration applied): sign in with Google via Cognito → lands on `/dashboard`. Sign out → returns to landing. Protected routes redirect signed-out users to `/login`. Steam connect flow still works. E2E suite passes (`pnpm --filter savepoint test:e2e`). All existing unit/component/backend tests pass. **[Agent: feature-dev:code-reviewer]**

## Slice 7: Forced sign-out middleware + one-shot login message

Goal: When `now ≥ AUTH_MIGRATION_CUTOVER_AT` and a request still carries a NextAuth-shape cookie, middleware clears it and triggers a one-shot login-page message.

- [ ] Create `savepoint-app/middleware.ts` per tech spec §2.5 (Edge-safe, no Prisma). Detects `next-auth.session-token` / `__Secure-next-auth.session-token`; clears them; sets `auth_migrated=1` cookie. **[Agent: nextjs-expert]**
- [ ] Create `features/auth/ui/migration-notice.tsx`. Reads + clears `auth_migrated` cookie via `next/headers`; renders the spec'd message. **[Agent: react-frontend]**
- [ ] Mount `MigrationNotice` inside `auth-page-view.tsx`. **[Agent: react-frontend]**
- [ ] Unit tests for middleware logic (synthetic Request with old cookies pre/post cutover); component test for the notice (cookie present → renders + clears; absent → renders nothing). **[Agent: typescript-test-expert]**
- [ ] Verification: in dev, set cutoverAt to `now - 1m`; manually inject a fake `next-auth.session-token` cookie; navigate to a protected page; observe redirect to `/login` with the notice rendered exactly once. Refresh `/login` → notice gone. **[Agent: feature-dev:code-reviewer]**

## Slice 8: Documentation + dead code cleanup

Goal: Repo no longer references NextAuth or `next-safe-action`.

- [ ] Update `context/product/architecture.md` §2 (Authentication & Authorization) to reflect Better Auth + DB sessions. Drop `next-safe-action` references in §1. **[Agent: nextjs-expert]**
- [ ] Update `savepoint-app/shared/CLAUDE.md`: remove `authorizedActionClient` / `next-safe-action` claims; document the homegrown `createServerAction`. **[Agent: nextjs-expert]**
- [ ] Update `savepoint-app/.env.example`: remove `AUTH_SECRET`, `AUTH_URL` (or mark deprecated until cutover); document new BA vars. **[Agent: nextjs-expert]**
- [ ] Remove `next-auth` and `@auth/prisma-adapter` from `package.json`; run `pnpm install`. **[Agent: nextjs-expert]**
- [ ] Delete `app/api/auth-ba-dev/` route and `app/(dev)/auth-ba-test/` page from Slice 1/5. **[Agent: nextjs-expert]**
- [ ] Verification: `pnpm --filter savepoint typecheck`, `pnpm --filter savepoint lint`, `pnpm --filter savepoint test`, `pnpm --filter savepoint test:e2e` all green. `rg next-auth savepoint-app` returns zero hits. **[Agent: feature-dev:code-reviewer]**

## Slice 9: Production Cognito callback URL registration

Goal: Production Cognito App Client accepts both old and new callback URLs ahead of cutover.

- [ ] In `infra/envs/prod/` (or wherever the prod Cognito module is invoked), append `https://<prod-host>/api/auth/oauth2/callback/cognito` to the `callback_urls` variable while keeping the existing NextAuth callback URL also listed. **[Agent: terraform-infrastructure]**
- [ ] `terraform plan` from `infra/envs/prod/`; review diff; apply. **[Agent: terraform-infrastructure]**
- [ ] Verification: `aws cognito-idp describe-user-pool-client` (or AWS Console) shows both URLs whitelisted. **[Agent: aws-infra]**

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
