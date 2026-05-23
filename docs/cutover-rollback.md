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
- **Sessions survive the rollback.** Both apps use the same `BETTER_AUTH_SECRET`, the same Better Auth default cookie name, the same `/api/auth` base path, and the same domain. A user signed in on the current app stays signed in after a rollback — no forced re-login. A reverted `savepoint-app/` would therefore still authenticate existing users against the live session table.
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
