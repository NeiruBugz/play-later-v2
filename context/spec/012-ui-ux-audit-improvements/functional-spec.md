# Functional Specification: UI/UX Audit Improvements (High + Medium Priority)

- **Roadmap Item:** UI/UX Audit follow-through — implement the high- and medium-priority findings from the SavePoint UI/UX Audit (April 2026).
- **Status:** Completed
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

SavePoint's library, dashboard, and onboarding surfaces have grown organically. An external UI/UX audit (sourced from a Claude Design handoff bundle, see `chats/chat1.md` and `UI-UX-Audit.html`) identified 12 findings across visual design, navigation, information architecture, interactions, performance, and onboarding. The lowest-priority three are out of scope; this spec covers the remaining nine.

The user pain points the audit surfaces:

- **Patient gamers** with large backlogs cannot scan their library at a glance — status is encoded only as a 10px colored dot, filter chips have no counts, and metadata that would help triage (playtime, platform, dates) is absent from cards.
- **Mobile users** lose roughly half of the status filters behind invisible horizontal scroll.
- **New users** land on an empty dashboard with no onboarding path to first value.
- **All users** experience perceived slowness because filter/search interactions provide no loading feedback, and the dashboard "Quick Log" hero presents too many simultaneous choices.

Desired outcome: a measurable reduction in cognitive load and friction on the three highest-traffic surfaces (Library page, Dashboard hero, Empty/onboarding state) without removing any existing capability.

**Success measures**

- Mobile users can see all five library status filters without invisible horizontal scroll.
- Every status filter shows a numeric count (desktop sidebar; mobile bottom sheet).
- Status is conveyed by a text-bearing badge (not color alone) on every library card — passing WCAG 1.4.1.
- Empty-library users land on a screen with two explicit add-game CTAs (Steam import, search).
- Filter, sort, and search interactions on the Library page show a visible loading state immediately and never block input.
- Library card grid uses content-aware sizing (auto-fill `minmax(180px, 220px)` desktop) so cards never collapse below readable width on large displays.
- Every library card exposes a status-aware primary CTA without requiring hover, with a context menu (⋮) for secondary actions — closing the discoverability and mobile-parity gap.
- Mobile (≤640px) replaces the dense card grid with a horizontal list view for first-screen scannability.
- Adding a game from search results, the command palette, or the global navbar takes one click — no detail-page round-trip — and is undoable for ~5 seconds.
- Library items can have their platform changed after creation (no longer fixed at add-time).

---

## 2. Functional Requirements (The "What")

For each finding, the **Decision** line records the option chosen during scoping. Variants from the audit that were not chosen are not normative.

### 2.1 Library Filter Information Hierarchy (Finding #1, High)

**Decision:** Persistent left sidebar panel containing status filters, platform filter, and sort control. Search input stays inline at the top of the grid area. The sidebar collapses to an icon-only rail on viewports below 1280px. Sidebar collapse state persists for the session only (resets on full reload).

- **As a** library user, **I want** filters in a dedicated, persistent panel, **so that** I can see and change them without competing with my games for vertical space.
  - **Acceptance Criteria:**
    - [x] On viewports ≥ 1280px, a left sidebar (`≥ 240px` wide) is visible on the Library page and contains: status filters with counts (2.5), platform filter, sort control.
    - [x] On viewports between 768px and 1279px, the sidebar collapses to a narrow icon-only rail. A toggle expands it back to the full panel.
    - [x] On viewports ≤ 640px, the sidebar is not used; mobile rules in 2.2 apply.
    - [x] The search input is rendered above (or inline at the top of) the games grid, not inside the sidebar.
    - [x] Sidebar collapsed/expanded state persists across page navigations within the same browser tab/session and resets on full reload.
    - [x] Vertical space consumed by filter controls above the first row of game cards is reduced compared to the current inline layout.

### 2.2 Mobile Filter Layout (Finding #2, High)

**Decision:** Status filters render as a segmented control with text labels only (no counts) on viewports ≤ 640px. Platform filter and sort control move into a "Filters" bottom sheet, where status counts are also visible.

- **As a** mobile user, **I want to** see every status filter without horizontal scrolling, **so that** I do not miss filters like "Playing" or "Played".
  - **Acceptance Criteria:**
    - [x] On viewports ≤ 640px, status filters render as a segmented control with five segments (Wishlist, Shelf, Up Next, Playing, Played) using labels only — no count badges in the segments themselves.
    - [x] If the five labels do not fit the viewport without truncation, the segmented control becomes horizontally scrollable with a visible scroll affordance (snap points, fading edge, or scroll indicator) — *not* the current invisible `overflow-x: auto`.
    - [x] All segments are tap-targets at least 44px tall.
    - [x] A "Filters" button on the Library page header opens a bottom sheet containing the platform filter, the sort control, and a list of statuses with counts (2.5).
    - [x] Removing the existing chip strip does not introduce horizontal page scroll.

