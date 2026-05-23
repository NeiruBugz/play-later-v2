# Visual Parity Audit — Library, Game Detail, Profile (2026-05-18)

> Compares canonical Next.js app (`http://localhost:7070`) against TanStack
> rewrite (`http://localhost:6060`). Same authed account on both. Captures
> are taken at desktop 1440×900 and mobile 375×812.
>
> Goal: feed Slice 18A ("Visual parity") of spec 021 with actionable, file-pathed tasks.

## Methodology

- Routes compared: `/library`, `/games/<slug>`, `/profile`
- Two browser tabs per route — one canonical, one tanstack — resized in sync.
- For each route: desktop screenshot pair → mobile screenshot pair → accessibility-tree spot-check.
- Findings recorded inline below as they surface. Each finding tagged with severity (HIGH/MED/LOW) and a suggested fix location in `savepoint-tanstack/src/`.

## Findings

### Library — `/library`

#### Desktop 1440×900

Side-by-side: canonical 7070 vs tanstack 6060, same authed account, 3 games in library.

**Page-level**
- **[HIGH] Missing filter / search input.** Canonical renders a prominent "Filter library…" textbox with `/` keyboard hint above the card grid. TanStack: not rendered. *Fix:* add filter input to `savepoint-tanstack/src/widgets/library-page/` (or its toolbar sub-component) wired to client-side filter state.
- **[HIGH] Add-game affordance differs.** Canonical: floating red circular FAB with pencil icon, bottom-right corner. TanStack: top-right rectangular `Add game` button. *Fix:* either move tanstack's `Add game` button into a FAB component, or accept divergence and log it in DIVERGENCES.md. Confirm with product intent before changing.
- **[MED] Header subtitle.** Canonical: just "Library" h1. TanStack: "Library 3 games" with inline count. *Fix:* either remove `3 games` from `widgets/library-page` header or add equivalent count chip to canonical. Pick a side.

**Status filter list (left sidebar of the page, not the global nav)**
- **[HIGH] Missing per-status counts.** Canonical renders right-aligned count next to every status (`All 3`, `Up Next 0`, `Playing 2`, etc.). TanStack: no counts. *Fix:* `widgets/library-page` status-filter component should compute and render counts from the entries prop.
- **[HIGH] Active-state palette differs.** Canonical: muted gray for zero-count items, red tint only on currently-active filter ("Playing"). TanStack: every status has a saturated brand color (amber/red/olive/green/blue). *Fix:* align tanstack's status-filter color tokens to canonical's "active vs idle" two-tone model.

**Card body (`entities/library-item-card` / canonical equivalent)**
- **[HIGH] Card meta-footer is missing.** Canonical shows: platform badge (`PlayStation 5`), added/started date, 5-star empty rating, CTA button (`Queue It` / `Log Session`). TanStack shows only the title. *Fix:* expand `savepoint-tanstack/src/widgets/library-item-card/` to render the same four pieces. Each maps to existing fields on `LibraryItem`.
- **[MED] Status-badge styling.** Canonical: rounded pill with dot indicator (`• Shelf`). TanStack: rectangular all-caps tag (`SHELF`). *Fix:* `widgets/library-item-card/` status-badge sub-component — switch to canonical's pill shape + sentence case + leading dot.
- **[LOW] Card cover aspect.** Possible minor ratio drift from missing footer content squashing the cover. Re-verify after meta-footer lands.

**Global chrome (left nav + footer)**
- **[MED] User identity in footer.** Canonical: initial-avatar + display name (`N NeiruBugzDev`). TanStack: stock avatar image + email (`developer123@savepoint…`). *Fix:* `widgets/app-shell` footer component — show display name, not email; use initial-avatar generator.
- **[LOW] "Auto" pill bottom-left (tanstack only).** Looks like a dev/theme toggle. *Fix:* hide in non-dev mode, or align with canonical (canonical has no equivalent on this route).
- **[INFO] TanStack Devtools ribbon bottom-right.** Dev-only, ignore for parity.

#### Mobile 375×812
_pending capture_

#### Mobile 375×812

Canonical resized to 375 cleanly. TanStack tab is in a separate Chrome window with a minimum-width constraint that the resize tool can't override (returns success but window stays at 1568px). Treat the tanstack-mobile capture as a manual TODO — see "Open items" at end of doc. Findings below are based on the canonical-only mobile capture; structural deltas for tanstack mobile should mirror desktop findings since the same widget tree is rendered.

