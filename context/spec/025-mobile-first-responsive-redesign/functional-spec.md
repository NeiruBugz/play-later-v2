# Functional Specification: Mobile-First Responsive Redesign

- **Roadmap Item:** UX/PWA quality pass — a mobile-first redesign of SavePoint's core surfaces, scaled additively to desktop (follows the prior UX Audit work, Specs 012 & 014).
- **Status:** Completed
- **Author:** Nail Badiullin

> **Verification (2026-06-18):** All 11 slices complete; acceptance criteria across the 8 surfaces verified against the implementation. Gates green — typecheck, lint, format:check, `test:unit` (1721), `test:integration` (661), build. Independent adversarial `/code-review` over the full branch (`main...HEAD` + working tree) surfaced **no correctness or acceptance-criterion blockers** (the one "React array render crash" candidate was refuted — arrays of keyed elements are valid children). The live responsive visual pass across Light/Dark/System at phone + desktop remains **deferred to the author** (needs an authenticated running app; no IGDB/Twitch session in the sandbox — same posture as specs 016/023). Non-blocking follow-up noted: the `StatusLens` keeps `role="tablist"/"tab"` ARIA but lacks arrow-key roving — operable via Tab+Enter, but the ARIA tab idiom expects arrows.

---

## 1. Overview and Rationale (The "Why")

SavePoint can now be installed and used as a standalone app on a phone. That changes what the phone is: no longer a courtesy "shrunk-down" view of the desktop site, but a first-class home for someone's game library — held one-handed, on the couch, after a play session. A walkthrough of every core screen at phone width found that the small-screen experience was mostly the desktop layout compressed, not rethought, and that the single thing the app exists for — quickly logging tonight's session — has no reliable home on a phone.

This redesign fixes that. It re-thinks each core screen for the thumb first, then scales those same decisions back up to desktop so the two never feel like different products. The work is grounded in a documented review of the current screens that surfaced **19 issues across 8 surfaces (2 blocking, 6 high-friction, and 11 smaller rough edges)**, summarized below and preserved in full in this spec's `design-reference/` folder.

**The problems we are solving (what a player hits today):**

1. **You can't get back home.** After the player taps into Library or Journal, there is no way back to the Dashboard (the screen they land on after signing in) from the on-screen navigation. In an installed app there is no browser back button to rescue them.
2. **The core action disappears.** "Log a session" only exists deep inside a single game's page, and "Add a game" only exists on the Library screen. From most screens, capturing a session takes three or four taps.
3. **Browsing feels endless.** The library shows one big game per row on a phone, so a 30-game collection feels like an infinite scroll instead of a glanceable shelf.
4. **The main action scrolls away.** On a game's page — the longest scroll in the app — the buttons to change status or log a session sit at the very top and never come back once the player scrolls down to read.
5. **Reflecting fights the keyboard.** Writing a journal entry happens in a small centered box that the on-screen keyboard covers — the opposite of an inviting place to reflect.
6. **Small, easy-to-miss controls.** Several tap targets are below the comfortable minimum size, and the active navigation tab is signalled by color alone.

**The desired outcome:** every core task is reachable with a thumb, the library reads as a shelf, dense pages stay navigable, and logging/reflecting happen in calm full-width sheets — on both phone and desktop.

