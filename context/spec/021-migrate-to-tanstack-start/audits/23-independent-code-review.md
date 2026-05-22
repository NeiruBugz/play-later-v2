# Slice 23 — Independent Code Review (`savepoint-tanstack/`)

> **Spec:** 021 Migrate to TanStack Start · **Slice:** 23 (Final parity audit) · **Date:** 2026-05-22
> **Agent:** `feature-dev:code-reviewer` + orchestrator verification · **Scope:** CodeRabbit-style end-to-end review of `savepoint-tanstack/` application code. Critical-severity findings BLOCK cutover; non-critical tracked but not blocking. ~85% confidence bar; app code only (CI/build/infra excluded).
> **Gate verdict:** ✅ **PASS** (re-verified 2026-05-22 after fixing the critical). *Original review was 🚫 BLOCKED on 1 critical privacy leak — now resolved at the entity layer. #2 high + #3 medium addressed/tracked — see § Remediation.*

## Summary

5 findings: **1 critical (blocking)**, 1 high, 2 medium, 1 low. Auth/authorization on mutations is sound throughout; ownership enforced at the entity layer; Steam OpenID verified before trust; avatar presign enforces MIME + size. The one critical is a privacy-scoping gap on the per-user activity feed: the gate was placed at the route layer, but the data path is also exposed as a network-callable `createServerFn`, so direct RPC bypasses it.

## Findings

### 🔴 Critical (blocking)

