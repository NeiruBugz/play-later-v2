# Tasks: SavePoint Foundation Replacement (Migrate to TanStack Start)

- **Functional Spec:** [functional-spec.md](./functional-spec.md)
- **Technical Spec:** [technical-considerations.md](./technical-considerations.md)
- **Status:** Draft

> **Methodology**: TDD per slice — write the test first, then the implementation. Each slice leaves both `savepoint-app/` (untouched) and `savepoint-tanstack/` (under construction) runnable. Verification is local-only until the cutover slice (S20).

---

## Vertical 1 — Foundation + Auth + Profile

### Slice 0: Workspace scaffold renders an empty home page

- [x] Create `savepoint-tanstack/` directory; scaffold TanStack Start v1 stable via `create-tsrouter-app` or the TanStack Start starter template; pin exact dependency versions (no caret/tilde). **[Agent: tanstack-fullstack]**
  - Used `pnpm dlx @tanstack/cli create savepoint-tanstack -y --package-manager pnpm --no-git` (current canonical scaffolder; supersedes `create-tsrouter-app`).
  - Resolved versions: `@tanstack/react-start` 1.167.62, `@tanstack/react-router` 1.169.1, `vite` 8.0.0, `react` 19.2.0, `tailwindcss` 4.1.18, `vitest` 4.1.5, `typescript` 6.0.2.
  - Workspace registered (explicit `savepoint-tanstack` entry added to `pnpm-workspace.yaml`); all caret/tilde stripped from `package.json`; `pnpm install` clean; dev server boots clean.
  - **Flags for downstream sub-tasks:**
    1. Tailwind 4 + `@tailwindcss/vite` (CSS-first config) was scaffolded — `savepoint-app/` uses Tailwind 3 + JS config. The "copy Tailwind config verbatim" sub-task will require translating `tailwind.config.ts` into Tailwind 4's `@theme`/`@import "tailwindcss"` CSS format (NOT a verbatim copy).
    2. `package.json` `dev` script currently uses `--port 3000`; needs `--port 6061` in the verification sub-task.
    3. Starter ships only `dev`/`build`/`preview`/`test`. Add `typecheck`/`lint`/`format:check`/`test:unit`/`test:integration` scripts before the verification sub-task can run as written.
    4. `@types/node` 22.10.2 < Vite 8's required 22.12.0 — bump in next sub-task.
    5. `@tailwindcss/vite` 4.1.18 peer-dep mismatch with Vite 8 (declares `^5||^6||^7`); runtime works; revisit if breakage surfaces.
    6. `.cta.json` left by scaffolder; harmless.
- [ ] Register `savepoint-tanstack` in root `pnpm-workspace.yaml`; mirror tsconfig strict settings, ESLint base rules, Prettier config from `savepoint-app/`. **[Agent: tanstack-fullstack]**
- [ ] Copy `savepoint-app/prisma/schema.prisma` and `savepoint-app/prisma/migrations/` verbatim into `savepoint-tanstack/prisma/`; expose only `prisma:generate` and `prisma:format` in `package.json` (NO `migrate` scripts). **[Agent: prisma-database]**
- [ ] Copy `savepoint-app/tailwind.config.ts`, `globals.css`, design tokens, and font setup verbatim into `savepoint-tanstack/`; verify no `next/*` imports leak. **[Agent: react-frontend]**
- [ ] Create `savepoint-tanstack/env.ts` (Zod-validated, server/client split) mirroring all keys from `savepoint-app/env.mjs`; consume `env` everywhere — never raw `process.env.*`. **[Agent: tanstack-fullstack]**
- [ ] Create `savepoint-tanstack/vitest.config.ts` with `unit` (node, mocked Prisma) and `integration` (node, real PG, sequential) projects; add `pnpm --filter savepoint-tanstack test` scripts. **[Agent: typescript-test-expert]**
- [ ] Add CI workflow `.github/workflows/pr-checks-tanstack.yml`, path-conditional on `savepoint-tanstack/**`: typecheck → lint → format check → unit. **[Agent: tanstack-fullstack]**
- [ ] Add a CI step (or pre-commit hook) that diffs `savepoint-app/prisma/schema.prisma` against `savepoint-tanstack/prisma/schema.prisma` and fails on divergence. **[Agent: prisma-database]**
- [ ] Create minimal `savepoint-tanstack/CLAUDE.md` stub (purpose, "this app is under construction", link to spec 021); will grow per slice. **[Agent: tanstack-fullstack]**
- [ ] **Verification**: run `pnpm --filter savepoint-tanstack typecheck && lint && format:check && test`; start dev server on `:6061` (different port from `savepoint-app/` on `:6060`); confirm `/` renders without errors and produces no console warnings. **[Agent: tanstack-fullstack]**