Canonical mobile-only observations (to confirm tanstack matches):
- **[MED] Bottom tab nav appears on mobile.** Canonical shows a three-tab bottom nav (`Library` / `Journal` / `Profile`) with avatar slot. TanStack desktop has a left sidebar only — needs verification that tanstack collapses to the same bottom nav at mobile breakpoint. *Fix location:* `savepoint-tanstack/src/widgets/app-shell/` mobile responsive variant.
- **[MED] Top nav becomes minimal on mobile.** Canonical mobile: SavePoint logo left, search icon + theme/desktop toggle icons right. Sidebar replaced with hamburger affordances. *Fix:* same widget as above.
- **[MED] Filter input is full-width on mobile.** Canonical: `Filter library…` becomes a full-width input on mobile; a separate `Filters` button gates the status/platform/sort controls into a drawer. *Fix:* `widgets/library-page` mobile layout — collapse the status/platform/sort sidebar into a `Filters` drawer behind a button.
- **[MED] Cards become horizontal rows.** Canonical mobile: cards re-arrange to small-cover-left + meta-right horizontal rows (instead of vertical grid cards). *Fix:* `widgets/library-item-card` needs a mobile variant or responsive flex direction.

### Game Detail — `/games/<slug>` (using `balatro`)

#### Desktop 1440×900

Most divergent route in the audit. Tanstack appears to be a minimal stub of the canonical experience.

**Hero / above-the-fold**
- **[HIGH] Hero screenshot background absent.** Canonical: full-bleed in-game screenshot bleeds behind cover + title (signature visual). TanStack: plain white. *Fix:* `savepoint-tanstack/src/widgets/game-detail/` — add hero background image driven by `game.screenshots[0]` (or IGDB equivalent field already on the entity).
- **[HIGH] Metadata row above title is truncated.** Canonical: `2024 · LOCALTHUNK · STRATEGY · TURN-BASED STRATEGY (TBS)` — year + developer + primary genres. TanStack: only `2024`. *Fix:* `widgets/game-detail` header sub-component — render developer + primary genres alongside year.
- **[HIGH] Status switcher reduced to a single button.** Canonical: inline row of 5 status pills (Up Next / Playing / Shelf / Played / Wishlist) with current state highlighted, plus empty 5-star rating, plus `...` overflow trigger — all directly below the title. TanStack: single `Manage in library` button (presumably opens a modal — confirms by accessibility tree). *Fix:* either replace `Manage in library` button with the inline pill row (preferred — matches canonical interaction model) or accept divergence and log it. Confirm with product intent first.
- **[HIGH] Rating widget missing.** Canonical: 5-star rating selector inline. TanStack: not rendered. *Fix:* same widget; surface a rating control. The `LibraryItem` entity already has a `rating` field per Slice 14.
- **[MED] Platform shown twice in tanstack, none in canonical above-fold.** TanStack: `PLAYING` badge + `Nintendo Switch 2` tag inline (looks like duplicate platform info). Canonical surfaces platform deeper, not in hero. *Fix:* remove the duplicated platform tag from the tanstack hero — leave platform context in the manage-in-library flow.
- **[MED] Breadcrumb depth differs.** Canonical: `Library / Games / Balatro`. TanStack: `Library / Balatro`. *Fix:* `widgets/game-detail` breadcrumb — add a `Games` mid-segment.

**Tab bar**
- **[HIGH] Tabs disagree on labels and count.** Canonical: `Overview / Journal {count} / Playtime` (3 tabs, journal shows count badge). TanStack: `Overview / Journal / Related / Times to beat` (4 tabs, no journal count). *Fix:* `widgets/game-detail` tab definitions — collapse "Times to beat" content into "Playtime" or rename to match canonical; either fold "Related" into Overview or accept divergence (depends on canonical product intent — defer to spec).

**Overview body content**
- **[HIGH] Description paragraph missing in tanstack.** Canonical body renders the IGDB summary as a paragraph. TanStack: no description on overview. *Fix:* `widgets/game-detail` overview sub-component — render `game.summary`.
- **[HIGH] Terminal-style metadata labels missing.** Canonical signature look: `// GAME.DETAIL`, `// GENRES`, `// PLATFORMS` as left-aligned terminal-comment labels with content to the right. TanStack: no equivalent. *Fix:* `widgets/game-detail` body — adopt the `//` prefix label component from canonical (likely already in `shared/ui` or needs porting).
- **[HIGH] Genres + Platforms chip rows missing.** Canonical: chip lists for genres (`Strategy`, `Turn-based strategy (TBS)`, `Indie`, `Card & Board Game`) and platforms (`+6` overflow). TanStack: not rendered on overview. *Fix:* same widget as above.
- **[MED] Right-rail "BALATRO" stencil watermark.** Canonical has a right-aligned uppercase title watermark (`BALATRO`) as a visual flourish next to the genre/platforms rows. TanStack: no equivalent. *Fix:* `widgets/game-detail` body — port the watermark component (low priority, decorative).