### 2.3 Dashboard "Quick Log" Hero Simplification (Finding #3, High)

**Decision:** Single primary CTA per game card ("Log Session"). "Reflect" is demoted to a secondary text link below the primary button. Games are sorted by recency.

- **As a** dashboard user with multiple in-progress games, **I want** one obvious action per game and a sensible ordering, **so that** I am not paralyzed by choice.
  - **Acceptance Criteria:**
    - [x] Each game in the Quick Log hero exposes exactly one primary CTA: **Log Session**, styled as a button.
    - [x] **Reflect** is rendered as a secondary text link beneath the Log Session button — not styled as a peer button.
    - [x] No other actions on the same card are styled as peer buttons to Log Session.
    - [x] Games shown are sorted by most-recent-activity first, using `LibraryItem.startedAt` and/or the latest journal-entry `createdAt`. Tie-breaker: `LibraryItem.updatedAt` descending.
    - [x] When no games are in `PLAYING` status, the existing empty-state CTA in the hero is preserved.

### 2.4 Library Card Status Badge (Finding #4, Medium)

**Decision:** Pill badge overlay in the top-left of the cover, showing both color and status text. Hidden when a single status filter is active (preserve existing dedupe behavior).

> **Superseded in part by 2.10:** The acceptance criterion that reuses the under-cover slot for status-aware metadata is replaced by the platform + contextual-date row defined in 2.10. The badge itself (top-left overlay, color + text, hidden under single-status filter) remains in force.

- **As a** library scanner, **I want** game status conveyed with both color and text, **so that** I can identify status at a glance and the UI passes WCAG 1.4.1.
  - **Acceptance Criteria:**
    - [x] Each library card overlays a pill badge in the top-left of the cover containing the localized status text (e.g., "Playing", "Played", "Wishlist", "Up Next", "Shelf").
    - [x] The badge uses a status color **and** text — never color alone.
    - [x] When the user has applied a single-status filter and the grid is therefore homogeneous, the badge is hidden (current behavior preserved).
    - [x] The redundant status text label below the cover is removed; that slot is reused for metadata (see 2.7).
    - [x] Badge text contrast against any cover image area passes WCAG AA (4.5:1) — a translucent dark or light backdrop is acceptable.

### 2.5 Filter Counts (Finding #5, Medium)

**Decision:** Inline count badge per chip/row. Counts respect other active filters (platform, search). Chips with zero matches under current filters are dimmed but remain clickable.

- **As a** library user, **I want** to see how many games match each status under my current other-filter context, **so that** I do not click into empty filters and I get progress feedback as my backlog shrinks.
  - **Acceptance Criteria:**
    - [x] Every status filter row in the desktop sidebar shows a count next to the label (e.g., "Playing 4").
    - [x] On mobile, the same counts appear next to status entries in the Filters bottom sheet (2.2). The mobile segmented control itself does not show counts.
    - [x] Counts reflect the games the user would see if that status were applied alongside the currently-active platform/search filters.
    - [x] Filters with a zero count under the current other-filter context are visually dimmed but remain clickable.
    - [x] Counts are returned by the same server query that loads the page's library data — no separate per-chip request.
    - [x] When a user changes a game's status locally, counts update optimistically and reconcile on server response.

### 2.6 Search Input Prominence (Finding #6, Medium)

**Decision:** Hero-position search above the grid with a focus ring and a `/` (Slash) shortcut hint that focuses the input. Not sticky on scroll. `⌘K` is reserved for the global command palette per 2.11; the library hero search uses `/` to avoid the conflict.

> **Revised by 2.11.** The original decision used `⌘K` to focus the library hero search. Section 2.11 reclaims `⌘K` for the global command palette (which itself becomes a Quick Add surface). The library hero search shortcut is changed to `/`.

- **As a** user with 100+ games, **I want** search to be the most prominent control on the Library page, **so that** I can find a game without scrolling.
  - **Acceptance Criteria:**
    - [x] On all viewports, the search input occupies a row above the games grid, full width of the grid column, with a minimum height of 44px.
    - [x] The input shows a visible focus state (border glow or outline ring) on focus.
    - [x] A keyboard shortcut hint (`/`) is shown inside the input, right-aligned.
    - [x] Pressing `/` from anywhere on the Library page (when no input is already focused) focuses the input. The shortcut focuses the existing input only — there is no command palette overlay opened by `/`.
    - [x] `⌘K` (or `Ctrl K`) is **not** bound by the library hero search. It is owned by the global command palette per 2.11.
    - [x] The input is not sticky on scroll.
    - [x] Existing placeholder text ("Filter library…") is preserved.

