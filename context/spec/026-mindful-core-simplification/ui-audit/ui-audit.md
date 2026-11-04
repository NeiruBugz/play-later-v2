# UI Audit: intuitiveness and overload (spec 026 input)

- **Status:** Baseline run done 2026-11-04 (steps 1, 2, 4 + heuristic synthesis). Think-aloud done: [think-aloud.md](./think-aloud.md) (takeaways T1–T7).
- **Goal:** find where the current UI is unclear or overloaded, beyond the status-model quirks already in [feature-brief.md §5](../feature-brief.md). Every finding is tagged: covered by 026 / new 026 requirement / separate spec.
- **Baseline:** pre-026 code (five statuses, playthroughs). The same run is repeated after 026 ships to compare numbers.

## Setup

Local only: the credentials provider is disabled in production (`auth.server.ts`, `AUTH_ENABLE_CREDENTIALS=true` + non-prod).

| Account | Password | State |
|---|---|---|
| `audit_full@savepoint.local` | `audit-pass-123` | 28 games across all 5 statuses, 10 runs, 11 notes, 40 staged Steam games, public, follows `audit_friend` |
| `audit_friend@savepoint.local` | `audit-pass-123` | 5 games with recent status changes (activity feed), public, follows back |
| `audit_empty@savepoint.local` | `audit-pass-123` | Fresh: no username, no games (first-run + onboarding) |

Re-create accounts (dev server on :6060) and seed:

```bash
for u in audit_full audit_empty audit_friend; do
  curl -s -X POST http://localhost:6060/api/auth/sign-up/email \
    -H 'Content-Type: application/json' -H 'Origin: http://localhost:6060' \
    -d "{\"email\":\"$u@savepoint.local\",\"password\":\"audit-pass-123\",\"name\":\"$u\"}"
done
docker exec -i savepoint-postgres psql -v ON_ERROR_STOP=1 -U postgres -d savepoint-db < seed-audit-users.sql
```

The seed is idempotent and deliberately contains the brief's quirk cases: Playing with no runs (#2), Played via abandoned run (#3), Up Next already played = Replay (#7), manual override, two ratings (#9), note with minutes but no text (#8). It uses the 34 `Game` rows already in the local DB.

## Method

1. **Screen inventory (automated).** Each surface at 390px and 1440px, via Playwright MCP + `browser_evaluate`: interactive elements (total / above the fold), distinct actions, domain terms shown, blocks, screenshot.
2. **Task walkthroughs.** Count clicks, decision points, dead ends and error traps for the core tasks below.
3. **Heuristic review.** Nielsen's 10 + product definition v3.0 principles (few concepts, one tap, dropping is fine, no competition, main thing visible). Severity critical/high/medium/low.
4. **Consistency (code).** `rg` over UI strings and handlers: one concept under several names, one action behaving differently in different places, dead entry points.
5. **Think-aloud with Nail.** 5-second test on the dashboard, then the tasks below while saying out loud what he expects; the facilitator only records, never helps.

### Surfaces (all)

Landing `/`, `/login`, `/about`, `/dashboard`, `/library` (grid, list, filters, sort), `/games/$slug` (in library / not in library / signed out), `/games/search`, `/journal`, `/journal/new`, `/journal/$id`, `/journal/$id/edit`, `/profile/setup`, `/u/$username` (own / friend / private), followers / following, `/settings/profile`, `/settings/account`, `/steam/games`.
Overlays: ⌘K palette, Log sheet, library add dialog, status picker (popover + sheet), Edit details form, playthrough form, compose dialog, onboarding checklist, mobile bottom nav, sidebar.

### Core tasks

1. Decide what to play tonight.
2. Add a game you just heard about.
3. Put it next in the queue.
4. Start playing it.
5. Log tonight's session (hours only, then with a note).
6. Mark a game finished; mark another as dropped.
7. Find a note you wrote last week.
8. First run (`audit_empty`): get from sign-up to a first game in the library.

## Summary

Three passes ran in parallel: A = screen inventory (Playwright, 390 + 1440), B = task walkthroughs (Chrome), C = consistency from code. Findings below are merged across passes; the Source column says which pass saw it (two or three sources = higher confidence). Brief §5 quirks are not repeated unless the UI makes them worse than the brief says.

