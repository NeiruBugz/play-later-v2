# SavePoint Parity Audit — `savepoint-app/` vs `savepoint-tanstack/`

> [toc]

- **Date:** 2026-05-18
- **Reference cutoff:** Spec 021, Slice 14A (V1 closed; phase-2 streaming + diff-sweep findings applied)
- **Visual parity policy:** Deferred to Slice 18A per spec; hand-rolled Tailwind now, shadcn restyle later
- **Divergence log:** `savepoint-tanstack/CLAUDE.md` § "Known gaps" + § "Intentional divergences"

## Methodology

Two parallel surface-map agents enumerated routes, widgets, features, entities, primitives, and cross-cutting affordances on both sides. Findings were cross-referenced against the tracked Slice 14A gap matrix to distinguish *undocumented drift* from *planned deferral*. No undocumented drift was discovered.


## 1. Route / page parity

| Canonical route | TanStack route | Status | Notes |
|---|---|---|---|
| `/` marketing | `/` | OK | Hero + features grid |
| `/login` | `/login` | OK | Cognito + dev email |
| `/dashboard` | — | MISSING | No `_authed/dashboard`. ContinuePlaying / UpNext / RecentlyAdded / QuickLog / ActivityFeed / Getting-Started not ported |
| `/library` | `/_authed/library` | PARTIAL | Grid + filters; backend filtering ignores `minRating` / `unratedOnly` / `sort` (deferred S14A) |
| `/journal` | `/_authed/journal` | STUB | "Coming soon" placeholder (S15) |
| `/journal/new`, `/journal/[id]`, `/journal/[id]/edit` | — | MISSING | Whole compose/read/edit flow (S15/S16) |
| `/profile` | `/_authed/profile` | DIVERGENT | Canonical redirects; tanstack renders inline own-profile (intentional pivot) |
| `/profile/settings`, `/settings`, `/settings/profile` | `/_authed/settings/profile` | OK | Avatar + form wired |
| `/settings/account` | — | MISSING | Sidebar item disabled with TODO(S18) |
| `/settings/connections` | — | MISSING | Steam OAuth + third-party connections page |
| `/profile/setup` | — | MISSING | New-user onboarding form |
| `/steam/games` | — | MISSING | Steam-synced library view |
| `/games/search` | `/dev/igdb-search` (dev-only) | PARTIAL | Dev tester only; no production search page or infinite scroll |
| `/games/[slug]` | `/games/$slug` | OK | Phase-1 SSR + phase-2 stream |
| `/u/[username]` | `/u/$username` | PARTIAL | Flat single-section; tabs + follow button missing |
| `/u/[username]/(tabs)/activity` | — | MISSING | Activity feed |
| `/u/[username]/(tabs)/library` | — | MISSING | Public library tab |
| `/u/[username]/followers`, `/following` | — | MISSING | Followers/following lists |
| — | `/about` | EXTRA STUB | 23 LOC placeholder, not in canonical |

**Net:** ~13 routes missing or stubbed (Verticals 2 social, 3 journal, 4 dashboard/steam/account/connections).


## 2. Widget parity

| Canonical widget | TanStack | Status |
|---|---|---|
| `sidebar` (AppSidebar + SettingsRail) | `AppSidebar` | PARTIAL — hand-rolled `<aside>`; no SettingsRail; account menu disabled |
| `mobile-topbar` | — | MISSING |
| `mobile-nav` (bottom pills md-) | — | MISSING — mobile shell not ported |
| `header` (public) | `LandingHero` (partial) | PARTIAL — landing-only; no public-profile header variant |
| `game-card` | `LibraryItemCard` (entity) | PARTIAL — only library variant; no search/dashboard variants |
| `auth-migration-banner` | — | MISSING |
| — | `AppShell`, `AuthPageView`, `LandingFeatures`, `ProfileOverview`, `GameDetail`, `LibraryPage` | composers (canonical embeds in pages) |


## 3. Feature parity (user-intent slices)

| Canonical | TanStack | Status |
|---|---|---|
| `auth` | `auth-cognito-sign-in`, `auth-email-sign-in`, `auth-sign-out` | OK (split) |
| `profile` | `edit-profile`, `upload-avatar`, `profile-overview` | OK (split) |
| `setup-profile` | — | MISSING |
| `library` | `library-list`, `filter-library` | PARTIAL — filter backend incomplete |
| `manage-library-entry` | `manage-library-entry`, `add-game` | OK |
| `game-detail` | `game-detail` | OK |
| `game-search` | `search-games` | PARTIAL — used only inside add-game modal |
| `browse-related-games` | `browse-related-games` | OK |
| `journal` | — | MISSING (S15/S16) |
| `dashboard` | — | MISSING |
| `social` | — | MISSING |
| `onboarding` | — | MISSING |
| `command-palette` | — | MISSING (S17) |
| `steam-import` | — | MISSING |
| `whats-new` | — | MISSING |
| — | `toggle-theme` | EXTRA (light/dark/auto) |


