# Bugs found by the 026 UI audit (not yet filed)

Independent of spec 026. Ticket-shaped so each can go to GitHub Issues as is. Paths relative to `savepoint-tanstack/`. Repro accounts: [ui-audit.md § Setup](./ui-audit.md#setup).

## U1. First run blocked: `/profile/setup` redirects to itself (critical)

- **Repro:** sign in as `audit_empty` (no username) → redirected to `/profile/setup` → `ERR_TOO_MANY_REDIRECTS`.
- **Cause:** `src/routes/_authed/profile.setup.tsx` is a child of `src/routes/_authed/profile.tsx`; the parent's `beforeLoad` (lines 17-25) redirects any user needing setup to `/profile/setup`, so it runs again for the child.
- **Acceptance:** a user without a username sees the setup form; a set-up user visiting `/profile/setup` goes to `/dashboard`; `/profile` still redirects to `/u/$username`.

## U2. Journal note, compose and edit pages never render (critical)

- **Repro:** `/journal` → click a note, or "Compose entry" → URL changes to `/journal/<id>` / `/journal/new`, the list stays on screen (also after reload).
- **Cause:** `src/routes/_authed/journal.tsx` renders the timeline with no `<Outlet/>`; `journal.$id.tsx`, `journal.new.tsx`, `journal.$id.edit.tsx` nest under it.
- **Acceptance:** each of the three URLs renders its own page, on direct load and on in-app navigation; `/journal` still renders the timeline.

## U3. Followers / following lists never render (high)

- **Repro:** `/u/audit_full` → "1 Followers" → URL changes, profile stays.
- **Cause:** `src/routes/u.$username.tsx` has no `<Outlet/>`; `u.$username.followers.tsx` / `.following.tsx` nest under it.
- **Acceptance:** both lists render on direct load and via the profile links.

## U4. Public profile exposes private run notes and ratings (high, privacy)

- **Repro:** sign out → `/u/audit_full` → Playthroughs section shows each run's notes text and `n/10`.
- **Cause:** `src/entities/playthrough/api/get-profile-playthroughs.server.ts:51-52` selects `notes` and `rating`; `src/widgets/profile-overview/ui/profile-playthroughs-section/profile-playthroughs-section.tsx:36-41` renders them for any viewer.
- **Acceptance:** run notes never reach a non-owner (not in the payload, not rendered); decide whether ratings stay public.

## U5. Profile "Recently Played" tiles lead to not-found (high)

- **Repro:** `/u/audit_full` → click any Recently Played tile → not-found page.
- **Cause:** `src/widgets/profile-overview/ui/profile-overview/profile-overview.tsx:180` passes `slug: String(game.gameId)` (a cuid) to `/games/$slug`.
- **Acceptance:** tiles link to the game's slug and open its page.

## U6. Removing a game: no confirm or undo in two places, and runs are cascade-deleted (high)

- **Repro:** library card ⋮ → "Remove from Library" (or game page ⋯) → removed at once; Edit details instead requires typing the title.
- **Cause:** `src/features/manage-library-entry/ui/library-card-menu/library-card-menu.tsx:53-58`, `src/widgets/game-detail/ui/library-status-switcher/library-status-switcher.tsx:224-239` vs `src/features/manage-library-entry/ui/library-modal/delete-confirm/delete-confirm.tsx:30`; `prisma/schema.prisma:186` cascades `Playthrough` (hours, ratings, notes).
- **Acceptance:** every remove path behaves the same (one pattern: confirm, or remove + undo toast); the user is told that the game's history goes with it. Not verified in the browser: found by the code pass only.