### 2.7 Library Card Metadata Hierarchy (Finding #7, Medium)

**Decision:** Status-aware metadata. Playing/Played show playtime when present, otherwise relative `startedAt`. Wishlist/Shelf/Up Next show platform when present, otherwise relative `createdAt`.

> **Superseded by 2.10.** The single-field rule below is replaced by the platform-badge + contextual-date row in 2.10. The constraint that no new database fields are required, and that "0h played" must never appear, carry forward into 2.10.

- **As a** patient gamer, **I want** each card to show one piece of metadata appropriate to the game's status, **so that** I get useful context without opening the detail page.
  - **Acceptance Criteria:**
    - [x] The space previously used by the redundant status text label (now moved to the cover badge per 2.4) shows status-appropriate metadata:
      - `PLAYING` or `PLAYED` with `actualPlaytime > 0`: clock icon + formatted playtime (e.g., "32h").
      - `PLAYING` or `PLAYED` with no `actualPlaytime`: relative `startedAt` (e.g., "Started 3d ago").
      - `WISHLIST`, `SHELF`, or `UP_NEXT` with `platformId`: platform name.
      - `WISHLIST`, `SHELF`, or `UP_NEXT` without `platformId`: relative `createdAt` (e.g., "Added 2w ago").
    - [x] No new database fields are required — implementation must use existing `LibraryItem` fields: `status`, `rating`, `hasBeenPlayed`, `createdAt`, `updatedAt`, `startedAt`, `actualPlaytime`, `acquisitionType`, `platformId`.
    - [x] When `actualPlaytime` is null or zero, the UI must not display "0h played" — it falls back per the rules above.
    - [x] Existing rating-stars display is preserved unchanged.

### 2.8 First-Time User Onboarding (Finding #8, Medium)

**Decision:** Embedded onboarding hero with two CTAs — Import from Steam and Search for Games. "Browse Popular" is dropped because no such surface exists.

- **As a** new user with an empty library, **I want** clear paths to add my first games, **so that** I reach first value without trial and error.
  - **Acceptance Criteria:**
    - [x] When a signed-in user's library is empty, the Library page (and the Dashboard's library widget if applicable) renders an embedded hero section with the heading **"Start Your Gaming Journey"** and two primary CTAs:
      1. **Import from Steam** — links to the existing Steam import flow.
      2. **Search for Games** — focuses the IGDB search.
    - [x] The hero includes a short description of what SavePoint does (one or two sentences) and at minimum a static illustration or textual preview of what a populated library looks like.
    - [x] The hero is shown only when the user has zero `LibraryItem` rows. As soon as they add one game, the hero is replaced by the standard library/dashboard view.
    - [x] The existing "Find a game to start" empty-state button is removed or absorbed into the new hero so users see one consistent empty state, not two.
    - [x] The hero is embedded in the page — no modal, no coachmark/tour overlay.

### 2.9 Loading State Feedback (Finding #9, Medium)

**Decision:** Optimistic UI for the games grid (apply filter/search/sort client-side immediately). The triggering control (chip/sort/search) is disabled and shows a spinner while the server reconciles. Implementation uses React 19 `useTransition` so input is never blocked.

- **As a** user changing a filter, sort, or search term, **I want** the grid to update instantly and the control to acknowledge my input, **so that** the app feels responsive and I do not double-click.
  - **Acceptance Criteria:**
    - [x] On a filter chip click, sort change, or debounced search keystroke, the games grid updates client-side immediately (optimistic) using already-fetched library data.
    - [x] Simultaneously, the triggering control enters a disabled state and shows a small spinner (in-chip / on the sort control / in the search input) until the server response arrives.
    - [x] While a fetch is in flight, filter chips and the sort control are not clickable; the search input remains typeable but its outgoing requests are debounced to a single in-flight request at a time.
    - [x] When the server response arrives, the grid reconciles with authoritative data; if the optimistic prediction was wrong, the diff is applied without a hard re-render flash.
    - [x] Input-handling uses `useTransition` (or equivalent) so the UI thread is never blocked during state updates.
    - [x] The existing `LibraryGridSkeleton` is still used for the initial page load and full route transitions — it is not used for in-page filter/sort/search changes (those are optimistic instead).