## 4. Entity parity

| Canonical | TanStack | Status |
|---|---|---|
| User / Session | `session` | OK |
| Profile | `profile` | OK (+ privacy gate moved to entity layer — improvement) |
| Game | `game` | OK (banner artwork field deferred) |
| LibraryItem | `library-item` | OK |
| JournalEntry | `journal-entry` | PARTIAL — read-only teaser, no mutations |
| Follow | — | MISSING |
| Platform (cached) | — | PARTIAL — hard-coded options in library modal |
| Collection | — | n/a (canonical-future) |


## 5. Shared UI primitive parity

| Primitive | Canonical | TanStack |
|---|---|---|
| Button, Card, Input, Label, Form, Switch, Sonner, Avatar | OK | OK |
| Badge, Dialog, DropdownMenu, Popover, Select, Sheet, Tooltip, Command, RatingInput | OK | OK |
| Tabs | OK | MISSING — stacked sections substituted |
| Sidebar (shadcn) | OK | MISSING — hand-rolled |
| Skeleton | OK | MISSING — `animate-pulse` substituted |
| Checkbox, Textarea, Alert, Collapsible, Separator, ScrollArea, SegmentedControl, ProgressRing, EmptyState, UndoToast | OK | MISSING |


## 6. Cross-cutting affordances

| Affordance | Canonical | TanStack |
|---|---|---|
| Cmd+K command palette | OK | MISSING (S17) |
| Journal FAB | OK | MISSING |
| Toasts (sonner) | OK | OK |
| Undo-toast | OK | MISSING |
| Delete confirmation dialogs | OK | PARTIAL — inline-confirm only in library modal |
| Whats-new modal | OK | MISSING |
| Auth migration banner | OK | MISSING |
| Skip-to-content / a11y root | OK | UNVERIFIED |
| Error boundary | OK | OK (branches on `AppError.code`) |


## 7. Tracked visual deltas (Slice 18A queue)

From `savepoint-tanstack/CLAUDE.md` § "Known gaps (Slice 14A — UI parity)":

- `SidebarSearchTrigger` — no ⌘K affordance/glyph, no popover (row 2)
- `SidebarNavLinks` — flat list, no collapsible groups (row 3)
- `AddGameTrigger` — no quick-add Popover (row 13)
- `AddGameModal` — no shadcn `Form` (row 14)
- `LibraryModal` — no platform combobox-with-search; no desktop/mobile split; no entry metadata thumbnail (rows 16, 18, 19)
- `GameDetailHero` — no `⋯` DropdownMenu, no blurred banner, no studio/genre eyebrow (row 21)
- `RelatedGamesSection` — stacked H3 sections instead of Tabs + ScrollArea (row 25)
- `RelatedGameCard` — stripped-down vs full GameCard widget (row 26)
- `RelatedGamesSkeleton` — `animate-pulse` instead of shadcn Skeleton (row 27)
- `TimesToBeatSection` — bare `<dl>`, no bar viz / completion strip (row 24)
- `ProfilePage` — no Overview/Activity/Library tabs, no follow controls (row 30)
- `JournalTeaser` — read-only, no "Add entry" CTA (row 29)
- `LibraryItemCard` diff-sweep — status badge placement (F1), avatar fallback (F2), hover/focus theme bloom (F3), rating strip F4


## 8. Summary scorecard

| Vertical | Routes | Widgets | Features | Visual | Notes |
|---|---|---|---|---|---|
| V1 Auth + Profile + Settings | OK | PARTIAL | OK | PARTIAL | GREEN per spec |
| V1 Library | PARTIAL | OK | PARTIAL | PARTIAL | filters partial |
| V1 Game detail + search | PARTIAL | OK | PARTIAL | PARTIAL | functional core |
| Public profile / social | PARTIAL | MISSING | MISSING | n/a | out of V1 scope |
| Journal | STUB | n/a | MISSING | n/a | S15/S16 |
| Dashboard | MISSING | MISSING | MISSING | n/a | unplanned |
| Steam / Connections / Setup / Account | MISSING | n/a | MISSING | n/a | unplanned |
| Command palette + FAB + Whats-new | MISSING | n/a | MISSING | n/a | S17 / S18+ |


## 9. Bottom line

- **Feature parity:** ~40% of canonical surface. Functionally green for V1 (auth, profile, library CRUD, game detail). Gaps — dashboard, journal, social/follow, steam, command palette, mobile shell — are planned downstream (S15–S18) or unplanned post-cutover work.
- **Visual parity within ported surfaces:** ~60%. 16 documented gaps queued for Slice 18A as a single coherent restyle.
- **Drift:** No undocumented drift detected. Every divergence is logged in `savepoint-tanstack/CLAUDE.md`.