### Slice 1: Better Auth wired — anonymous session lookup works

- [ ] Install `better-auth` (pin exact version matching `savepoint-app/`). **[Agent: tanstack-fullstack]**
- [ ] Create `savepoint-tanstack/app/lib/auth/auth.ts` — BA instance with same `BETTER_AUTH_SECRET`, `prismaAdapter`, Cognito social provider, `accountLinking.trustedProviders=["cognito"]`, session lifetime `30d / 1d`. **NO** `nextCookies()` plugin. **[Agent: tanstack-fullstack]**
- [ ] Create `savepoint-tanstack/app/routes/api/auth/$.ts` mounting `auth.handler` directly via Web Request/Response (catch-all). **[Agent: tanstack-fullstack]**
- [ ] Create `savepoint-tanstack/app/lib/auth/get-session.ts` — `getServerUserId(request: Request): Promise<string | undefined>` reading the `Headers` from a loader/server fn. **[Agent: tanstack-fullstack]**
- [ ] Create `savepoint-tanstack/app/lib/auth/auth-client.ts` — `authClient` from `better-auth/react`, basePath `/api/auth`. **[Agent: tanstack-fullstack]**
- [ ] Write integration test: hit `/api/auth/get-session` unauthenticated → assert `null` body + 200. **[Agent: typescript-test-expert]**
- [ ] Write integration test mirroring `savepoint-app/test/integration/better-auth-cognito-sign-in.integration.test.ts`: per-test isolated PG DB, all migrations applied, BA `idToken` shortcut + `verifyIdToken: () => true` to drive Cognito sign-in; assert `user`, `account` (`providerId="cognito"`, `accountId=<sub>`), and `session` rows; assert `Set-Cookie` header is present on the response (validates session persistence without `nextCookies`). **[Agent: typescript-test-expert]**
- [ ] **Verification**: run `pnpm --filter savepoint-tanstack test:integration`; both tests pass against real PG. **[Agent: typescript-test-expert]**

### Slice 2: Login route — Cognito sign-in lands authenticated user on protected page

- [ ] Create `savepoint-tanstack/app/routes/login.tsx` — Cognito sign-in button + (dev-only, gated on `env.AUTH_ENABLE_CREDENTIALS`) credentials form using RHF + Zod (port `savepoint-app/features/auth/ui/credentials-form.tsx`). **[Agent: tanstack-fullstack]**
- [ ] Create `savepoint-tanstack/app/routes/_authed.tsx` (or use `beforeLoad` on a route group) — guard that calls `getServerUserId(request)` and redirects to `/login` when absent. **[Agent: tanstack-fullstack]**
- [ ] Create `savepoint-tanstack/app/routes/_authed/profile.tsx` — minimal "Hello, you are signed in as <userId>" placeholder for now. **[Agent: tanstack-fullstack]**
- [ ] Implement client-side sign-out via `authClient.signOut({ fetchOptions: { onSuccess: () => router.invalidate() }})` in a `LogoutButton`. **[Agent: tanstack-fullstack]**
- [ ] Component test: login route renders both sign-in surfaces; clicking Cognito button triggers `authClient.signIn.social({ provider: "cognito" })`; credentials form posts to `signInEmail`. **[Agent: typescript-test-expert]**
- [ ] Add the local dev TanStack callback URL to the dev Cognito App Client (manual via AWS Console or terraform if managed) — same path `/api/auth/callback/cognito`, host `http://localhost:6061`. **[Agent: terraform-infrastructure]**
- [ ] **Verification**: with both apps running locally (`:6060` Next, `:6061` TanStack), sign in via Cognito on `:6061` → land on `/profile` placeholder; verify `session` row exists in shared DB and is also valid when `:6060` is refreshed (cross-app session sharing). **[Agent: tanstack-fullstack]**