**Design principles guiding every screen (the redesign's north star):**

1. **The thumb owns the bottom third.** Primary navigation and the core "Log" action live in the bottom of the screen, reachable one-handed. Nothing essential hides at the top of a long scroll.
2. **Cover art is the interface.** The library is a shelf, at least two covers wide.
3. **Dense screens get a spine.** Long pages (game detail, profile) always offer a quick way to jump between sections.
4. **Sheets, not centered boxes.** Logging and reflecting happen in bottom sheets that rise with the keyboard.
5. **Cozy is a constraint.** Warm surfaces, generous spacing, comfortable tap targets — the phone build feels as unhurried as the desktop.

**How we measure success:** every core task (return home, log a session, add a game, change a game's status, browse the library, write a reflection) is reachable in one or two taps from any core screen on a phone; the library shows at least two games per row on a phone; the game's page keeps its primary action visible while scrolling; and the same screens, widened to desktop, present additional columns and a side rail rather than a different layout.

**Theme note:** This redesign does **not** change the player's theme. It must look correct in the existing Light, Dark, and System options (from the Unified Design System work, Spec 022). The default theme remains whatever the player already has set.

---

## 2. Functional Requirements (The "What")

Requirements are grouped by surface. Each surface describes the **phone** behavior first, then how it **scales up to a wider screen**. "Wide screen" means a desktop/laptop browser; "phone" means a narrow, one-column screen. The switch between the two happens at a single consistent width across the whole app (today the navigation and the filters switch at different widths, which creates a broken in-between state — see GLOBAL-3).

### 2.1 Global Navigation

**Phone — bottom tab bar.** A bar fixed to the bottom of the screen with five slots, left to right:

- **Home** (returns to the Dashboard)
- **Library**
- **Log** — a visually raised, center action that opens the "Log a session" sheet from anywhere
- **Journal**
- **Profile**

The four destination tabs show an icon with a text label beneath it. The center **Log** action is styled distinctly (raised, accent-colored) so it reads as an action, not a destination. The currently-active tab is indicated by **both** a filled/accented icon and its label — never color alone.

**Phone — top bar.** A slim top bar carries the screen's identity (logo and/or title) on the left and up to two quick actions on the right (e.g. Search, Profile/avatar). All tappable controls in the top bar and bottom bar meet a comfortable minimum touch size (at least ~44px), even when the icon inside is smaller.

**Search.** Tapping Search opens a search experience as an overlay/sheet (not a cold full-page navigation), where the player can look up a game to add.

**Wide screen.** The bottom tab bar is replaced by a **persistent left sidebar** containing: the brand, a prominent **"Log a session"** button pinned directly under the brand (the desktop home for the same core verb), a search field (with a keyboard-shortcut hint), the navigation destinations (Home, Library, Journal), a status legend with live counts that filters the library when clicked, and a footer with the player's identity plus a Settings entry. The sidebar can be collapsed to a narrow icon-only rail and expanded again; collapsed, the Log action becomes a single icon button.

- **AC GLOBAL-1 (Home is reachable):** Given the player has navigated to Library, Journal, or Profile on a phone, when they look at the bottom bar, then a **Home** tab is present and tapping it returns to the Dashboard.
- **AC GLOBAL-2 (Log is always reachable):** Given the player is on any core screen on a phone (Dashboard, Library, Journal, Profile, or a game's page), when they tap the center **Log** action, then the "Log a session" sheet opens.
- **AC GLOBAL-3 (Single switch point):** Given the player slowly widens the browser from phone width to desktop width, when they pass the switch width, then the bottom bar, the navigation, and the library's filter controls **all** change to their wide-screen form at the same width (no in-between state with desktop chrome but phone filters, or vice-versa).
- **AC GLOBAL-4 (Active tab is unmistakable):** Given the player is on the Library tab, when they look at the bottom bar, then the Library tab shows a filled/accented icon and label distinct from the inactive tabs, distinguishable without relying on color alone.
- **AC GLOBAL-5 (Comfortable targets):** Given the player taps any icon button in the top or bottom bar, then the tappable area is at least ~44px in each dimension.
- **AC GLOBAL-6 (Desktop Log CTA):** Given the player is on a wide screen, when they look at the left sidebar, then a prominent "Log a session" button sits directly under the brand and opens the log flow from any screen; when the sidebar is collapsed, that action remains present as an icon button.

### 2.2 Dashboard ("Jump back in")

The Dashboard is the post-sign-in home and the destination of the Home tab. Today, on a phone, every section stacks at equal weight so the most-wanted action (continue a game in progress) competes with stats and other rails.

**Phone.** The screen leads with a personal greeting (e.g. "Good evening, Alex") and a date eyebrow, then a **"Jump back in"** card featuring the game most in-progress — its cover, status, a session/playtime line, a progress bar, and a one-tap **Log session** button. Below that, a single compact strip of library status counts (Playing / Up Next / Shelf / Played / Wishlist). Below that, the game rails (**Playing**, **Up next**, **Recently played**) are **horizontal swipe carousels** rather than tall stacked grids, each with an "All" link. Tapping any cover opens that game's page.

**Wide screen.** The greeting becomes a page header (with an "Add a game" action). The "Jump back in" hero pairs with a "Continue" rail beside it; a "Library breakdown" card (total count + a status distribution bar + legend) sits next to a "Last reflection" card; and the rails below render as multi-column cover grids.

- **AC DASH-1 (Continue is first):** Given the player has at least one in-progress game, when they open the Dashboard on a phone, then a "Jump back in" card for that game appears above the stats and rails, with a one-tap "Log session" button.
- **AC DASH-2 (Rails swipe):** Given the Dashboard has a "Playing" rail with several games on a phone, when the player swipes the rail horizontally, then more covers scroll into view without growing the page's vertical length.
- **AC DASH-3 (Stats are condensed):** Given the player opens the Dashboard on a phone, then the status counts appear as a single compact horizontal strip, not as full-height stacked cards.
- **AC DASH-4 (Desktop spreads out):** Given the player opens the Dashboard on a wide screen, then the "Jump back in" hero and a "Continue" list appear side by side, and the rails render as multi-column cover grids.

### 2.3 Library

The library is the marquee browsing surface. Today it shows one game per row on a phone, and the primary lens (status) is buried inside a filter sheet.

**Phone.** Above the grid sits a **sticky, horizontally-scrollable status row** — segmented chips for All / Playing / Up Next / Shelf / Played / Wishlist, each with a count — that stays in place as the player scrolls and switches the library's lens in one tap. Beneath it, a row with a **Filters** button (opening a sheet for secondary filters like platform, rating, and sort, showing a count of active filters) and a **grid/list** view toggle. The default view is a **two-up cover grid** (comfortable density); each cover shows a small status marker, the title, platform, and rating. A list view offers a metadata-forward alternative (cover thumbnail, title, developer/year, rating, status, platform).

**Wide screen.** The same status lens and filter/view controls sit in a sticky bar; the grid widens to roughly five (or seven, at compact density) covers per row. The list view shows fuller rows.

- **AC LIB-1 (Two-up shelf):** Given the player opens the Library on a phone in the default view, then games are shown at least two covers per row.
- **AC LIB-2 (One-tap status lens):** Given the player is on the Library on a phone, when they tap a status chip (e.g. "Up next") in the sticky row, then the grid immediately filters to that status without opening a sheet.
- **AC LIB-3 (Sticky lens):** Given the player scrolls down the Library on a phone, then the status chip row remains pinned and usable.
- **AC LIB-4 (Secondary filters in a sheet):** Given the player taps "Filters" on a phone, then a sheet opens with platform, rating, and sort controls, and the Filters button reflects how many filters are active.
- **AC LIB-5 (View toggle):** Given the player taps the list-view control, then the library switches from cover grid to metadata rows; tapping grid returns to covers.
- **AC LIB-6 (Desktop widens, doesn't rethink):** Given the player views the Library on a wide screen, then the same status lens and controls appear and the cover grid shows roughly five-or-more covers per row.

### 2.4 Game Detail

A game's page is the densest screen in the app. Today, on a phone, all its panels collapse into one tall ribbon, the primary action sits only at the top, and the title crowds the critic score.

**Phone.**
- A slim translucent top bar over the artwork backdrop carries a **Back** control (left) and a **More** menu (right). There is no breadcrumb row.
- The hero **stacks vertically**: the artwork backdrop, then the cover with the critic score beside/below it, then a metadata eyebrow (year · developer · genre) and the title. The title no longer competes with the score on one cramped row.
- A horizontally-scrollable **status switcher** (Playing / Up Next / Shelf / Played / Wishlist) sits under the hero.
- A sticky **"jump spine"** — a thin row of section anchors (e.g. Playthroughs · Journal · About · Related) — lets the player jump within the page; it stays visible while scrolling.
- The panels follow in one column: Playthroughs, Journal, About, Genres & Platforms, Related games (Related is a swipe rail). Existing rich panels the app already has (screenshots, times-to-beat) remain.
- A **sticky action bar pinned to the bottom** (above the tab bar) always shows the current status pill and a **"Log session"** button, so the primary action is reachable no matter how far the player has scrolled.

**Wide screen.** The page uses the width as a two-column split: a scrolling content column (with the same jump spine, sticky at the top) beside a **sticky right rail** carrying the status switcher, the "Log a session" button, the critic-score ring, and a "Your time" summary (total played, sessions, progress, last session). The bottom action bar is not needed because the rail keeps the action permanently in view.

- **AC GD-1 (Action never lost):** Given the player scrolls to the bottom of a game's page on a phone, then a pinned bottom action bar still shows the status pill and a working "Log session" button.
- **AC GD-2 (Navigable spine):** Given a game's page has multiple sections on a phone, when the player taps a section name in the sticky jump spine, then the page moves to that section, and the spine remains visible while scrolling.
- **AC GD-3 (Hero stacks):** Given the player opens a game's page on a phone, then the cover, critic score, and title are arranged so the title has its own line and does not visually collide with the score.
- **AC GD-4 (No breadcrumb on phone):** Given the player is on a game's page on a phone, then the top bar provides a single Back affordance and no "Library / Games / Title" breadcrumb row consumes vertical space.
- **AC GD-5 (Desktop rail):** Given the player views a game's page on a wide screen, then a sticky right rail keeps the status switcher, the "Log a session" button, and the critic score visible as the content column scrolls.

### 2.5 Journal

The journal timeline reads well already; the friction is in writing an entry.

**Phone.** The timeline stays a chronological list of entries, each with the game's cover thumbnail on a connecting timeline rail, the game title, date, an excerpt, and playtime/session metadata; tapping an entry opens that game's page. Composing a new reflection happens in a **full-height bottom sheet** (not a centered box) that grows with the on-screen keyboard, with the writing area as the hero and guidance inline that **"playtime alone is a complete log — thoughts are optional."**

**Wide screen.** The timeline pairs with a stats rail ("this month": entries, hours reflected, games journaled) and a "Log tonight" prompt card.

- **AC JRN-1 (Compose is a sheet):** Given the player starts a new reflection on a phone, then it opens as a full-height bottom sheet anchored to the bottom of the screen, with the text area as the largest element.
- **AC JRN-2 (Keyboard doesn't bury it):** Given the on-screen keyboard is open while composing on a phone, then the writing area remains visible above the keyboard rather than being covered.
- **AC JRN-3 (Optional thoughts):** Given the player opens the compose sheet, then copy makes clear that recording playtime alone is a complete entry and written thoughts are optional.
- **AC JRN-4 (Desktop stats rail):** Given the player opens the Journal on a wide screen, then the timeline appears beside a stats rail summarizing recent journaling.

### 2.6 Profile & Settings

Both screens currently lean on side-by-side desktop layouts that merely stack on a phone.

**Profile — phone.** A compact header: a banner, avatar, name and handle, a single row of stat counts (in library / played / sessions / entries), and a full-width primary action (e.g. "Edit profile" or "Follow"). Below the header, a **sticky tab strip** (Overview / Library / Activity) sits above the content so the actual content (the player's games or activity) starts high on the screen rather than below the fold.

**Settings — phone.** An **iOS-style grouped list** (Appearance, Library, Account, etc.) where each row is a full-height tappable item that either toggles a setting inline or pushes into a detail screen, replacing the stacked side-rail-above-content layout. A profile summary row sits at the top; a sign-out row and a small version footer sit at the bottom.

**Wide screen.** Profile keeps its header with content beneath; Settings uses a two-column layout (a category list beside the active panel).

- **AC PRO-1 (Content starts high):** Given the player opens their Profile on a phone, then the header is compact and a sticky tab strip sits directly above the content, so the first row of games/activity is visible without long scrolling.
- **AC PRO-2 (Full-width primary action):** Given the player views a Profile on a phone, then the primary action (Edit profile or Follow) is a full-width button below the identity block, not squeezed into the name row.
- **AC SET-1 (Grouped list):** Given the player opens Settings on a phone, then options appear as grouped, full-height tappable rows (with inline toggles where appropriate), not as a navigation rail stacked above a form.
- **AC SET-2 (Desktop two-column settings):** Given the player opens Settings on a wide screen, then a category list appears beside the selected settings panel.

### 2.7 Core Flows: Log a Session & Add a Game

These are the two actions promoted into global reach by the navigation changes.

**Log a session — phone.** A bottom sheet titled "Log a session" containing: the game (and playthrough, where applicable) being logged with a way to change it; a playtime stepper (with quick +/- and a clear large value); a "when" choice (Today / Yesterday / Pick date); and an optional reflection field with the "playtime alone is a complete log" guidance. A primary "Save session" action sits at the bottom of the sheet.

**Add a game — phone.** A bottom sheet with a search field and a list of matching games (cover, title, developer/year) each with an "Add" control.

**Wide screen.** Both flows open as centered desktop modals with the equivalent fields and actions.

- **AC FLOW-1 (Log from anywhere):** Given the player triggers Log from the bottom nav, the Dashboard hero, the dashboard "Continue" list, a game's page, or the desktop sidebar, then the same "Log a session" experience opens, pre-targeted to a sensible game/playthrough where context implies one.
- **AC FLOW-2 (Playtime-only log):** Given the player opens the Log sheet and sets only a playtime and a date, when they save, then the session is recorded without requiring any written reflection.
- **AC FLOW-3 (Add game search):** Given the player opens "Add a game," when they type a title, then matching games appear as rows each with an "Add" control.
- **AC FLOW-4 (Sheet on phone, modal on desktop):** Given the player triggers Log or Add, then on a phone it appears as a bottom sheet and on a wide screen as a centered modal, with the same fields.

### 2.8 Cross-Cutting Behaviors

- **AC X-1 (Consistent theming):** Given the player has Light, Dark, or System selected, then every redesigned screen renders correctly in that theme using the established design-system colors and type — no screen is hardcoded to one theme.
- **AC X-2 (Display preferences):** Given the player can adjust display options, then bottom-nav labels are shown by default and the library/cover density defaults to comfortable (two-up on phones), with density remaining adjustable.
- **AC X-3 (Reduced motion respected):** Given the player has "reduce motion" enabled in their device settings, then sheet/drawer entrance animations are minimized or removed while the screens remain fully usable.
- **AC X-4 (Same product, two widths):** Given any redesigned core screen, when compared between phone and wide-screen widths, then the wide-screen version presents the same information and actions with more columns and/or a side rail — never a different navigation model or a removed action.

---

## 3. Scope and Boundaries

### In-Scope

- A mobile-first redesign, scaled additively to desktop, of these eight surfaces: **Global navigation, Dashboard, Library, Game detail, Journal, Profile, Settings,** and the **Log-session / Add-game / Compose-reflection** flows.
- The new mobile bottom navigation model (Home · Library · **Log** · Journal · Profile) and the desktop sidebar with a pinned "Log a session" action.
- A single, consistent phone↔desktop switch width across navigation and filters.
- The sticky status lens on Library, the sticky bottom action bar + jump spine on Game detail, the swipe rails on the Dashboard, the grouped Settings list, the compact Profile header, and the sheet-based core flows.
- Comfortable touch targets, an active-tab indicator that isn't color-only, and respect for reduced-motion and the existing Light/Dark/System theme.
- Verifying the redesigned surfaces look and behave correctly across Light, Dark, and System.

### Out-of-Scope

- **New product capabilities.** This is a layout/interaction redesign of existing screens; it does not add new features, data, or screens beyond rearranging and surfacing what already exists.
- **Per-Playthrough Logs behavior (Spec 016)** — already shipped; this redesign only re-presents the existing playthrough panel and run-aware journal within the new layouts, without changing how playthroughs or status derivation work.
- **Reviews (Spec 024 / roadmap #2), Public Reflections (#3), Game Detail Redesign community layer (#4), Aggregate Game Stats (#5)** — the community layer is a separate effort; this spec covers only the personal/catalog layout of the game page.
- **Bento Dashboard Reflow (#6) and the discovery features** (Upcoming Releases, YTD Stats, Pick Up Where You Left Off, Gaming Events Calendar, Similar Games, Browse/Catalog, Curated Collections) — separate roadmap items.
- **First-Time User Onboarding (Spec 013)** — unchanged by this work.
- **Installable-app packaging itself** (the underlying PWA install/offline mechanics) — this spec assumes the app is installable and focuses on the on-screen experience, not the install plumbing.
- **The "Final Fantasy / Crystal" game-themed exploration and the "New Feature Concepts" survey** from the same design project — exploratory, not part of this redesign.
- **Changing the default theme** — the player's existing Light/Dark/System preference is preserved.

---

## Appendix: Design Reference

The original design handoff (audit + high-fidelity prototypes for both phone and desktop) is preserved under this spec's `design-reference/` folder:

- `Mobile Audit.html` — the full 19-finding audit this spec is grounded in (severity-rated, per surface).
- `mobile/` — the mobile mid-fi, hi-fi, and clickable prototypes and their components.
- `desktop/` — the desktop hi-fi clickable prototype and its components.
- `HANDOFF-README.md` — the original handoff instructions from the design tool.

These are **visual references** (standalone HTML/React prototypes), not production code. The build target is the existing `savepoint-tanstack` app, reusing its established components and design tokens — the technical approach is defined separately in `/awos:tech`.
