# Cutover Rollback Runbook

Spec 021 migrates SavePoint from the legacy Next.js app (`savepoint-app/`) to the TanStack Start app (`savepoint-tanstack/`). The cutover is a single Vercel project-root swap performed when the cutover PR (Slice 24) merges. This runbook describes how to roll back if the new app misbehaves in production.

References: [`context/spec/021-migrate-to-tanstack-start/technical-considerations.md`](../context/spec/021-migrate-to-tanstack-start/technical-considerations.md) — risk table row **"Rollback after cutover"** and the **"Session fork at cutover"** mitigation; [`tasks.md`](../context/spec/021-migrate-to-tanstack-start/tasks.md) Slice 24.

## Key safety property: shared DB, no data migration

**Rolling back the app does not touch or lose any user data.** Both apps run against the **same PostgreSQL database** and the **same Better Auth tables** (`user`, `session`, `account`, plus the app's domain tables — `LibraryItem`, journal entries, profiles, Steam imports). The cutover changes *which app serves traffic*, not the data underneath it.

Consequences:

- **No data migration to undo.** There is no per-app data copy, no dual-write, no backfill. Reverting the app leaves every row exactly where it was.
- **Sessions stay valid across the rollback.** Both apps use the same `BETTER_AUTH_SECRET`, the same Better Auth default cookie name, the same `/api/auth` base path, and the same domain. A user who signed in on `savepoint-tanstack` remains signed in on `savepoint-app` after rollback (and vice versa) — no forced re-login. This was verified statically in the Slice 23 cross-app session check and during the Slice 7 parallel-run.
- **Schema migrations applied during the migration window are compatible with both apps.** All migrations are authored in `savepoint-app/` (the canonical migration owner) and copied verbatim into `savepoint-tanstack/prisma/`; both apps' `schema.prisma` are byte-identical for the auth model and the shared domain tables. A migration on the shared DB therefore does **not** need to be reverted to roll back the app.

## What the cutover actually changes (and how to reverse each)

| Operation at cutover | Reversible? | How to roll back |
|---|---|---|
| **Vercel project root** swapped from `savepoint-app/` to `savepoint-tanstack/` (the active ingredient) | Yes — one-line swap | Revert the cutover PR (or manually set the Vercel project root back to `savepoint-app/`) and redeploy. This restores the prior app. |
| **Vercel build/start commands** changed to `savepoint-tanstack` filters | Yes | Reverted together with the project-root change when you revert the cutover PR. |
| **Prod Cognito callback URL** added (`<prod-host>/api/auth/callback/cognito`) | Sticky, but harmless | **Leave it registered.** The path is identical to the legacy NextAuth callback, so it already works for `savepoint-app/`. Leaving the extra entry on the App Client is harmless — it simply becomes unused after rollback. No action required. |
| **Schema migrations** applied to the shared DB during the window | n/a | Nothing to revert — authored from `savepoint-app/`, compatible with both apps (see safety property above). |

The only operation you must actively reverse is the **Vercel project-root swap**. Everything else is either auto-reverted with the PR or safe to leave in place.

## Decision checklist

### When to roll back (rollback triggers)

Roll back if, on the production deployment of `savepoint-tanstack/`, any of these are observed and cannot be hotfixed quickly:

- Sign-in is broken (Cognito round-trip fails, or sessions do not persist / users are bounced to login).
- A core authed surface fails to load for real users: library, journal, profile, game detail, search, or Steam import.
- Avatars / S3-backed images fail to render across the board (presign or bucket-access regression).
- A data-integrity defect that writes bad rows to the shared DB (escalate immediately — rolling back the app stops further bad writes but does not clean up rows already written).
- Elevated 5xx rate or a hard crash loop on the serverless runtime.

A single cosmetic divergence is **not** a rollback trigger — those are tracked in `savepoint-tanstack/DIVERGENCES.md`.

### Who approves

Rollback is a production change and follows the same merge gate as the cutover: the **repo owner / operator** who performed the cutover approves and executes. The Slice 24 verification is explicitly human-in-the-loop ("only merge to main after explicit user approval") — rollback is the symmetric action.

### Rollback steps (in order)

1. **Decide and announce.** Confirm a trigger above is met and that a forward hotfix is not faster. Note the time and the symptom.
2. **Revert the cutover PR.** `git revert` the merge of the Slice 24 cutover PR on `main` (this restores the Vercel project root to `savepoint-app/` and the legacy build/start commands). If a revert PR is not practical in the moment, set the Vercel project root back to `savepoint-app/` directly in the Vercel dashboard as an interim step, then reconcile the repo afterwards.
3. **Redeploy.** Trigger a production deploy from the reverted `main` (or let the revert merge trigger it). Vercel rebuilds and serves `savepoint-app/`.
4. **Do not touch the Cognito callback or the DB.** Leave the prod Cognito callback URL registered (harmless). Do not run any DB migration or data fix as part of the rollback — the data is shared and untouched.
5. **Verify** (next section).
6. **Record** what failed so the cutover can be re-attempted after a fix. The `savepoint-tanstack/` app stays in the repo; you are only reverting which app Vercel serves.

### How to verify the rollback worked

On the production URL (now serving `savepoint-app/`):

- **Sign-in works** — complete a Cognito sign-in end to end and land authenticated.
- **Session continuity** — a user who was signed in on `savepoint-tanstack` before the rollback is **still** signed in (no forced re-login), confirming the shared-session property.
- **Core surfaces load** — library, journal, and profile pages render with real data.
- **Avatars render** — S3-backed avatar images load on the profile/header.
- **No elevated error rate** — 5xx rate and crash loop are back to baseline.

If sign-in or core surfaces are healthy and sessions carried over, the rollback is complete. Re-attempt the cutover only after the triggering defect is fixed and re-verified against the Slice 24 checklist.