#### Mobile 375×812
_skipped — same window-pin issue as library mobile. Verify manually after desktop fixes land._

### Profile — `/profile`

#### Desktop 1440×900
_pending capture_

#### Mobile 375×812
_pending capture_

### Profile — `/profile`

#### Desktop 1440×900

**Routing**
- **[HIGH] `/profile` resolves to different surfaces.** Canonical `/profile` server-redirects to `/u/<username>` (the public profile view — same URL a follower would see). TanStack `/profile` is a dedicated private "your profile" page with `Change avatar` overlay. *Fix:* either (a) make tanstack's `/profile` redirect to `/u/$username` and render the same component as the public view, or (b) accept divergence and log it. (a) is the canonical model; (b) would need a `/u/$username` route implemented first — see Slice 18 in spec 021. *File:* `savepoint-tanstack/src/routes/_authed/profile.tsx`.

**Hero**
- **[HIGH] Hero banner missing.** Canonical: full-width gradient maroon→sienna banner ~120px tall with avatar overlapping at the left. TanStack: no banner; avatar sits inline at top-left. *Fix:* `savepoint-tanstack/src/widgets/profile-page/` (or whatever the profile widget is named) — add a hero band; use canonical's color stops as the design token.
- **[MED] Avatar size/position differs.** Canonical: avatar is large (~140px), positioned overlapping the hero from the left. TanStack: smaller (~80px), no overlap. *Fix:* same widget.
- **[INFO] Canonical shows a broken avatar image in this capture.** Empty rounded square — the user has no avatar set. TanStack shows a stock cartoon image. This is data-driven, not a parity bug; but worth confirming tanstack falls back to "broken square" + initial when the user clears the avatar.

**Identity block**
- **[HIGH] Followers / Following row missing.** Canonical: `0 Followers · 1 Following` (clickable links to follower lists). TanStack: not rendered. *Fix:* add a follower/following count row to the profile widget. The data hookup may be Slice 18 (social) territory — if that slice isn't complete, log as deferred.
- **[LOW] Button case: `Edit Profile` (canonical) vs `Edit profile` (tanstack).** Cosmetic copy fix in `widgets/profile-page` Edit-profile button.

**Sub-tabs**
- **[HIGH] Profile sub-tabs missing entirely.** Canonical: `Overview / Library / Activity` tab strip under the identity block. TanStack: no tabs. The single "overview" content is rendered without navigation. *Fix:* same widget — port the tab strip. Likely defer to Slice 18 if `Library` and `Activity` sub-routes aren't yet wired.

**Stats cards**
- **[MED] Stat-card visual style differs.** Canonical: card with icon (book/gamepad/trophy/journal) above the number. TanStack: minimal — number + label only, no icon, lighter card. *Fix:* `widgets/profile-page` stat cards — add icon slot and align to canonical's card padding/border.

**Recently Played**
- **[MED] Card size + overlay text differ.** Canonical: smaller cards with title + relative-time (`11 days ago`) overlaid at the bottom of the cover image. TanStack: larger cards with plain title below the cover, no time-since. *Fix:* `widgets/profile-page` recently-played section — port the smaller-card-with-overlay shape and the relative-time string.

#### Mobile 375×812
_skipped — same window-pin issue. Verify manually after desktop fixes._

## Intentional divergences (excluded from parity work)

Cross-referencing `savepoint-tanstack/DIVERGENCES.md`:
- _LibraryItemCard widget move (post-Slice 14A) — affects file location but not visual surface._
- _Compose journal entry CTA wiring (Slice 16) — game-detail teaser → compose dialog. Tanstack adds this; canonical may not have the same teaser-as-entry-point._
- _Slice 17 (⌘K command palette) is NOT yet implemented in tanstack. The `Search ⌘K` chip in the left nav is non-functional decoration — exclude from parity findings until Slice 17 lands._
- _Slice 18 (settings/social/onboarding) — followers/following row, profile sub-tabs, public profile route may all map to this slice rather than Slice 18A pure-visual work._

If a finding above corresponds to an unimplemented slice, prefer noting it as a Slice 18 task rather than Slice 18A.