**1. `getActivityForUser` leaks private-profile activity via direct server-fn call**
`features/view-activity-feed/api/get-activity-for-user-fn.ts` + `entities/activity-feed/api/get-activity-feed.server.ts:60-82`
- **Verified (orchestrator):** `getActivityForUser` SQL is `WHERE li."userId" = ${targetUserId} ${cursorCondition}` — NO `isPublicProfile` filter. Its docstring (line 57) explicitly delegates the gate to "the route layer." The sibling `getActivityFeedForViewer` (line 42) correctly has `AND u."isPublicProfile" = true`.
- **Why critical:** `getActivityForUserFn` is a `createServerFn({method:"GET"})` accepting `{targetUserId}` — a network-callable RPC. The route-layer gate on `/u/$username` does NOT protect direct calls. Any caller who learns a private user's internal ID (e.g. from `listFollowersFn` output) can retrieve that user's full library activity + identity columns (`name`/`username`/`image` via shared `SELECT_COLUMNS`), bypassing the `getPublicProfile` privacy invariant. Violates the project's binding rule: "privacy invariants live on the entity" (`entities.md`, `CONTEXT.md`).
- **Fix:** enforce the invariant in the entity query. Add `viewerUserId` and gate in SQL: `AND (u."isPublicProfile" = true OR li."userId" = ${viewerUserId})` (owner-bypass, mirroring `getPublicProfile`'s `isOwner`); the fn resolves the viewer via `getServerUserId` (anonymous-allowed). Update the worker/fn signature, the route loader, and the `get-activity-for-user.integration.test.ts` (add private-target + owner-bypass cases). (Finding 4 closes with this fix.)

### 🟠 High (tracked, non-blocking)

**2. `setAvatarUrlFn` accepts any URL (presign bypass / content injection)**
`features/upload-avatar/api/set-avatar-url.worker.ts:6-8`
- `SET_AVATAR_URL_INPUT` uses `z.url()` with no origin check; an authed user can set `User.image` to any external URL (tracking pixel, `169.254.169.254` metadata, attacker-controlled mutable content), bypassing the presign flow's MIME/size enforcement. Rendered as `<img src>` (content injection, not script XSS).
- **Explicitly deferred in code** (`set-avatar-url.ts:16-17`: "not a content-policy concern for this slice") — a documented known gap, hence high not critical. Tracked.
- **Fix when addressed:** `z.url().refine(u => new URL(u).origin === bucketOrigin)` against the configured S3 bucket origin.

### 🟡 Medium (tracked, non-blocking)

**3. `updateLibraryItemFn` / `deleteLibraryItemFn` resolve `userId` AFTER input re-parse**
`features/manage-library-entry/api/update-library-item-fn.ts:38-48` (+ delete sibling)
- Handler re-parses input before calling `requireUserId()`; an unauthenticated caller with bad input gets a Zod error instead of `UnauthorizedError`. Not a security bypass (the gate still fires before any DB work), but inconsistent with the documented shape (`addGameToLibraryFn`/`connectSteamFn` gate first). Reorder `requireUserId()` before `parse`.

**4. `SELECT_COLUMNS` exposes private-user identity via the unchecked path** — a component of #1 (shared column set returns `name`/`username`/`image`); closes when #1 adds the entity-layer gate.

### ⚪ Low (tracked)
*(none material — the initially-flagged `getProfileSetupStatusFn` no-arg shape was confirmed correct, not a finding.)*

## Areas reviewed clean (PASS evidence)

1. **Auth gate on all authed mutations** — every data-modifying `createServerFn` (`updateProfile`, `update/deleteLibraryItem`, `addGameToLibrary`, journal create/update/delete, `connect/disconnectSteam`, `follow/unfollow`, `setAvatarUrl`) calls `requireUserId()` or delegates to a worker gating on `userId !== undefined`. No handler trusts `userId` from input.
2. **Steam OpenID verified** — `shared/api/steam/openid.ts` does the full `check_authentication` round-trip to steamcommunity.com; `steamId64` extracted only after `is_valid:true`.
3. **Avatar presign** — MIME allow-list + 10MB cap, validated twice, auth-gated; S3 key scoped `${prefix}${userId}/${uuid}.${ext}` (no traversal).
4. **Ownership invariants** — library item + journal CRUD use two-step `findUnique` → `userId` check; `getJournalEntryById` collapses missing/cross-user into `NotFoundError`.
5. **Public-profile privacy** — `getPublicProfile` throws `NotFoundError` for missing AND `isPublicProfile=false` (non-owner), with correct owner-bypass.
6. **Route guards** — `_authed.tsx` `beforeLoad` `requireUserIdOrRedirectFn`; `/dev/*` gated on `NODE_ENV==="production"` → redirect.
7. **No SSRF** — IGDB/Steam base URLs hardcoded; resource paths are literals; OpenID redirect built server-side from `request.url`.
8. **Validate-twice** — confirmed across handlers; schemas module-level, reused in `inputValidator` + handler.
9. **`.server.ts` boundary** — no `createServerFn` file uses `.server.ts`; entity queries do; presign companion is test-only.

## Gate verdict

🚫 **BLOCKED** on Finding 1 (critical privacy leak). Required: enforce the `isPublicProfile`-or-owner gate inside `getActivityForUser` (entity layer) + update fn/loader/tests. Findings 2/3 are real but non-blocking per the gate rubric (only critical blocks) and tracked here; #4 closes with #1.

## § Remediation (2026-05-22) — gate now PASS

**#1 (critical) FIXED at the entity layer.** `getActivityForUser` now takes `viewerUserId: string | undefined` and gates in SQL: `AND (u."isPublicProfile" = true OR li."userId" = ${viewerBinding})` where `viewerBinding = viewerUserId ?? null` (so anonymous → SQL `NULL` → only public rows). Private-profile activity is now visible ONLY to the owner — enforced on the entity, so the network-callable `getActivityForUserFn` (which resolves the viewer via `getServerUserId`, not from input) cannot bypass it. **#4 closes with this.** `get-activity-for-user.integration.test.ts` extended with 5 privacy cases (public/anon, public/other, private/anon→empty, private/non-owner→empty, private/owner→returns); **proven** by reverting the gate → the two private-non-owner cases fail (leak), restore → all pass.

**#3 (medium) FIXED.** `update-library-item-fn.ts` + `delete-library-item-fn.ts` now call `requireUserId()` before the handler re-parse (matches `addGameToLibraryFn`).

**#2 (high) TRACKED — non-blocking follow-up** (per gate rubric + user decision): `setAvatarUrlFn` URL-origin restriction deferred (deferred-by-design content-policy gap; `User.image` is client-rendered `<img src>`, not server-fetched). Recorded as a tracked task in `tasks.md`.

**Verified (orchestrator, 2026-05-22):** entity gate confirmed at `get-activity-feed.server.ts:88`. Gates: typecheck/lint/format exit 0 · test:unit 1106/138 files · test:integration 509/48 files (+5 privacy cases).