### 2.10 Library Card Complete Redesign (Design Handoff)

**Source:** Claude Design handoff bundle `OuNHM-A_QuBnFU2b2WCckQ`, archived under `context/spec/012-ui-ux-audit-improvements/design-handoff/`. The primary file is `Library-Card-Complete-Spec.html`; supporting prototypes are `Library-Card-Redesign.html` and `Card-Sizing-Study.html`.

**Decision:** Adopt the design handoff in full — responsive grid sizing, per-card always-visible primary CTA, context menu (⋮), platform + contextual-date metadata row, clickable rating stars, and a mobile list view at ≤640px. This section supersedes 2.4's metadata-slot reuse rule and 2.7's single-field rule where they conflict; all other constraints from 2.4 and 2.7 carry forward.

#### 2.10.1 Responsive Grid Sizing

- **As a** library user on any display, **I want** cards to stay at a readable width as my viewport changes, **so that** metadata and CTAs do not become unreadable on large screens or get cramped on small ones.
  - **Acceptance Criteria:**
    - [x] Desktop (≥1024px): grid uses `repeat(auto-fill, minmax(180px, 220px))` with a 16px gap. Cards never render narrower than 180px.
    - [x] Tablet (768–1023px): grid uses `repeat(auto-fill, minmax(160px, 200px))` with a 14px gap.
    - [x] Mobile (≤640px): the grid is replaced by the list view defined in 2.10.5 — not a single-column grid.
    - [x] The mid range (641–767px) renders as a grid with `minmax(150px, 1fr)` to bridge phone-landscape to tablet without a layout cliff.
    - [x] Card cover preserves a 3:4 aspect ratio at all widths.
    - [x] The previous fixed column system (`grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12`) is removed.

#### 2.10.2 Card Content Stack (Desktop / Tablet)

- **As a** patient gamer, **I want** each card to surface platform, recency, rating, and a primary action without hovering, **so that** I can triage my backlog by reading, not by mousing over each tile.
  - **Acceptance Criteria:**
    - [x] Each card renders, top-to-bottom: cover (with status badge per 2.4 and context menu per 2.10.4) → title (14px, 2-line clamp) → metadata row (2.10.3) → rating stars (2.10.6) → primary CTA button (2.10.4).
    - [x] No card content depends on hover to be readable or actionable.
    - [x] Title uses 14px / weight 600; metadata row uses 11px / muted color; CTA uses 13px / weight 600 inside a 36–40px tall button.
    - [x] Spacing between stack elements is 6–8px; the CTA gets 8px top margin.

#### 2.10.3 Metadata Row (Platform + Contextual Date)

- **As a** library scanner, **I want** every card to show platform and a relevant date so I can identify and recall games at a glance.
  - **Acceptance Criteria:**
    - [x] Metadata row format: `<platform badge> • <contextual date>` rendered inline.
    - [x] Platform badge uses the existing `platformId` lookup; badge style matches the muted secondary-badge token already in shadcn/ui usage. If `platformId` is null, the badge and the bullet separator are omitted (date renders alone).
    - [x] Contextual date is a relative string derived from `LibraryItem` fields by status:
      - `PLAYING`: `Started <relative startedAt>` if `startedAt` is set, else `Added <relative createdAt>`.
      - `UP_NEXT`: `Started <relative startedAt>` if set, else `Added <relative createdAt>`.
      - `PLAYED`: `Finished <relative updatedAt>`.
      - `SHELF` / `WISHLIST`: `Added <relative createdAt>`.
    - [x] Relative formatting matches the project's existing date helper (e.g., `3d ago`, `2w ago`, `5mo ago`).
    - [x] No new database fields are introduced. `actualPlaytime` is not displayed in the metadata row in this revision; if/when session logging populates it, a follow-up spec may re-introduce it.
    - [x] "0h played" or any zero-valued metadata never renders.

#### 2.10.4 Primary CTA + Context Menu