## Open items (manual follow-up)

- **Mobile parity for tanstack:** the chrome-mcp `resize_window` tool reports success but doesn't shrink the tanstack window below ~1568px (likely DevTools open or window-pin in the underlying Chrome window). Re-run mobile captures manually after closing DevTools on the tanstack window, or use Chrome DevTools device toolbar (⌘⇧M) and reload.
- **Visual regression coverage:** none of these widgets has a visual-regression test today. Slice 18A is a good moment to add `@playwright/test` screenshot snapshots for `/library`, `/games/$slug`, `/profile` at both viewports so the gap doesn't reopen.

## Recommended tasks for Slice 18A

Distilled to actionable, file-pathed checkboxes ready to paste into `context/spec/021-migrate-to-tanstack-start/tasks.md` under Slice 18A.

### Library (`savepoint-tanstack/src/widgets/library-page/` + `widgets/library-item-card/`)

- [ ] Render filter-by-title text input above the card grid (with `/` keyboard hint).
- [ ] Replace top-right `Add game` button with a floating action button (FAB) bottom-right (pencil icon, red circle).
- [ ] Decide on header subtitle: drop `3 games` count OR add equivalent count chip to canonical.
- [ ] Render right-aligned per-status counts on every status filter row.
- [ ] Align status-filter color palette to canonical's two-tone (muted idle / red active).
- [ ] On each library-item card, add: platform badge, added/started date, 5-star rating, contextual CTA (`Queue It` / `Log Session`).
- [ ] Restyle status badge as rounded pill with dot indicator + sentence case (was rectangular uppercase tag).
- [ ] In app-shell footer, show display name (not email) with initial-avatar fallback.
- [ ] Hide or align the bottom-left `Auto` chip (currently tanstack-only on this route).

### Game Detail (`savepoint-tanstack/src/widgets/game-detail/`)

- [ ] Add full-bleed hero screenshot background (driven by `game.screenshots[0]` or IGDB equivalent).
- [ ] Expand metadata row above title to include developer + primary genres (`2024 · LOCALTHUNK · STRATEGY · TBS`).
- [ ] Replace `Manage in library` button with inline row of 5 status pills (Up Next / Playing / Shelf / Played / Wishlist) + rating widget + overflow `...` menu.
- [ ] Surface 5-star rating selector inline below status pills.
- [ ] Remove duplicated platform tag from the hero (leave platform context inside the status flow).
- [ ] Expand breadcrumb to `Library / Games / <title>` (add `Games` mid-segment).
- [ ] Align tab labels and count to canonical: `Overview / Journal {count} / Playtime` (collapse `Times to beat` into `Playtime`; fold `Related` into Overview or defer to spec).
- [ ] Render IGDB summary paragraph on Overview tab.
- [ ] Adopt terminal-style metadata labels (`// GAME.DETAIL`, `// GENRES`, `// PLATFORMS`) on Overview body.
- [ ] Render genre chips and platforms (`+N` overflow) chip row on Overview.
- [ ] (Optional / decorative) Port the right-aligned uppercase title watermark.

### Profile (`savepoint-tanstack/src/widgets/profile-page/` + `src/routes/_authed/profile.tsx`)

- [ ] Either redirect `/profile` to `/u/$username` OR document the divergence in DIVERGENCES.md.
- [ ] Add gradient hero banner across the top of the profile page; overlap the avatar from the left.
- [ ] Resize avatar to match canonical (~140px, overlapping hero).
- [ ] Render followers / following counts row below identity (defer to Slice 18 social work if data layer not ready).
- [ ] Fix button casing: `Edit profile` → `Edit Profile`.
- [ ] Add profile sub-tabs (`Overview / Library / Activity`) — defer to Slice 18 if Library / Activity sub-routes aren't ready.
- [ ] Add icon slot to each stat card (book / gamepad / trophy / journal).
- [ ] On `Recently Played`, switch to smaller cards with title + relative-time overlay at the bottom of the cover image.

### Cross-cutting

- [ ] Implement a responsive mobile shell: collapse left sidebar into a bottom tab nav (`Library / Journal / Profile`) at mobile breakpoint, with a top minimal nav (logo + search/theme icons).
- [ ] Library page mobile: collapse status/platform/sort sidebar into a `Filters` drawer behind a button.
- [ ] Library item cards: add a mobile variant (small-cover-left + meta-right horizontal row).
- [ ] (Tooling) Add `@playwright/test` screenshot regression coverage for `/library`, `/games/$slug`, `/profile` at desktop + mobile.
