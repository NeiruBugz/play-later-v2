# Rollback Runbook

Spec 021 migrated SavePoint from the Next.js app (`savepoint-app/`) to the TanStack Start app (`savepoint-tanstack/`). The cutover is **complete**: `savepoint-app/` has been deleted from the repo and `savepoint-tanstack/` is the sole, deployed app. This runbook describes how to roll back if a production deploy of `savepoint-tanstack/` misbehaves.

Two distinct rollback scopes:

- **Forward-fix / revert a recent change** — the normal case. Revert the offending PR (or redeploy a known-good prior Vercel deployment) and ship. No app-swap involved.
- **Fall all the way back to the old Next.js app** — the disaster case, only if the TanStack Start app is fundamentally broken in production and a forward-fix is not viable. Because `savepoint-app/` was deleted, this is no longer a one-line Vercel root swap — it requires reviving the deleted code from history (see below).

References: [`context/spec/021-migrate-to-tanstack-start/technical-considerations.md`](../context/spec/021-migrate-to-tanstack-start/technical-considerations.md) — risk table row **"Rollback after cutover"** and the **"Session fork at cutover"** mitigation.

## Key safety property: shared DB, no data migration

**Rolling back the app does not touch or lose any user data.** Both the current and the (deleted) prior app run against the **same PostgreSQL database** (the shared Neon DB) and the **same Better Auth tables** (`user`, `session`, `account`, plus the app's domain tables — `LibraryItem`, journal entries, profiles, Steam imports). A rollback changes *which app code serves traffic*, not the data underneath it.

Consequences:

- **No data migration to undo.** There is no per-app data copy, no dual-write, no backfill. Reverting app code leaves every row exactly where it was.
- ~~**Sessions survive the rollback.** Both apps use the same `BETTER_AUTH_SECRET`, the same Better Auth default cookie name, the same `/api/auth` base path, and the same domain. A user signed in on the current app stays signed in after a rollback — no forced re-login. A reverted `savepoint-app/` would therefore still authenticate existing users against the live session table.~~ — corrected 2026-11-06 (spec 027): sessions are per host. They survive a code rollback only while the app is served from the same address. After the spec 027 phase 2 address change, users sign in once on the new address (cookies do not move between hosts), and rolling the address back costs one more re-sign-in on the old host (see [Spec 027 phase 2 — address change](#spec-027-phase-2--address-change)). The shared `BETTER_AUTH_SECRET`, cookie name and `/api/auth` base path are unchanged.
- **Schema migrations are owned by `savepoint-tanstack/`.** Migrations applied to the shared DB are forward-compatible; the auth model and shared domain tables are stable. A migration on the shared DB does **not** need to be reverted to roll back app code. If you must fall all the way back to the deleted Next.js app, note its `schema.prisma` is byte-identical for the auth model and shared domain tables, so it reads the same DB without a schema change.

## Rolling back a recent change (normal case)

This is the everyday rollback and does not involve reviving deleted code.

1. **Decide and announce.** Confirm the regression and that a forward hotfix is not faster. Note the time and the symptom.
2. **Revert.** Either `git revert` the offending PR on `main` and let the merge trigger a production deploy, or promote a known-good prior Vercel deployment from the dashboard as an interim step, then reconcile the repo.
3. **Redeploy.** A reverted `main` triggers a Vercel rebuild of `savepoint-tanstack/`.
4. **Do not touch the DB.** No DB migration or data fix is part of a code rollback — the data is shared and untouched.
5. **Verify** (see below).

## Falling back to the deleted Next.js app (disaster case)

Only if `savepoint-tanstack/` is fundamentally broken in production and a forward-fix is not viable. Because `savepoint-app/` was deleted in the spec-021 cleanup commit, reviving it is **not** a one-line Vercel root swap — you must bring the code back from git history first.

| Step | What to do |
|---|---|
| **Revive the deleted app code** | `git revert` the deletion commit (the spec-021 task 545 cleanup that ran `git rm -r savepoint-app/` and removed its workspace entry + CI workflows), or `git checkout <pre-deletion-sha> -- savepoint-app/` onto a recovery branch. This restores `savepoint-app/` and its `package.json` to the workspace. Run `pnpm install` so the workspace resolves it again. |
| **Re-add the Vercel build wiring** | The deletion also removed `savepoint-app`'s build/start commands and its CI workflows. The reverted commit restores the repo-side config; confirm the workspace builds (`pnpm --filter savepoint build`). |
| **Vercel Root Directory (the one manual revert)** | Set the production Vercel project's **Root Directory** back to `savepoint-app` and its Install/Build commands to the `savepoint-app` filters. This is the single manual operator action — everything else is in the revert commit. Redeploy. |
| **Cognito callback** | Leave the prod Cognito callback URL registered. The path is identical to the legacy NextAuth callback, so it already works for `savepoint-app/`. No action required. |
| **Database** | Do **not** revert any migration or run a data fix. The shared DB and Better Auth sessions are untouched and a reverted `savepoint-app/` authenticates existing users as-is (see safety property above). |

A single cosmetic divergence is **not** a fallback trigger — those are tracked in [`savepoint-tanstack/DIVERGENCES.md`](../savepoint-tanstack/DIVERGENCES.md).

## Spec 026 — pre-deploy for migration A (mindful core model)

Spec 026 migration A (`<ts>_mindful_core_model`) swaps the `LibraryItemStatus` enum (`WISHLIST`/`SHELF`/`UP_NEXT`/`PLAYING`/`PLAYED` → `WANT`/`PLAYING`/`DONE`) and adds `@@unique([userId, gameId])`. **This is the exception to "do not touch the DB" above.** The swap is not backward compatible: reverted app code that writes `SHELF` fails against the new enum, so a Vercel revert alone cannot roll back. The DB must be restored. Migration B (`<ts>_mindful_core_contract`, drops the legacy columns) is a separate, later deploy that runs only after migration A is verified in production.

1. **Branch production.** Immediately before merging to `main` (the `deploy.yml` job runs `prisma migrate deploy` on push), create a Neon branch of production named `pre-026-<yyyy-mm-dd>`.
   - Console: Neon project → **Branches** → **Create branch** → parent `production`, current data.
   - CLI: `neonctl branches create --name pre-026-<yyyy-mm-dd> --project-id <project-id>` (parent defaults to the project's default branch).
2. **Duplicate pre-check.** Run against the Neon branch (SQL Editor or `psql`). It must return **zero rows**; otherwise the unique index fails and the migration aborts. If rows return, dedupe before deploying (keep the oldest, re-point notes).

   ```sql
   SELECT "userId", "gameId", COUNT(*) AS copies
   FROM "LibraryItem"
   GROUP BY "userId", "gameId"
   HAVING COUNT(*) > 1;
   ```

3. **Dry run on the branch.** Do not run against production. Point a local shell at the branch's connection strings (the same two variables `deploy.yml` uses) and apply the pending migration:

   ```bash
   export POSTGRES_PRISMA_URL="<branch pooled URL>"
   export POSTGRES_URL_NON_POOLING="<branch direct URL>"
   pnpm --filter savepoint-tanstack prisma:migrate:deploy
   ```

   Then sanity-check on the branch. Each query must hold:

   ```sql
   -- only the three new statuses (expect WANT, PLAYING, DONE)
   SELECT DISTINCT status FROM "LibraryItem";

   -- at most 5 queued per user (expect zero rows)
   SELECT "userId", COUNT(*) FROM "LibraryItem"
   WHERE "upNextPosition" IS NOT NULL
   GROUP BY "userId" HAVING COUNT(*) > 5;

   -- open plays == PLAYING items (both expect zero rows)
   SELECT li.id FROM "LibraryItem" li
   WHERE li.status = 'PLAYING'
     AND (SELECT COUNT(*) FROM "Playthrough" p
          WHERE p."libraryItemId" = li.id AND p."finishedAt" IS NULL) <> 1;
   SELECT p.id FROM "Playthrough" p
   JOIN "LibraryItem" li ON li.id = p."libraryItemId"
   WHERE p."finishedAt" IS NULL AND li.status <> 'PLAYING';

   -- notice flag set for every existing user (expect zero rows)
   SELECT id FROM "user" WHERE "statusModelNoticePending" IS NOT TRUE;
   ```

4. **Deploy.** Merge to `main`. Keep the `pre-026-<date>` branch until migration B ships.
5. **Rollback (any production regression after the merge).**
   1. Stop writes: promote the pre-026 Vercel deployment, or pause traffic.
   2. Restore the production database from `pre-026-<yyyy-mm-dd>`: Neon console → **Branches** → `production` → **Restore** → source `pre-026-<yyyy-mm-dd>` (a point-in-time restore to just before the deploy also works). Connection strings stay the same.
   3. Revert the Vercel deployment to the pre-026 build (promote the prior deployment, then `git revert` the merge on `main`). Reverting `main` re-runs `prisma migrate deploy`; it must find no pending 026 migration, so confirm `_prisma_migrations` was restored with the DB.
   4. Verify (see below). Writes made between the deploy and the restore are lost; note the window.

## Pre-deploy for the Steam import idempotency migration (`<ts>_steam_import_idempotent`)

The migration soft-deletes duplicate live `ImportedGame` rows (keeping the most recently updated per `(userId, storefront, storefrontGameId)`), then builds a **partial unique index** on live rows, drops redundant indexes, and switches three `user` foreign keys (`LibraryItem`, `ImportedGame`, `IgnoredImportedGames`) from RESTRICT to CASCADE. Nothing is hard-deleted, so a Vercel revert is safe; the unique index only makes the old app's duplicate inserts fail, so revert the app together with `DROP INDEX "ImportedGame_live_userId_storefront_storefrontGameId_key"` if the old import path must be restored.

1. **Branch production.** Create a Neon branch named `pre-steam-idempotent-<yyyy-mm-dd>` from production (same steps as the spec 026 section above).
2. **Duplicate pre-check.** Run against the Neon branch. Rows returned are the groups the migration will dedupe (all but the newest are soft-deleted). Review that the volume looks plausible; zero rows is also fine.

   ```sql
   SELECT "userId", "storefront", "storefrontGameId", COUNT(*) AS live_copies
   FROM "ImportedGame"
   WHERE "deletedAt" IS NULL AND "storefrontGameId" IS NOT NULL
   GROUP BY "userId", "storefront", "storefrontGameId"
   HAVING COUNT(*) > 1;
   ```

3. **Dry run on the branch.** Point `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING` at the branch and run `pnpm --filter savepoint-tanstack prisma:migrate:deploy`. Then both queries must return zero rows:

   ```sql
   -- no live duplicates left
   SELECT "userId", "storefront", "storefrontGameId", COUNT(*)
   FROM "ImportedGame"
   WHERE "deletedAt" IS NULL AND "storefrontGameId" IS NOT NULL
   GROUP BY 1, 2, 3 HAVING COUNT(*) > 1;

   -- the partial unique index exists (expect one row)
   SELECT indexdef FROM pg_indexes
   WHERE indexname = 'ImportedGame_live_userId_storefront_storefrontGameId_key';
   ```

4. **Deploy**, then keep the branch for a few days.
5. **Rollback.** Revert the Vercel deployment. Rows the migration soft-deleted can be restored from the branch (`UPDATE "ImportedGame" SET "deletedAt" = NULL WHERE id IN (...)` using ids that are live on the branch but deleted in production), but only after dropping the unique index.

## Spec 027 phase 2 — address change

Phase 2 renames the product to "Continue?" and moves it from the free Vercel subdomain `savepoint-app.vercel.app` to `continueapp.vercel.app`. Design: [`context/spec/027-design-reset/technical-considerations.md`](../context/spec/027-design-reset/technical-considerations.md) §2.9 and §2.15. The data layer is untouched: same Neon DB, same Better Auth tables, same Cognito user pool and S3 bucket. Only the address, the allowed origins and the hosted redirect change.

### What users and the owner will notice

- **One re-sign-in on the new address.** Better Auth cookies are scoped to the host and do not move. Cognito's own session usually makes it a single tap; the library is unchanged. No session hand-off is built.
- **The theme starts at System once.** The theme choice lives in `localStorage`, which is per origin, so it resets on the first visit to `continueapp.vercel.app` and persists after a choice is made there.
- **Old links keep working.** `savepoint-app.vercel.app/...` answers with a permanent 308 redirect to the same path and query on `continueapp.vercel.app`.
- **Never detach or delete the old domain from the Vercel project.** The redirect depends on it, and old links exist in the wild (shared pages, link previews, installed home-screen icons). Removing it turns every old link into a dead end. Keep the old domain and its redirect for at least a year.
- **Leftover on purpose:** the Cognito hosted-UI `domain_prefix` is not changed (ForceNew, auth outage), so the hosted sign-in screen still shows the old name.

### Cutover steps

Run in order. Verify each step before starting the next. "Owner" means the repo owner acting in the Vercel dashboard, Terraform or GitHub.

| # | Step | Who | Verify | Rollback |
|---|---|---|---|---|
| 0 | **Pre-flight (manual, in the consoles).** Make the three console changes in [Step 0 details](#step-0-details), keeping every existing value. The release PR is green in CI. | Owner | Sign-in and an avatar upload still work on `savepoint-app.vercel.app`. The Cognito client lists both callback URLs. | Remove the two added URLs and the CORS origin. Nothing else depends on them yet. |
| 1 | **Add the new domain in Vercel.** Project -> Settings -> Domains: add `continueapp.vercel.app` to the same project (on the free tier this is renaming or adding the project's `vercel.app` domain) and keep `savepoint-app.vercel.app` attached. Make the new domain primary only if Vercel asks; do not remove the old one. | Owner | `continueapp.vercel.app` is listed as valid in Domains, with no "Invalid Configuration" warning. | Remove only the new domain from the project. Leave the old domain untouched. |
| 2 | **Verify TLS on the new host.** | Owner / agent | `curl -sI https://continueapp.vercel.app/` returns an HTTP response over a valid certificate (no certificate error). | Same as step 1. |
| 3 | **Merge the release PR** (rename code, theme and brand changes, `BETTER_AUTH_EXTRA_ORIGINS` support). The merge triggers the production deploy, which runs `prisma:migrate:deploy`. | Owner | `deploy.yml` is green. `savepoint-app.vercel.app` still serves the app and sign-in works there (`BETTER_AUTH_URL` still points at the old origin). | Revert the PR on `main` (or promote the previous Vercel deployment) per [Rolling back a recent change](#rolling-back-a-recent-change-normal-case). No DB action. |
| 4 | **Switch the app origin.** In Vercel set `BETTER_AUTH_URL=https://continueapp.vercel.app` and `BETTER_AUTH_EXTRA_ORIGINS=https://savepoint-app.vercel.app` (Production environment), then redeploy. `BETTER_AUTH_URL` drives the Better Auth `baseURL`, the Steam OpenID realm and `return_to`, and the absolute og URLs. The extra origin keeps the old host in `trustedOrigins` while both hosts serve the app. | Owner | On `continueapp.vercel.app`: Google sign-in through Cognito (at most one re-sign-in, library unchanged), Steam connect (an already-linked account keeps working because `steamId64` is stored), an avatar upload (proves S3 CORS), a deep link such as `/games/<slug>?action=add-game`, and sign-out. | Restore `BETTER_AUTH_URL=https://savepoint-app.vercel.app`, keep or clear `BETTER_AUTH_EXTRA_ORIGINS`, redeploy. One more re-sign-in on the old host. |
| 5 | **Redirect the old domain.** Project -> Settings -> Domains -> `savepoint-app.vercel.app` -> Edit -> Redirect to `continueapp.vercel.app`, permanent (308). Vercel preserves path and query. No code needed; it keeps working even if the app is broken or rolled back. | Owner | `curl -I "https://savepoint-app.vercel.app/games/<slug>?action=add-game"` returns `308` with `Location: https://continueapp.vercel.app/games/<slug>?action=add-game`. Also: a Telegram link preview of a new-host link shows the new name and logo; the first visit to the new host follows the device theme and a choice persists across a reload; Add to Home Screen on a phone shows the new icon and name (owner checks). | In the Domains settings, set the old domain back to serve the project (turn the redirect off). Do this first when rolling back the whole change. |

Release 3 is done after step 5 verifies.

#### Step 0 details

The live Cognito client and S3 CORS were set up by hand, and no Terraform state for them is in the repo. Do **not** run `terraform apply` for this change: with no state the plan would try to create a new user pool and bucket.

1. AWS Console -> Cognito -> user pool -> App clients -> the web client -> Login pages -> Edit: add callback URL `https://continueapp.vercel.app/api/auth/callback/cognito` and sign-out URL `https://continueapp.vercel.app`.
2. AWS Console -> S3 -> avatar bucket -> Permissions -> CORS: add `https://continueapp.vercel.app` to `AllowedOrigins`.
3. Google Cloud -> APIs & Services -> Credentials -> the OAuth client: no change. Google redirects to the Cognito domain (`.../oauth2/idpresponse`), which stays the same; only confirm that is the redirect URI listed.

### Rollback of the whole change

Order matters:

1. Turn off the old domain's redirect (step 5 rollback).
2. Restore `BETTER_AUTH_URL=https://savepoint-app.vercel.app` and redeploy (step 4 rollback). Users sign in once more on the old host.
3. If the code is also at fault, revert the PR as in the normal case. The DB is shared and untouched.
4. Leave the new domain, the added Cognito callback and sign-out URLs, and the S3 CORS origin in place. They are harmless and make a retry a no-op.

Never detach the old domain at any point in a rollback.

### Follow-up after 2-4 weeks

A separate small change, once traffic on the new host is steady:

- Remove `https://savepoint-app.vercel.app` from the S3 bucket CORS `AllowedOrigins` (console).
- Remove `BETTER_AUTH_EXTRA_ORIGINS` from Vercel and redeploy.
- Keep the 308 redirect, the old domain on the project, and the old Cognito callback URL for at least a year.

## Decision checklist

### When to roll back (triggers)

Roll back if any of these are observed on the production deployment and cannot be hotfixed quickly:

- Sign-in is broken (Cognito round-trip fails, or sessions do not persist / users are bounced to login).
- A core authed surface fails to load for real users: library, journal, profile, game detail, search, or Steam import.
- Avatars / S3-backed images fail to render across the board (presign or bucket-access regression).
- A data-integrity defect that writes bad rows to the shared DB (escalate immediately — rolling back stops further bad writes but does not clean up rows already written).
- Elevated 5xx rate or a hard crash loop on the serverless runtime.

A trigger that a recent change introduced → normal-case rollback. A trigger inherent to the TanStack Start app with no viable forward-fix → disaster-case fallback.

### Who approves

Rollback is a production change. The **repo owner / operator** approves and executes.

## How to verify the rollback worked

On the production URL after redeploy:

- **Sign-in works** — complete a Cognito sign-in end to end and land authenticated.
- **Session continuity** — a user who was signed in before the rollback is **still** signed in (no forced re-login), confirming the shared-session property.
- **Core surfaces load** — library, journal, and profile pages render with real data.
- **Avatars render** — S3-backed avatar images load on the profile/header.
- **No elevated error rate** — 5xx rate and crash loop are back to baseline.

If sign-in or core surfaces are healthy and sessions carried over, the rollback is complete. For the disaster case, re-attempt forward only after the triggering defect in `savepoint-tanstack/` is fixed and re-verified.