- **As a** library user, **I want** one obvious action per card and a non-hidden way to reach secondary actions, **so that** the card is usable on touch and keyboard, not just on hover.
  - **Acceptance Criteria:**
    - [x] Each card renders exactly one always-visible primary CTA button under the rating row, full card width.
    - [x] CTA label is status-aware:
      - `PLAYING` → **Log Session** (opens the existing session-log flow pre-filled with this game).
      - `UP_NEXT` → **Start Playing** (transitions status to `PLAYING`, sets `startedAt = now()` if null).
      - `SHELF` → **Queue It** (transitions status to `UP_NEXT`).
      - `PLAYED` → **Replay** (transitions status to `UP_NEXT`, sets `hasBeenPlayed = true`).
      - `WISHLIST` → **Add to Shelf** (transitions status to `SHELF`).
    - [x] CTA click does not navigate; clicking the cover or the title still navigates to the game detail page.
    - [x] A context menu trigger (⋮) renders absolutely positioned in the cover's top-right (28×28px hit area, semi-transparent dark backdrop, ≥3:1 contrast against any cover image). It is always visible — not hover-revealed.
    - [x] Context menu items: **View Journal Entries**, **Edit Library Details**, **Change Status →** (submenu of all five statuses), **Remove from Library**.
    - [x] The existing hover-overlay quick-action UI on cards is removed; its actions are migrated into the primary CTA + context menu per the matrix above.
    - [x] Both the CTA and the context-menu trigger preserve event propagation so clicking them does not also trigger card navigation.
    - [x] All interactive elements meet 44×44px touch-target minimums on mobile (2.10.5).

#### 2.10.5 Mobile List View (≤640px)

- **As a** mobile user, **I want** a scannable list of my games rather than a dense grid of thumbnails, **so that** titles and CTAs are legible without zooming.
  - **Acceptance Criteria:**
    - [x] On viewports ≤640px, the library renders as a vertical list. Each row uses `flex-direction: row`, 12px gap, 12px padding, and a divider or 8px vertical spacing between rows.
    - [x] Row layout: cover thumbnail (60×80px, fixed, `flex-shrink: 0`) on the left; content column (`flex: 1`, `min-width: 0`) on the right.
    - [x] Content column shows: title (15px, 1-line clamp), metadata row per 2.10.3 (12px), rating stars per 2.10.6, primary CTA per 2.10.4 (full row width, ≥44px tall).
    - [x] Status badge per 2.4 still overlays the thumbnail's top-left.
    - [x] Context menu (⋮) is anchored to the row's top-right, with the same 44×44px touch target.
    - [x] The mid range (641–767px) does not use the list view — it uses the grid per 2.10.1.
    - [x] Switching between list and grid is purely viewport-driven; no user toggle is added in this spec.

#### 2.10.6 Clickable Rating Stars

- **As a** user finishing or sampling a game, **I want** to set or change a rating from the card without opening the detail page, **so that** quick triage is possible during library scans.
  - **Acceptance Criteria:**
    - [x] Each card's rating row is interactive: clicking a star sets the rating to that value (1–5 on a card UI, mapped to the 1–10 `rating` column by `value × 2`, preserving compatibility with spec 011).
    - [x] Clicking the currently selected star clears the rating (sets `rating = null`).
    - [x] Updates apply optimistically and reconcile with the server response; on failure, the previous value is restored and the existing error toast is shown.
    - [x] Clicking a star does not trigger card navigation.
    - [x] Keyboard support: focusable star group, Left/Right arrows change rating, Enter commits, Escape cancels and restores prior value.

#### 2.10.7 Migration & Compatibility