Task outcomes (B): 6 of 8 core tasks succeed in 2–7 clicks. **Task 7 (find a note) and task 8 (first run) dead-end.** Task 6b ("I dropped this game") cannot be expressed at game level at all.

### Heuristic synthesis

1. **Duplication is the main source of overload.** Notes ×3 on the game page, status counts ×2 on dashboard and library, status filter ×2, the current game ×3 on mobile dashboard, "Log" opens 4 different forms, two identical "+" buttons. Removing duplicates cuts more than any redesign.
2. **Labels say something the data doesn't.** "Recently played" = recently added, "This month" = all time, "Reflection" field saves a "Quick note", "Log session" on games not in the library, What's New claims automatic Steam sync. (Nielsen #2 match with the real world.)
3. **Feedback is missing or inconsistent.** A successful log shows nothing; one status change confirms 3 different ways; 5 toast wordings for "added".
4. **Desktop and mobile disagree.** List view, its one-tap buttons and the rating filter exist only on mobile; the mobile game-page bar exists only behind the nav.
5. **Stats pressure contradicts "no competition".** 12 counters + a distribution bar on the dashboard, backlog-age strip and "unrated" on every card, "long road left to 100%".
6. **Routing is broken in ways tests can't see.** Two parent routes without `<Outlet/>`, a self-redirect loop, cuid-instead-of-slug links, an unreachable search page. Route unit tests render components in isolation; there is no E2E tier.

## Bugs to fix regardless of 026

| # | Finding | Sev | Evidence | Source |
|---|---|---|---|---|
| U1 | A user without a username is redirected `/profile/setup` → itself until the browser errors (`ERR_TOO_MANY_REDIRECTS`). First run is blocked. | critical | `routes/_authed/profile.tsx:17-25` `beforeLoad` runs for its child `profile.setup.tsx` | A, B |
| U2 | Journal child routes never render: opening a note, "Compose entry" and edit change the URL but show the list. Blocks 026 §2.9 ACs. | critical | `routes/_authed/journal.tsx` has no `<Outlet/>`; `journal.$id`, `journal.new`, `journal.$id.edit` nest under it | A, B |
| U3 | Followers / following lists never render (same cause). | high | `routes/u.$username.tsx` has no `<Outlet/>` | A |
| U4 | The public profile shows every run's free-text notes and `n/10` rating to any visitor, signed out included. Notes are meant to be private. | high | `profile-playthroughs-section.tsx:36-41`, `get-profile-playthroughs.server.ts:51-52` | C |
| U5 | Profile "Recently Played" tiles link to `/games/<Game.id cuid>`; every tile is a not-found page. | high | `profile-overview.tsx:180` `slug: String(game.gameId)` | C |
| U6 | Removing a game: card ⋮ and game ⋯ remove in one tap with no confirm and no undo; Edit details requires typing the title. Removal cascade-deletes runs (hours, ratings, notes). | high | `library-card-menu.tsx:53-58`, `library-status-switcher.tsx:224-239`, `delete-confirm.tsx:30`, `schema.prisma:186` | C |

## Findings for 026 (in scope, not yet specified)

Proposed as new requirements / ACs for functional-spec.md.

| # | Surface | Finding | Principle | Sev | Evidence | Source |
|---|---|---|---|---|---|---|
| N1 | Game page (mobile) | The sticky status / Log bar is fully covered by the bottom nav at every scroll position, so 026 §2.3's phone bottom bar is unreachable today. | One tap; N1 | high | bar top 787 vs nav top 780; `elementFromPoint` = nav | A, B |
| N2 | Library (desktop) | No grid/list toggle on desktop; list-card next-step buttons, lifecycle strip and chips are mobile-only. Needed for §2.3 "grid and list". | One tap; parity | high | `mobile-filter-bar.tsx:90,118-138`; toggle width 0 at 1440 | A, B, C |
| N3 | `/games/search` | Unreachable: its only link is in the library "empty" branch, which never renders because the route always passes `onboarding`. §2.6 lists it as an add path. | Orphan | high | `library-page.tsx:309-323`, `routes/_authed/library.tsx:62-67` | C |
| N4 | Game page | Each note appears up to 3× (run lists, "// JOURNAL" teaser titled "Untitled entry", unheaded feed); none is clickable. Spec should require one notes list whose items open the note. | Few concepts; N8 | high | `journal-teaser.tsx:46`, `nested-journal.tsx:42-55`, `journal-feed.tsx:68-83` | A, B, C |
| N5 | Log | "Log session" opens 4 different forms (global sheet in hours, compose dialog in minutes, per-run drawer, text-only `/journal/new` with no game picker). Spec should name one Log form used everywhere. | Consistency | high | `library-item-card-cta.tsx:61-63`, `log-session-content.tsx:174-212`, `compose-journal-entry-dialog.tsx:88-100`, `compose-journal-entry-form.tsx:31-36` | A, C |
| N6 | Log sheet | The game picker is a flat, unsearchable list of every game (Wishlist and Done included) by last edit; on desktop it is 1346px tall in a 900px viewport. After picking, the game is never named. Success shows no confirmation. | Recognition; status visibility | high | `global-action-host.tsx:35` passes no title; 32 buttons; no toast | A, B, C |
| N7 | Game page | "Log a session" shows for games not in the library and to signed-out visitors, and the server accepts it, while the invite card says "Add this to your library to log sessions". | Error prevention | high | `game-detail-detail-rail.tsx:30-32`, `game-detail-action-bar.tsx:67-69` | A, C |
| N8 | Library filters | The Acquisition filter (Owned / Subscription / Physical) reads a field nothing writes (always DIGITAL), and its "Owned" clashes with the §2.5 owned marker. Spec should say it is removed or replaced by §2.5. | Few concepts; dead feature | high | `acquisition.ts:28-33`; no writers of `acquisitionType` | A, C |
| N9 | Dashboard | "Recently played" is recently *added* (sorted by createdAt) and lists Wishlist / Shelf games never played. | Labels match data | high | `get-dashboard-page-data.worker.ts:77`; rail shows WISHLIST Scary Shadow Spot | A, B, C |
| N10 | Time played | Totals disagree ("Total played" sums runs, "Sessions" counts notes with minutes: can read "0h · Sessions 3"); the same 90 min renders as 1h 30m / 1.5h / 2h / 1h. Spec should define one total and one format. | Consistency | high | `get-game-details.server.ts:98-132`, `date.ts:95-101`, `your-pace-panel.tsx:6-8`, `journal-feed.tsx:28-31` | C |
| N11 | ⌘K, add dialog, Steam | Search results don't mark games already in the library (Hades, already Up Next, offers "Add to Up Next"); `/games/search` does. | Consistency; error prevention | medium | screenshots `ov-cmdk-typed-1440`, `ov-add-dialog-typed-390` | A |
| N12 | Journal | A time-only note shows as an empty `“”` card; time is never shown in the Journal list or note view; edit can't change time and blocks saving an empty text. | Status visibility | medium | `journal-entry-card.tsx:20,49-53`, `edit-journal-entry-form.tsx:54-82` | B, C |
| N13 | Journal | Sorted and dated by `updatedAt`: editing an old note moves it to the top with a new date. | Predictability | medium | `get-journal.server.ts:21`, `journal-entry-card.tsx:41-44` | C |
| N14 | Dashboard, library | Same counts twice (dashboard strip + "// LIBRARY" stats card, 12 numbers + bar); status filter twice on desktop library (chips + sidebar). | Minimalism; no competition | medium | `dashboard-page.tsx:49-52,82-89`, `library-filters.tsx:105-117` | A, B, C |
| N15 | Dashboard (mobile) | The current game appears 3× (hero, Playing rail, Recently played); Up next starts ~1.5 screens down. | Main thing visible | medium | `dashboard-390.png` | A, B, C |
| N16 | Empty states | Empty-state CTAs loop to empty views ("Browse games" → empty Up Next filter); two empty states for "nothing in progress"; "Pick something from your shelf" with an empty shelf. | Help recover | medium | `dashboard-game-rail.tsx:116-125`, `dashboard-page.tsx:96-103` | A, B, C |
| N17 | Library cards | Backlog-age lifecycle strip on every list card; grey "unrated" on ~24 of 31 cards. | No pressure; noise | medium | `lifecycle-strip.utility.ts:91-109`, `library-item-card.tsx:122-125` | A, C |
| N18 | Nav / icons | `+` means both Log (bottom nav center) and Add (FAB); on mobile library they sit side by side and the FAB covers a card's ⋮. No add-game entry in nav or sidebar. | Consistency; affordance | medium | `app-bottom-nav.tsx:52`, `library-item-card.utility.ts:54-56` | A, B, C |
| N19 | Library filters | Minimum rating / Unrated only exist only in the mobile sheet; §2.11 ACs rely on a rating filter. | Parity | medium | `library-filters.tsx:100-172` vs `mobile-filter-bar.tsx:199-205` | C |
| N20 | Journal rail | "This month" shows all-time counts. | Labels match data; stats | low | `journal-stats-rail.tsx:7-16`, `get-journal.server.ts:16-24` | B, C |
| N21 | Palette | "Add game to library" quick action only refocuses the input; "New journal entry" goes to `/journal`, not `/journal/new`. | Visibility | low | `command-palette.tsx:119-124`, `palette-quick-actions-group.tsx:18-36` | B, C |
| N22 | Library list (mobile) | Status badge truncated to "PLA" by ⋮ (Played and Playing look the same; 3 statuses will still clip "PLAYING"). | Recognition | low | RE2 / Rebirth / Hollow Knight cards | B |
| N23 | Copy | Status badge case varies (UP NEXT vs Up Next); vendor jargon in the add dialog ("Search the IGDB catalog", "// IGDB RESULTS"). Adopt the vocabulary table below. | Consistency; N2 | low | `library-status-badge.tsx:6-10`, `search-games-results.tsx:157` | A, C |

## Confirmed by the UI, already covered by 026

| Finding (as observed) | 026 § | Source |
|---|---|---|
| Header says "Played · Follows your playthroughs" while the run is still Playing, after a library-card change | §2.2, §2.10 | B |
| "Dropped" can't be expressed; "Abandoned" lives only in the 9-field run form; dropped RE2 looks finished | §2.7 | B |
| Three add paths gave three statuses; two "Add to library" buttons on one page behave differently | §2.6 | A, B |
| Up next rail is 4 by last edit; queueing pushes older picks off | §2.4 | B |
| Hours-only log for a game without runs fails with a raw Zod JSON toast under "playtime alone is a complete log" | §2.9 (raw error display: §2.14) | B |
| Playthrough form defaults to "Finished"; "Log your first playthrough" on Playing games | §2.10 | B |
| Profile "8 played · 4 completed" vs library "Played 6"; finishing a run doesn't change "completed" | §2.13 | A, B |
| "Reflection" field → "Quick note" label → "Untitled entry" | §2.9 | A |
| Status-change and add toasts differ by path; undo only on ⌘K | §2.3, §2.6 | B, C |
| Edit details: 5-status select, dates, "Mark complete" | §2.10, §2.1 | A |
| `9/10` on profile vs stars on cards | §2.11 | A |
| Status option order differs between pickers | §2.1 | B, C |

## Separate (later specs / cleanup)

| # | Finding | Sev | Evidence | Source |
|---|---|---|---|---|
| S1 | Sign-in lands on the public profile, not the dashboard / Up Next | medium | login → `/u/audit_full` | A, B |
| S2 | Onboarding checklist items are plain text, vanish after the first add; `/login` has no sign-up link | medium | `onboarding-checklist.tsx:69-178` | A, B, C |
| S3 | What's New modal claims automatic Steam sync with playtime and achievements; shown to already-connected users | medium | `whats-new/config.ts:13-15` | A, C |
| S4 | Times-to-beat: "long road left to 100%" pressure line; overlapping labels | medium | `game-inlib-witcher-1440.png` (roadmap #6) | A, B |
| S5 | `/steam/games`: in-library games not marked; "Dismiss" vs "Removed from list", no undo; "Smart default" jargon | medium | `imported-game-card.tsx:122-133` (roadmap #7) | A, C |
| S6 | Own profile "Activity" shows the following feed; rows are not links; empty state promises journal entries | medium | `u.$username.tsx:47-53`, `profile-activity-tab.tsx:40-73` | C |
| S7 | Mobile game-page ⋯ "More" has no handler; Back / breadcrumbs always go to `/library` | low | `game-detail.tsx:325-358` | C |
| S8 | Dead UI: hero session / progress never renders, "Last session" hard-coded null, card menu "View Journal Entries" just opens the page; 10 never-rendered components; `/about` is the starter page | low | `dashboard-jump-back-in-hero.tsx:33-108`, `game-detail.tsx:458`, `about.tsx:13-19` | A, C |
| S9 | Accessibility: settings visibility switch has no name; dashboard chips < 24px tall | low | probe output | A |

## Vocabulary (proposed canonical words)

| Concept | Variants today | Use |
|---|---|---|
| The user's games | library / collection / backlog / shelf / list | library |
| A journal item | entry / journal entry / Quick note / Reflection / Untitled entry | note |
| Log action | Log / Log session / Log Session / Log a session / Record a play session | Log (verb), Log time (button) |
| Time played | Playtime / Time played (minutes) / Hours played / Your time / Total played / Avg session | Time played, in hours |
| Finished | Played / Completed / Mark complete / Finished / done | Done (sub-type Finished) |
| Dropped | Abandoned / Tried / Hide untouched games | Let go / not started |
| Attempt | playthrough / run / journey | play (hidden from the main flow, §2.10) |
| Home | Home / Dashboard | Home |
| Add | Add game / Add to library / Start tracking / Add to Up Next / Queue It / Add to Shelf | Add |
| Remove | Remove from Library / Delete from library / Delete / Dismiss | Remove (library), Delete (notes) |
| Steam | Import / Sync / Connect Steam / Imported games | Import from Steam |

## Metrics (baseline 2026-11-04)

Probe: [measure.js](./measure.js). Caveats: pass B mutated `audit_full` during pass A (+1 Playing game, +4 notes); "Log" and "Played" match nav/"last played" on every page. Re-seed before the after-026 run.

| Surface | Viewport | Interactive (total / above fold) | Distinct actions | Domain terms | Words |
|---|---|---|---|---|---|
| Dashboard | 390 / 1440 | 33/25 · 34/33 | 25 · 27 | 7 | 139 · 136 |
| Library grid | 390 / 1440 | 82/28 · 94/62 | 82 · 93 | 7 | 243 · 278 |
| Library list | 390 | **144/32** | 88 | 9 | 467 |
| Game in library, 2 runs | 390 / 1440 | 54/31 · 56/33 | 48 · 48 | 6 | 365 · 391 |
| Game Playing, no runs | 390 / 1440 | 45/28 · 47/30 | 43 · 42 | 4 · 3 | 146 · 173 |
| Game not in library | 390 / 1440 | 19/18 · 21/21 | 18 · 17 | 3 · 2 | 54 · 75 |
| Journal | 390 / 1440 | 38/17 · 42/25 | 26 · 28 | 4 | 352 · 388 |
| Own profile | 390 / 1440 | 29/21 · 32/25 | 27 · 28 | 3 | 129 · 137 |
| Steam games | 390 / 1440 | 69/20 · 72/29 | 69 · 71 | 3 | 424 · 432 |
| Log sheet picker | 390 / 1440 | 32/19 · 32/27 | 32 | 1 | 133 |
| Playthrough form | 390 / 1440 | 14/12 · 14/14 (11 fields) | 13 | 6 | 29 |
| Edit details form | both | 10/10 | 10 | 7 | 41 |

Not measured: onboarding checklist and `/profile/setup` (U1), note / compose / edit pages and followers lists (U2, U3), desktop list view (N2), private profile (no private account).

Screenshots (local, not committed): `/private/tmp/claude-501/-Users-nailbadiullin-Developer-personal-play-later-v2/db969af1-3a9e-49e5-b0ab-cbeb328c578f/scratchpad/ui-audit/inventory/`.