### Slice 3: DAL conventions established + first profile query

- [ ] Create `savepoint-tanstack/app/lib/db.ts` — Prisma singleton with `globalThis` cache (mirror `savepoint-app/shared/lib/app/db.ts`). **[Agent: prisma-database]**
- [ ] Create `savepoint-tanstack/app/lib/errors.ts` — `AppError` base + `NotFoundError`, `ConflictError`, `ValidationError`, `UnauthorizedError`, `UpstreamError`. **[Agent: tanstack-fullstack]**
- [ ] Create `savepoint-tanstack/app/lib/queries/profile.ts` — `getProfileById(userId)`, `getProfileByUsername(username)`. Plain async functions, throw `NotFoundError` on miss. **[Agent: tanstack-fullstack]**
- [ ] Integration test for `getProfileById` and `getProfileByUsername` against real PG — happy path + missing-user case. **[Agent: typescript-test-expert]**
- [ ] Document the C2 DAL pattern in `savepoint-tanstack/CLAUDE.md`: server-fn + queries split, no Result wrappers, AppError taxonomy, ID format (nanoid not cuid → `z.string().min(1)`). **[Agent: tanstack-fullstack]**
- [ ] Add `errorComponent` to `__root.tsx` that branches on `AppError.code` and renders user-facing copy. **[Agent: tanstack-fullstack]**
- [ ] **Verification**: `pnpm --filter savepoint-tanstack test:integration` green; CLAUDE.md reads cleanly. **[Agent: feature-dev:code-reviewer]**

### Slice 4: Profile read — own profile + public `/u/$username`

- [ ] Replace `/profile` placeholder: route `loader` calls `getProfileById(userId)`; renders ported `ProfileHeader`, `ProfileStatsBar`, `OverviewTab`, `LibraryGrid` (read-only) from `savepoint-app/features/profile/ui/`. Swap `next/link` → TanStack `Link`, `next/image` → plain `<img>`. **[Agent: react-frontend]**
- [ ] Create `savepoint-tanstack/app/routes/u.$username.tsx` — public route, loader calls `getProfileByUsername`; throws `NotFoundError` on miss → router renders error component with 404 copy. **[Agent: react-frontend]**
- [ ] Add `getLibraryStats(userId)` and `getRecentGames(userId)` to `lib/queries/profile.ts` (or `lib/queries/library.ts` if the existing structure justifies it) — read-only stats queries needed for ProfileStatsBar/OverviewTab. **[Agent: tanstack-fullstack]**
- [ ] Component tests for ported profile UI: snapshot/render assertions for ProfileHeader and ProfileStatsBar with stub data. **[Agent: typescript-test-expert]**
- [ ] Integration tests for `getLibraryStats`, `getRecentGames`. **[Agent: typescript-test-expert]**
- [ ] **Verification**: signed-in user visits `:6061/profile` → sees own profile with same data shape as `:6060/u/<own-username>`; visit `:6061/u/<own-username>` → sees public profile; visit `:6061/u/does-not-exist` → 404 page renders. Compare side-by-side against `:6060` for parity. **[Agent: feature-dev:code-reviewer]**

### Slice 5: Profile mutations — username, visibility, settings persist