- **Acceptance Criteria:**
  - [x] No `LibraryItem` schema changes are required. All fields used (`status`, `rating`, `hasBeenPlayed`, `createdAt`, `updatedAt`, `startedAt`, `platformId`) already exist.
  - [x] The status badge defined in 2.4 remains the source of truth for status presentation; 2.10 does not add a redundant status text under the cover.
  - [x] The single-status-filter dedupe behavior from 2.4 is preserved: when a single status filter is active, the cover badge hides but all other 2.10 elements (metadata row, CTA, context menu, rating, mobile list view) render unchanged.
  - [x] The existing `LibraryGridSkeleton` is updated to match the new card dimensions and the mobile list layout.
  - [x] Visual styling reuses existing design tokens (colors via the project's CSS variables, shadcn/ui `Button`, `Badge`, `DropdownMenu` primitives, Tailwind utilities). No new design system is introduced.

### 2.11 Quick Add Flow (Design Handoff)

**Source:** Claude Design handoff bundle `YRfjdF05bVwtzIhWDEQFGw`, archived under `context/spec/012-ui-ux-audit-improvements/design-handoff/quick-add/`. Primary file: `Quick-Add-Flow-Redesign.html`.

**Decision:** Replace the multi-step "search → detail page → modal → submit" flow with 1-click Quick Add using smart defaults, exposed in four surfaces: inline `+` on each search-result card, a Quick Add action in the existing `features/command-palette/`, a navbar **Add Game** button, and the existing detail-page modal (preserved as a fallback). `⌘K` is reclaimed for the command palette (see 2.6 for the library hero search shortcut change).

**Smart defaults** for any 1-click add:

| Field | Default |
|---|---|
| `status` | `UP_NEXT` |
| `platformId` | Auto-detected from the game's primary IGDB platform (first matching platform record). Null if no match exists in the local platform table. |
| `rating` | `null` |
| `acquisitionType` | `DIGITAL` |
| `notes` | empty / null |
| `hasBeenPlayed` | `false` |
| `startedAt` | `null` |

#### 2.11.1 Inline Quick Add Button on Search Results

- **As a** user browsing IGDB search results, **I want** to add a game to my library in one click without leaving the search surface, **so that** I can bulk-add games while exploring.
  - **Acceptance Criteria:**
    - [x] Every game-search result card (the IGDB results surface used in onboarding/empty-library and in the global search experience) renders a 32×32 `+` button anchored to the card's top-right.
    - [x] Clicking the `+` button calls a `quickAddToLibraryAction` server action with `{ gameId }`, which adds a `LibraryItem` for the current user using the smart defaults above.
    - [x] If the game is already in the user's library, the button shows the success/check state and is disabled (no duplicate-create error surfaced to the user).
    - [x] Optimistic UI: the button flips to a check state immediately on click; on error, the button restores and a destructive toast appears.
    - [x] On success, a toast reads `Added "<game name>" to Up Next` with an **Undo** action visible for ~5 seconds (2.11.5).
    - [x] Clicking the `+` button does not navigate to the detail page; clicking elsewhere on the card still navigates as today.
    - [x] The button has an accessible label (`aria-label="Quick-add <game name> to library"`) and is keyboard-reachable.

#### 2.11.2 Command Palette (`⌘K`) Quick Add

- **As a** keyboard-driven user, **I want** to add a game from anywhere in the app via the command palette, **so that** I do not have to navigate to a search page first.
  - **Acceptance Criteria:**
    - [x] `⌘K` (macOS) / `Ctrl K` (other platforms) opens the existing global command palette from any authenticated route.
    - [x] The palette surfaces a Quick Add mode (either always-on or via an "Add game to library" action). Typing ≥ 2 characters runs an IGDB search and shows up to 8 result rows.
    - [x] Each result row shows: game title, platform badge, year/category if available, and a right-aligned hint reading `Add to Up Next`.
    - [x] Selecting a row (Enter or click) calls the same `quickAddToLibraryAction` and closes the palette.
    - [x] Toast feedback and Undo behave per 2.11.5.
    - [x] `Esc` closes the palette without adding.
    - [x] The command palette retains any pre-existing actions (Slice 6 and earlier) — Quick Add is added, not replacing.

#### 2.11.3 Navbar "Add Game" Button

- **As a** user on any authenticated page, **I want** a globally-visible Add Game entry point, **so that** I do not have to know which page to start from.
  - **Acceptance Criteria:**
    - [x] The header (`widgets/header/ui/header.tsx`) shows an **Add Game** button on viewports ≥ 768px. On mobile (≤ 640px) the button collapses to an icon-only `+` with `aria-label="Add Game"`.
    - [x] Clicking the button opens the global command palette in Quick Add mode (2.11.2). It does **not** open a separate modal.
    - [x] The button is rendered next to the existing `⌘K` palette trigger if one exists, or replaces it (audit during implementation; only one entry point should exist).

#### 2.11.4 Detail-Page Modal Preserved as Fallback

- **As a** user who wants to set status / platform / acquisition explicitly at add-time, **I want** the existing full add-to-library modal on the game detail page to still work.
  - **Acceptance Criteria:**
    - [x] The existing "Add to Library" modal on the game detail page is unchanged in this spec.
    - [x] No code path in this spec routes the detail-page Add flow through `quickAddToLibraryAction`; it continues to use the existing form-based action.

#### 2.11.5 Toast + Undo Behavior

- **As a** user who clicks Quick Add by mistake, **I want** a quick way to undo, **so that** misclicks do not pollute my library.
  - **Acceptance Criteria:**
    - [x] After a successful Quick Add (any surface), a toast renders for ~5 seconds containing: success icon, text `Added "<game name>" to Up Next`, and a textual **Undo** button.
    - [x] Clicking **Undo** within the toast lifetime calls a `removeLibraryItemAction` (existing remove flow) for the just-added item; the toast is replaced with a brief `Removed` confirmation.
    - [x] If the toast lifetime expires without action, the item remains in the library; no further confirmation is required.
    - [x] Toast and Undo behavior is identical across all three Quick Add surfaces (inline `+`, command palette, navbar trigger that delegates to command palette).
    - [x] If multiple Quick Adds happen in rapid succession, each emits its own toast (no merging), and Undo on a given toast only removes the specific item it refers to.

#### 2.11.6 Smart Platform Auto-Detect

- **As a** user adding games whose primary platform should be guessed correctly, **I want** the auto-detected platform to match my collection patterns when possible.
  - **Acceptance Criteria:**
    - [x] Auto-detect resolves a `platformId` from the IGDB game's platform list using the first platform that exists in our local `Platform` table, in the order returned by IGDB.
    - [x] If no IGDB platform matches a local `Platform`, `platformId` is set to `null`. The add still succeeds.
    - [x] If the user has previously chosen a platform for a different game in the same Steam-import / browsing session, that preference is **not** used by this spec — auto-detect is stateless. (A "preferred platform" preference is out of scope.)
    - [x] The auto-detect result is editable per 2.12 after the item is added.

### 2.12 Editable Platform on Library Items

**Decision:** Once a `LibraryItem` exists, the user can change its `platformId` (or clear it to null) from the existing Edit Library Details surface. Today this field is fixed at create time, which is incorrect — Quick Add's auto-detect (2.11.6) makes this even more important because the guess can be wrong.

- **As a** user who notices the platform on a library item is wrong (especially after Quick Add auto-detect), **I want** to change it without removing and re-adding the game, **so that** my library reflects the right platform.
  - **Acceptance Criteria:**
    - [x] The existing Edit Library Details dialog/form (reached from the card's `⋮` menu per 2.10.4 and from the detail page) exposes a `platform` field that can be set, changed, or cleared.
    - [x] Submitting the form persists `platformId` (or `null`) on the `LibraryItem` row.
    - [x] The change is reflected immediately on the card metadata row (2.10.3) and on any platform-derived filter/count (2.5) on next render.
    - [x] No new database fields are introduced; `LibraryItem.platformId` is already nullable and writable in schema.
    - [x] If the underlying server action / use-case currently rejects `platformId` updates, that restriction must be lifted as part of this section.
    - [x] Existing platform-related validation (must reference an existing `Platform` row when non-null) is preserved.

---

## 3. Scope and Boundaries

### In-Scope

- The nine findings listed in Section 2 (audit findings #1–#9), implemented per the **Decision** line for each finding.
- The Library Card Complete Redesign in 2.10, sourced from the Claude Design handoff bundle.
- The Quick Add Flow in 2.11 (inline `+` on search results, command palette Quick Add, navbar **Add Game** button, smart defaults, toast + Undo).
- The Editable Platform change in 2.12 — making `LibraryItem.platformId` mutable from the Edit Library Details surface.
- Server-side data work strictly required to support the UI changes:
  - Returning per-status counts that respect other active filters in the same request as the Library page query (2.5).
  - Sorting Quick Log hero by recency using existing `LibraryItem` fields and journal data (2.3).
- Accessibility regressions introduced or fixed by the above (specifically WCAG 1.4.1 for status indicators, 4.5:1 contrast for badges, 44px touch targets on mobile filter segments and on per-card CTAs).
- Visual reuse of the existing design tokens, shadcn/ui primitives, and Tailwind utilities — no new design system.

### Out-of-Scope

- **Audit findings #10–#12** (Inconsistent Visual Rhythm, Hidden Action Affordances, Theme-specific visual noise) — explicitly deferred per scoping decision (low priority).
- **Audit variants that were not chosen,** including:
  - Vertical-stack-with-progressive-disclosure (Finding #1 Option A) and compact inline dropdown (Finding #1 Option C).
  - 2×3 wrapping grid for mobile (Finding #2 Option A) and dropdown menu (Finding #2 Option B).
  - Carousel hero (Finding #3 Option B) and modal-based Quick Log (Finding #3 Option C).
  - Corner ribbon (Finding #4 Option B) and bottom status bar (Finding #4 Option C).
  - Right-aligned count without other-filter awareness (Finding #5 Option B as originally drawn) and visual progress bars (Finding #5 Option C).
  - Full command palette / multi-resource ⌘K overlay (Finding #6 Option B) and sticky header search (Finding #6 Option C).
  - Single-rule playtime everywhere (Finding #7 Option A as a global rule) and dense compact metadata row (Finding #7 Option C).
  - Welcome modal (Finding #8 Option A) and step-by-step guided tour (Finding #8 Option C).
  - Skeleton-only loading (Finding #9 Option A) and inline-spinner-only loading (Finding #9 Option B).
- **Browse Popular surface.** The discovery/popular-games page does not exist; the third onboarding CTA is dropped, not stubbed. A future spec may add it.
- **New backend fields.** All metadata in 2.7 must use existing `LibraryItem` columns. Active session-tracking / journaling features required to populate `actualPlaytime` automatically are not in scope.
- **Theme work** (Y2K / Jewel themes), **spacing audit pass**, and **action-affordance hover-vs-persistent debate** — separate future spec.
- **Other roadmap items** not derived from the audit (e.g., social features beyond what shipped in spec 008, unified profile in spec 009, star ratings in spec 011).
- **Cross-layer (`lambdas-py` / `infra`) changes.** This spec is `savepoint-app`-only.

---

## Appendix A — Audit & Design Sources

This spec was derived from two Claude Design handoff bundles:

**Bundle 1 — UI/UX Audit (`248FEZSzarItsCzVEhEtOw`)**, the source of findings #1–#9:

- `UI-UX-Audit.html` — full audit document with 12 findings, 3–4 design variants per finding, and a data-model annotation referencing `LibraryItem` schema fields.
- `chats/chat1.md` — conversation transcript showing scope decisions (comprehensive depth; six focus areas: visual design, user flows, IA, interaction patterns, performance/loading, onboarding; side-by-side comparisons; three personas: patient gamers, casual gamers, social users; device priorities: desktop and mobile phones).
- Annotated mockups for each variant.

The recommended/selected mockups for each in-scope finding live in the bundle and should be used as visual reference during the technical-spec and implementation phases.

**Bundle 3 — Quick Add Flow (`YRfjdF05bVwtzIhWDEQFGw`)**, the source of section 2.11:

- `Quick-Add-Flow-Redesign.html` — primary spec: 1-click add with smart defaults, four surfaces, toast + Undo. Archived under `context/spec/012-ui-ux-audit-improvements/design-handoff/quick-add/`.
- `chats/chat1.md` — conversation transcript driving the design.
- `README.md` — handoff instructions for coding agents.

**Bundle 2 — Library Card Complete Spec (`OuNHM-A_QuBnFU2b2WCckQ`)**, the source of section 2.10:

- `Library-Card-Complete-Spec.html` — primary spec the user opened on handoff: card sizing, layout/metadata, interactions, implementation guide, interactive demo.
- `Library-Card-Redesign.html` — earlier redesign exploration.
- `Card-Sizing-Study.html` — sizing study supporting the 180–220px decision.
- `chats/chat1.md` — conversation transcript driving the design decisions.
- `README.md` — handoff instructions for coding agents.

These files are archived under `context/spec/012-ui-ux-audit-improvements/design-handoff/` and should be the primary reference during the technical spec and implementation phases for 2.10. The HTML prototype is non-normative for technology choice — re-implement using the project's React 19, Next.js 15, shadcn/ui, and Tailwind stack.

## Appendix B — Data Model Touchpoints

UI changes reference the following existing `LibraryItem` fields:

- `status` — used for badge text/color (2.4), filter counts (2.5), and metadata branching (2.7).
- `rating` — preserved on cards (2.7).
- `hasBeenPlayed` — already drives "Replay" vs "Up Next" labels; no change.
- `createdAt`, `updatedAt`, `startedAt` — fallbacks for card metadata (2.7) and Quick Log sort (2.3).
- `actualPlaytime` — primary metadata for `PLAYING`/`PLAYED` cards (2.7); displayed only when non-null and non-zero.
- `platformId` — primary metadata for `WISHLIST`/`SHELF`/`UP_NEXT` cards (2.7); also drives the existing platform filter.
- `acquisitionType` — not surfaced by this spec; reserved for future card-metadata variants.

Section 2.10 additionally relies on:

- `status` transitions written by the per-card primary CTA (2.10.4): `UP_NEXT → PLAYING` (sets `startedAt`), `SHELF → UP_NEXT`, `PLAYED → UP_NEXT` (sets `hasBeenPlayed`), `WISHLIST → SHELF`.
- `rating` writes from clickable card stars (2.10.6), reusing the 1–10 scale established by spec 011.

Section 2.11 (Quick Add) additionally writes:

- `LibraryItem` create with `status = UP_NEXT`, `platformId = <auto-detected or null>`, `acquisitionType = DIGITAL`, `rating = null`, `notes = null`, `hasBeenPlayed = false`, `startedAt = null`.
- Reads from IGDB game records to derive the auto-detected `platformId` (no schema change).

Section 2.12 (Editable Platform) writes:

- `LibraryItem.platformId` updates after creation. The column is already nullable and writable in schema; only the use-case / server action surface needs to permit the update.