- [ ] Add `updateProfile(userId, input)` and `isUsernameAvailable(username, excludeUserId?)` to `lib/queries/profile.ts`. **[Agent: tanstack-fullstack]**
- [ ] Create `savepoint-tanstack/app/lib/server-fns/profile.ts` — `updateProfileFn` (Zod input matching today's `ProfileSettingsForm` schema), `checkUsernameFn`. Server fns resolve session, call query, surface `AppError` properly. **[Agent: tanstack-fullstack]**
- [ ] Port `ProfileSettingsForm`, `UsernameInput`, `ProfileVisibilityToggle` UI from `savepoint-app/features/profile/ui/`; adapt action wiring to `useServerFn(updateProfileFn)` instead of next-safe-action / createServerAction. **[Agent: react-frontend]**
- [ ] Port `useUsernameValidation` hook; wire to `checkUsernameFn`. **[Agent: react-frontend]**
- [ ] Mount settings form on a new `/settings/profile` route under the authed group. **[Agent: tanstack-fullstack]**
- [ ] Integration tests: `updateProfileFn` happy path + Zod-rejection + `ConflictError` on duplicate username. **[Agent: typescript-test-expert]**
- [ ] Component tests: ProfileSettingsForm submits → mocked server fn called with expected payload; surfaces server error inline. **[Agent: typescript-test-expert]**
- [ ] **Verification**: signed-in user changes username + visibility on `:6061/settings/profile` → refresh → values persist; same record visible on `:6060` (shared DB). **[Agent: feature-dev:code-reviewer]**

### Slice 6: Avatar upload — full LocalStack round-trip

- [ ] Create `savepoint-tanstack/app/lib/storage/s3.ts` — AWS SDK v3 S3 client honoring `AWS_ENDPOINT_URL`, `S3_BUCKET_NAME`, `S3_AVATAR_PATH_PREFIX` (mirror `savepoint-app/shared/lib/storage/`). **[Agent: aws-infra]**
- [ ] Add `getAvatarPresignedUrlFn` server fn — Zod-validated `contentType` (image MIME allow-list) + `contentLength` (≤10MB); returns presigned PUT URL + final public URL. **[Agent: aws-infra]**
- [ ] Add `setAvatarUrlFn` server fn — persists final public URL to `User.image` (or current avatar field — confirm against schema). **[Agent: tanstack-fullstack]**
- [ ] Port `AvatarUpload` component: client picks file → calls `getAvatarPresignedUrlFn` → PUT direct to S3 → calls `setAvatarUrlFn` → invalidates route. **[Agent: react-frontend]**
- [ ] Integration test: `getAvatarPresignedUrlFn` returns valid presigned URL signed against LocalStack endpoint; reject oversize / disallowed MIME with `ValidationError`. **[Agent: typescript-test-expert]**
- [ ] **Verification**: with LocalStack running (`docker compose up -d`), upload an avatar on `:6061/settings/profile` → image appears on profile + `/u/$username`; same image visible on `:6060` (shared bucket). **[Agent: feature-dev:code-reviewer]**

### Slice 7: Vertical 1 verification + logger decision

- [ ] Run full parity walkthrough across `:6060` ↔ `:6061`: sign-in, profile read, settings edit, avatar upload, public profile, sign-out. Document any divergence in `savepoint-tanstack/CLAUDE.md` "known gaps". **[Agent: feature-dev:code-reviewer]**
- [ ] **Logger decision** (deferred from S0): copy `savepoint-app/shared/lib/logger.ts` (pino) verbatim into `savepoint-tanstack/app/lib/logger.ts` OR pick a slimmer alternative; document rationale in CLAUDE.md. Default-on if no decision: copy verbatim. **[Agent: tanstack-fullstack]**
- [ ] Sweep `console.*` calls introduced during S0–S6, replace with logger. **[Agent: tanstack-fullstack]**
- [ ] **Verification**: parity walkthrough green; logger emits structured JSON in dev console. **[Agent: feature-dev:code-reviewer]**

---

## Vertical 2 — IGDB

### Slice 8: IGDB client + search server function

- [ ] Create `lib/queries/igdb.ts` — port IGDB token cache + REST helpers from `savepoint-app/data-access-layer/services/igdb/`; module-level token state, 60s safety margin on refresh. Throw `UpstreamError` on IGDB failures. **[Agent: tanstack-fullstack]**
- [ ] Create `lib/server-fns/igdb.ts` — `searchGamesFn(query)`, `getGameByIdFn(id)`, `getGameBySlugFn(slug)`. **[Agent: tanstack-fullstack]**
- [ ] Unit tests for token cache (refresh on expiry, parallel-call deduplication, 60s margin). **[Agent: typescript-test-expert]**
- [ ] Integration tests with mocked HTTP layer for `searchGamesFn` happy path + error mapping to `UpstreamError`. **[Agent: typescript-test-expert]**
- [ ] **Verification**: temporary `/dev/igdb-search` route renders results from `searchGamesFn`; tests green. **[Agent: tanstack-fullstack]**

### Slice 9: Add-game flow end-to-end

- [ ] Add `lib/queries/game.ts` with `upsertGameFromIgdb(igdbId)` — fetches IGDB metadata if not cached, upserts `Game` row. **[Agent: tanstack-fullstack]**
- [ ] Add `lib/queries/library.ts` with `addGameToLibrary(userId, igdbId, status)` — upserts game + creates `LibraryItem`. **[Agent: tanstack-fullstack]**
- [ ] Add `addGameToLibraryFn` server fn (Zod-validated). **[Agent: tanstack-fullstack]**
- [ ] Port AddGame search modal UI from `savepoint-app/features/add-game/`; wire to `searchGamesFn` + `addGameToLibraryFn`. **[Agent: react-frontend]**
- [ ] Integration tests: `upsertGameFromIgdb` (cache miss + cache hit), `addGameToLibrary` (creates LibraryItem, idempotent on duplicate). **[Agent: typescript-test-expert]**
- [ ] **Verification**: search a game on `:6061`, add to library, see it appear in DB and (via Slice 4 read paths) on profile/library. **[Agent: feature-dev:code-reviewer]**

---

## Vertical 3 — Library

### Slice 10: Library list with filters and sort

- [ ] Add `getLibrary(userId, filters)` to `lib/queries/library.ts` — supports status filter, sort (rating/added/title), platform filter, rating filter. **[Agent: tanstack-fullstack]**
- [ ] Create `app/routes/_authed/library.tsx` — loader fetches via `getLibrary`; renders ported library list UI from `savepoint-app/features/library/`. **[Agent: react-frontend]**
- [ ] Port library filters / sort controls; persist filter state via search params (TanStack Router `Link search`). **[Agent: react-frontend]**
- [ ] Integration tests for `getLibrary` covering each filter combination. **[Agent: typescript-test-expert]**
- [ ] **Verification**: library page on `:6061` shows same entries in same order as `:6060` for the test user; filters/sort behave identically. **[Agent: feature-dev:code-reviewer]**

### Slice 11: Library mutations — status / rating / platform / delete

- [ ] Add `updateLibraryItem(userId, itemId, input)` and `deleteLibraryItem(userId, itemId)` to `lib/queries/library.ts` — enforce ownership, throw `UnauthorizedError` on cross-user access. **[Agent: tanstack-fullstack]**
- [ ] Add `updateLibraryItemFn`, `deleteLibraryItemFn` server fns. **[Agent: tanstack-fullstack]**
- [ ] Port ManageLibraryEntry modal + form from `savepoint-app/features/manage-library-entry/`; rewire actions. **[Agent: react-frontend]**
- [ ] Integration tests: ownership enforcement, status/rating/platform updates, delete. **[Agent: typescript-test-expert]**
- [ ] **Verification**: edit a library item on `:6061` → persists, same record visible on `:6060`; cross-user access attempt rejected. **[Agent: feature-dev:code-reviewer]**

### Slice 12: Library bulk surfaces (parity-only)

- [ ] Audit current `savepoint-app/` for shipped bulk surfaces (multi-select etc.); only port what is currently shipped. If "Bulk Library Actions" is still on the roadmap (not shipped), this slice is a no-op — document in CLAUDE.md and skip. **[Agent: feature-dev:code-explorer]**
- [ ] If shipped: port multi-select UI + bulk status change / bulk delete server fns. **[Agent: react-frontend]**
- [ ] **Verification**: parity walkthrough; no new behavior introduced beyond what `savepoint-app/` already does. **[Agent: feature-dev:code-reviewer]**

---

## Vertical 4 — Game Detail

### Slice 13: `/games/$slug` route with full data composition

- [ ] Add `getGameDetails(slug, userId?)` orchestration in `lib/queries/game.ts` — IGDB lookup, game cache, library entry (if signed in), journal entries (if signed in), related games. Throws `NotFoundError` on miss. **[Agent: tanstack-fullstack]**
- [ ] Create `app/routes/games.$slug.tsx` — loader calls `getGameDetails`; renders ported game detail composition from `savepoint-app/features/game-detail/`. **[Agent: react-frontend]**
- [ ] Port relevant UI subcomponents (cover, metadata, status strip, journal teaser) — drop `next/image` / `next/link`. **[Agent: react-frontend]**
- [ ] Integration tests: `getGameDetails` for signed-in vs anonymous; missing slug; cache miss vs cache hit. **[Agent: typescript-test-expert]**
- [ ] **Verification**: side-by-side compare `:6060/games/<slug>` and `:6061/games/<slug>` for at least 5 games; surface any divergence. **[Agent: feature-dev:code-reviewer]**

### Slice 14: Browse-related-games infinite scroll

- [ ] Port browse-related-games surface; use TanStack Router search params + loader pagination instead of TanStack Query. **[Agent: tanstack-fullstack]**
- [ ] **Verification**: scroll behavior, page size, total count match `savepoint-app/`. **[Agent: feature-dev:code-reviewer]**

---

## Vertical 5 — Journal

### Slice 15: Journal timeline read

- [ ] Add `getJournalTimeline(userId)` and `getJournalEntriesForGame(userId, gameId)` to `lib/queries/journal.ts`. **[Agent: tanstack-fullstack]**
- [ ] Create `app/routes/_authed/journal.tsx` — chronological timeline UI ported from `savepoint-app/features/journal/`. **[Agent: react-frontend]**
- [ ] Integration tests for both queries. **[Agent: typescript-test-expert]**
- [ ] **Verification**: timeline on `:6061` matches `:6060`. **[Agent: feature-dev:code-reviewer]**

### Slice 16: Journal entry CRUD

- [ ] Add `createJournalEntry`, `updateJournalEntry`, `deleteJournalEntry` to `lib/queries/journal.ts` — ownership-enforced. **[Agent: tanstack-fullstack]**
- [ ] Add corresponding server fns. **[Agent: tanstack-fullstack]**
- [ ] Port journal compose + edit + delete UI. **[Agent: react-frontend]**
- [ ] Integration tests for each operation incl. ownership rejection. **[Agent: typescript-test-expert]**
- [ ] **Verification**: write/edit/delete an entry on `:6061`; visible identically on `:6060`. **[Agent: feature-dev:code-reviewer]**

---

## Vertical 6 — Search & Command Palette

### Slice 17: ⌘K command palette

- [ ] Port command palette UI from `savepoint-app/features/command-palette/`; rebind ⌘K shortcut; reuse `searchGamesFn`. **[Agent: react-frontend]**
- [ ] Integration tests for keyboard binding + search debounce. **[Agent: typescript-test-expert]**
- [ ] **Verification**: ⌘K opens on `:6061`, searches games, navigates to game detail via TanStack Router. **[Agent: feature-dev:code-reviewer]**

---

## Vertical 7 — Settings + Social + Onboarding

### Slice 18: Remaining surfaces

- [ ] Settings shell `/settings/account` — port account section (email read-only, sign-out, delete account if shipped). **[Agent: react-frontend]**
- [ ] Social: follow/unfollow server fns + queries; followers/following list routes; activity feed. Port from `savepoint-app/features/social/`. **[Agent: tanstack-fullstack]**
- [ ] What's-new modal port. **[Agent: react-frontend]**
- [ ] First-time onboarding port (only if shipped in `savepoint-app/`). **[Agent: react-frontend]**
- [ ] Integration tests for each social server fn. **[Agent: typescript-test-expert]**
- [ ] **Verification**: parity walkthrough across all settings/social/onboarding flows on `:6061` vs `:6060`. **[Agent: feature-dev:code-reviewer]**

---

## Vertical 8 — Cutover

### Slice 19: Final parity audit

- [ ] Generate a parity matrix: every URL in `savepoint-app/` mapped to its equivalent in `savepoint-tanstack/`. Block on any unmapped URL. **[Agent: feature-dev:code-explorer]**
- [ ] Cross-app session check on every authed route: sign in on `:6060`, navigate to each route on `:6061`, confirm it loads correctly. **[Agent: feature-dev:code-reviewer]**
- [ ] CodeRabbit-style independent review of `savepoint-tanstack/` end-to-end before cutover. **[Agent: feature-dev:code-reviewer]**
- [ ] **Verification**: parity matrix is 100% green; no critical findings outstanding. **[Agent: feature-dev:code-reviewer]**

### Slice 20: Cutover PR

- [ ] Add production TanStack callback URL to the prod Cognito App Client (`<prod-host>/api/auth/callback/cognito`) — same path as today, so likely already present. **[Agent: terraform-infrastructure]**
- [ ] Update Vercel project root to `savepoint-tanstack/` (single config change). **[Agent: tanstack-fullstack]**
- [ ] Update root `CLAUDE.md`, `README.md`, `CONTEXT-MAP.md` to reflect new primary app. **[Agent: tanstack-fullstack]**
- [ ] Document rollback procedure: revert the cutover PR, redeploy. No data migration to undo. **[Agent: tanstack-fullstack]**
- [ ] **Verification (HUMAN-IN-THE-LOOP)**: deploy preview at preview URL → smoke check across sign-in, profile, library, journal, game detail, search; verify production sessions persist; verify production avatars load; sign in via Cognito on prod preview. Only merge to main after explicit user approval. **[Agent: feature-dev:code-reviewer]**
- [ ] Post-cutover (separate PR, +1 release cycle): delete `savepoint-app/` from the repo. Until then, keep it as rollback insurance. **[Agent: tanstack-fullstack]**

---

## Dependency / Service Checklist (verify before starting each slice)

| Service | Required From | Notes |
|---|---|---|
| PostgreSQL on `:6432` (Docker) | S0 | Shared with `savepoint-app/` |
| LocalStack on `:4568` | S6 onwards | S3 for avatars |
| Cognito dev App Client callback URL added | S2 | One-time manual config |
| `BETTER_AUTH_SECRET`, `AUTH_COGNITO_*` env vars in `savepoint-tanstack/.env.local` | S1 | Same values as `savepoint-app/.env.local` |
| `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET` | S8 | Same values |
| `S3_BUCKET_NAME`, `AWS_*` env vars | S6 | Same values |
| Cognito prod App Client callback URL | S20 | One-time manual config at cutover |

## Subagent Assignment Summary

| Agent | Used For |
|---|---|
| `tanstack-fullstack` | TanStack Start setup, routing, server fns, queries, BA wiring, env, conventions |
| `react-frontend` | UI ports (Tailwind, shadcn, RHF + Zod forms, components) |
| `prisma-database` | Prisma schema copy + drift check (no migrations from this app) |
| `aws-infra` | S3 client + LocalStack presigned URLs |
| `terraform-infrastructure` | Cognito callback URL changes (dev + prod) |
| `typescript-test-expert` | All Vitest unit + integration tests |
| `feature-dev:code-reviewer` | Per-slice parity verification, final pre-cutover review |
| `feature-dev:code-explorer` | Audit `savepoint-app/` for shipped vs roadmap features (S12), parity matrix (S19) |
