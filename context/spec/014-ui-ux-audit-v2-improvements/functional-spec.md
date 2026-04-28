# Functional Specification: UI/UX Audit V2 — Round 2 Improvements

- **Roadmap Item:** UI/UX Audit V2 follow-through — implement all 12 pinned findings from the SavePoint UI/UX Audit, Volume II (April 2026), plus the Raycast-style global command center direction.
- **Status:** Completed
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

Spec 012 closed the first audit's high- and medium-priority findings (library scannability, mobile filters, dashboard hero, onboarding entry, library card redesign, quick add). With the foundational library experience in shape, a second-pass audit (sourced from a Claude Design handoff bundle, see `design-handoff/chats/chat2.md` and `design-handoff/project/UI-UX-Audit-V2.html`) covers the surfaces V1 didn't touch: **game detail, journal, profile, settings, auth**, and the **navigational connective tissue** between them.

The V2 audit produced 12 findings (3 High, 7 Medium, 2 Low) and a cross-cutting direction. For each finding the user has **pinned a chosen variant** while reviewing the design canvas; those pinned decisions are the source of truth for this spec. The unchosen variants from the audit document are non-normative and not built.

**User pain points the audit surfaces:**

- **Search has no single mental anchor** — it lives in the desktop top-bar, in the mobile bottom nav, and behind a separate "Add Game" button on the dashboard. Three placements, no learnability across breakpoints, and bottom-nav real estate spent on a non-content surface.
- **Mobile bottom nav has six tabs**, over the iOS HIG / Material ceiling of five. Hit targets fall below 44pt on common phone widths, labels truncate, and the bar can't be scanned at a glance.
- **Game detail buries the title** — a tall gradient banner plus a sticky "Library Status" sidebar dominates the first glance; cover and title are visually dissociated; on mobile the sidebar pushes the synopsis below the fold.
- **The "Library Status" card on game detail is over-built** for what is functionally a status pill plus a 1–10 rating; changing status is a two-step button-into-modal flow.
- **Journal entry detail reads as a form**, not as the entry — two stacked cards labeled "Game" and "Entry" frame the actual writing, and a destructive Delete sits as a red peer to Edit at the bottom of the page.
- **Populated journal list is a flat wall** — three weeks of entries look identical to three months; no grouping, filters, or rhythm.
- **Profile header is misproportioned** — Logout button visible on every profile view, private email rendered next to public stats, five competing zones with no hierarchy.
- **Profile sub-tabs look like the main app nav** — two parallel underline tab bars at the same visual rank; the user can't tell page-level navigation from in-page view switching.
- **Auth page sets no tone** — generic centered card with a tagline that could fit Steam, Backloggd, or any competitor.
- **Settings is a single-card form with no IA hook** for the privacy, connected-accounts, notifications, data-export, and account-deletion sections that real settings need.
- **Mood and tag chips on journal cards mix affordances** — mood is a strong colored badge, tags are plain `#hashtag` text; same row, very different signals.
- **Page-level heading sizes drift** across Library (22px), Profile (18px), Settings (16px) — body copy similarly drifts. There's no enforced type scale.

**Desired outcome:** a coherent visual and IA system across every authenticated surface, with a single global navigation shell on each platform, a single global add/search entry point (`⌘K`), and a documented type scale that pages must conform to.

**Success measures:**

- Desktop uses one persistent left-rail shell across every authenticated page; the top-bar search field is removed and replaced by a `⌘K` palette plus a single search icon button.
- Mobile bottom nav is reduced from 6 tabs to 4 (Library / Journal / Timeline / Profile); search promotes to a top-bar icon, and "Add Game" routes through the same overlay.
- A global ⌘K command palette is reachable from every authenticated page on every breakpoint, and serves as the single host for global search, navigation jumps, and quick-add.
- Game detail uses one unified hero lockup (cover + title + status + rating) on desktop and mobile; the standalone gradient banner is decoration only.
- Library status on game detail is a single inline interaction — segmented control on viewports wide enough to fit, horizontal scroll on narrow viewports, with a dropdown-pill fallback path documented if the scroll behavior tests poorly.
- Journal entry detail renders as a reading view with the entry title as the dominant element; destructive actions move behind a `⋯` menu with confirmation.
- Populated journal list is grouped by game by default with a per-group entry count; the calendar-heatmap idea is parked for a future Stats / Year-in-Review surface.
- Profile header is a banner-with-overlap layout; Logout moves to settings; email never renders on a public profile.
- Profile sub-tabs render as a segmented control, visually distinct from the underline tabs used for top-level routes.
- Auth page is a quiet, type-led editorial layout. The "Manage your gaming experiences" tagline is replaced.
- Settings uses a left-rail shell consistent with the new global desktop shell, with section groupings ready to extend.
- Journal mood is rendered as an eyebrow above the entry title (one mood, one entry); tags are outlined chips below the body, with no leading `#`.
- A 6-stop type scale (display, h1, h2, h3, body, caption) is defined, documented with role rules, and refactored across every page touched by this spec.

---

## 2. Functional Requirements (The "What")

For each finding, the **Decision** line records the variant pinned in the audit. Variants from the audit that were not chosen are non-normative.

The findings are presented in the audit's own ordering. Implementation ordering is left to the technical spec / tasks phase; logically the global shell (2.1, 2.2, 2.10, 2.13) and the global command center (2.13) should land before the surface-specific reworks (2.3–2.9, 2.11), and the type scale (2.12) should be in place before pages are refactored onto it.

### 2.1 Global Navigation — Desktop Left Rail (Finding #1, High)

**Decision:** Replace the current top-bar nav with a persistent left rail across every authenticated desktop page. Search leaves the top bar; ⌘K (per 2.13) becomes the global search/quick-add entry. A single search-icon button in the rail (or top of content area) opens the same palette.

- **As a** desktop user, **I want** one consistent navigation shell on every authenticated page, **so that** I never have to hunt for the search input or learn three separate placements.
  - **Acceptance Criteria:**
    - [ ] On viewports ≥ 1024px, every authenticated route renders a persistent left rail; no authenticated route renders the legacy top-bar nav.
    - [ ] The rail contains, at minimum: brand mark (links to `/dashboard`), Library, Journal, Timeline, Profile, Settings, and a search-icon button. Items use icon + label by default; the rail may collapse to icon-only at narrow desktop widths.
    - [ ] The current item is visually highlighted; tooltip on hover when in icon-only mode.
    - [ ] The rail is keyboard-traversable and has correct landmark / `aria-current` semantics.
    - [ ] The search-icon button opens the global command palette (2.13). No search input lives in the top of the content area on desktop.
    - [ ] The "Add Game" button on the Dashboard, when present, opens the same global palette — it does not navigate to a separate add-game page or modal.
    - [ ] Removing the top-bar nav does not remove the user-menu surface; it relocates to the bottom of the left rail (avatar + user menu).

### 2.2 Mobile Navigation — 4 Tabs + Top-Bar Search (Finding #2, High)

**Decision:** Reduce the mobile bottom nav to **4 tabs**: Library, Journal, Timeline, Profile. Promote search to a top-bar icon button that opens the global palette (2.13). Dashboard (as a separate "home" snapshot) is not a tab in this configuration; it is reached via Library's landing or the brand mark.

- **As a** mobile user, **I want** a tab bar I can scan in one glance and tap reliably, **so that** I am not fighting hit targets and label truncation on a 375px screen.
  - **Acceptance Criteria:**
    - [ ] On viewports ≤ 640px (and on tablet widths where the mobile nav is in use today), the bottom nav contains exactly 4 items: Library, Journal, Timeline, Profile.
    - [ ] Each tab has an icon + label that does not truncate at 360px viewport width.
    - [ ] Each tab is at least 44pt × 44pt.
    - [ ] The "Search" tab is removed from the bottom nav; a search-icon button is present in the top app bar on every authenticated route, opening the global palette (2.13).
    - [ ] "Add Game" actions (e.g., from Dashboard) on mobile open the same global palette overlay; they do not navigate to a separate page.
    - [ ] No second mobile nav is rendered for any authenticated route; Dashboard, when reachable, is not a tab.

### 2.3 Game Detail — Unified Hero Lockup (Finding #3, High)

**Decision:** Replace the banner + sticky-sidebar layout with a **single hero lockup** that places cover, title, status, and rating together as one visual unit. On mobile, the same lockup is used; the gradient banner shrinks and the cover overlaps it.

- **As a** user opening a game's detail page, **I want** the cover and title together as the page subject, **so that** the page reads as the game I clicked, not as a "Library Status" widget.
  - **Acceptance Criteria:**
    - [ ] On all viewports, the game detail page opens with a hero containing cover + title + status control + rating in one lockup. Cover and title are a single visual unit (adjacent, same content row, same hierarchy).
    - [ ] The standalone tall gradient banner above the page subject is removed (desktop) or shrunk so the cover overlaps it (mobile). Any remaining gradient is decoration; it does not push the title or synopsis below the fold.
    - [ ] On mobile (≤ 640px), the synopsis appears within the first scroll without the user having to pass through a sticky sidebar.
    - [ ] The standalone "Library Status" sidebar/card is removed from the page (its function is replaced by 2.4's inline control).
    - [ ] The page's H1 is the game title; no other H1 element is rendered on the page.

### 2.4 Game Detail — Inline Library Status (Finding #4, Medium)

**Decision:** Replace the "Library Status" card + modal flow with an inline status control in the hero. The control is a **segmented control**; on viewports too narrow to show all statuses (6+ statuses), the row scrolls horizontally with snap points. **Fallback path:** if the horizontal scroll feels rough in test, swap to a dropdown pill (V1 of the audit) — this is the only finding with an explicit fallback documented at spec time.

- **As a** library user on a game detail page, **I want** to change my library status with one tap, **so that** I am not forced through a button-into-modal flow for a single-pill change.
  - **Acceptance Criteria:**
    - [ ] The hero exposes the user's current library status as a **segmented control** showing every supported status as a labeled segment.
    - [ ] Tapping a segment writes the new status without opening a modal; the change persists optimistically and reconciles on server response.
    - [ ] On viewports too narrow to fit all segments without truncation, the row becomes horizontally scrollable with a visible scroll affordance (snap points, fading edge, or scroll indicator) — not invisible `overflow-x: auto`.
    - [ ] The user's rating is shown inline next to the status, as interactive 1–10 stars (re-using the spec 011 control). Tapping a star writes the rating optimistically.
    - [ ] No "Manage Library" button is rendered on the page; no modal is opened by status changes or rating changes.
    - [ ] The "Updated: …" timestamp line is removed from the inline status control.
    - [ ] **Fallback (documented, not built by default):** if the horizontal-scroll segmented control fails usability testing, the inline control may be swapped to a dropdown pill that opens a quick menu of statuses. The fallback must be discussed and approved before implementation; the segmented control is the default direction.
    - [ ] Notes and any custom-shelf affordance remain accessible via a secondary surface (e.g., a `⋯` menu or the Journal entry flow); they are explicitly **not** part of the inline status control.

### 2.5 Journal Entry Detail — Editorial Reading View (Finding #5, High)

**Decision:** Replace the two-card "Game / Entry" layout with an **editorial header**: the entry title is the dominant element; game, mood, and duration sit in a metadata line beneath it; the body is the dominant block; destructive actions move behind a `⋯` menu with confirmation.

- **As a** journaler revisiting an entry, **I want** the entry to read as my writing, **so that** the page does not feel like a form and I cannot delete it by mistake.
  - **Acceptance Criteria:**
    - [ ] The page opens with the entry title as the visually dominant element. If the entry has no user-set title, an auto-derived title is used: the first non-empty line of the body, truncated to a sensible length; if the body is empty, the title falls back to `<game title> — <date>`.
    - [ ] The page does not render labeled "Game" or "Entry" section card headings.
    - [ ] Below the title, a single metadata line shows: game (linked), mood (per 2.11's eyebrow treatment), duration (when present), and date.
    - [ ] The entry body is the dominant block on the page.
    - [ ] Edit and Delete are not rendered as adjacent peer buttons. **Edit** remains a primary inline action (button or link). **Delete** is reachable only through a `⋯` overflow menu and triggers a confirmation step (modal or inline confirm) before destruction.
    - [ ] No data is destroyed by a single click anywhere on the page.

### 2.6 Journal List — Grouped by Game (Finding #6, Medium)

**Decision:** Default the populated journal list to **grouped-by-game** with a per-group entry count. The calendar-heatmap idea is parked for a future Stats / Year-in-Review surface and is **not** built by this spec.

- **As a** user with months of entries, **I want** the list to group by game, **so that** I can scan "what did I write about Hollow Knight" without scrolling a flat wall.
  - **Acceptance Criteria:**
    - [ ] On the Journal list (populated state), entries render in groups keyed by game, ordered by most-recent-entry-in-group first.
    - [ ] Each group header shows the game cover/title and the number of entries in that group.
    - [ ] Within each group, entries are sorted by `createdAt` descending.
    - [ ] The flat list mode is replaced; users do not need to opt into grouping.
    - [ ] The empty state (no entries at all) is preserved unchanged.
    - [ ] No calendar / heatmap surface is added by this spec.
    - [ ] Filters (mood, tag, status) are **not required** by this spec; if they are added, the implementation must be additive and not regress the grouping default.

### 2.7 Profile Header — Banner + Overlap (Finding #7, Medium)

**Decision:** Profile header becomes a **banner with avatar overlap**, single-line stats, single owner action ("Edit Profile") or single visitor action ("Follow"). Logout moves to settings. Email never renders on a public profile.

- **As a** user viewing a profile, **I want** the header to feel like a profile, **so that** the most prominent elements are identity and personality, not account chrome.
  - **Acceptance Criteria:**
    - [ ] Profile pages render a banner image area at the top of the header, with the user avatar overlapping the banner edge.
    - [ ] Display name and handle render adjacent to the avatar; follower / following counts render as a single inline metadata line.
    - [ ] Email does not render on a publicly-visible profile under any visibility setting.
    - [ ] Logout is removed from the profile header. Logout is reachable from Settings (and/or the user menu in the rail/top bar).
    - [ ] The header exposes exactly one primary action button: **Edit Profile** when the viewer is the profile owner; **Follow / Unfollow** when the viewer is a visitor (re-using the spec 008 follow control).
    - [ ] The header on mobile (≤ 640px) follows the same lockup, scaled appropriately; the action button does not stack ambiguously with secondary chrome.

### 2.8 Profile Sub-Tabs — Segmented Control (Finding #8, Low)

**Decision:** Replace the profile sub-tabs' underline treatment with a **segmented control**, visually distinct from the underline tabs used for top-level routes.

- **As a** user on a profile page, **I want** in-page view switching to look different from page navigation, **so that** I can tell which control is "switch view here" vs "go to another page".
  - **Acceptance Criteria:**
    - [ ] Profile sub-tabs (e.g., Overview / Library / Journal / Followers — exact tabs preserved from current implementation) render as a segmented control, not as an underline tab bar.
    - [ ] The segmented control is visually distinguishable from any underline tab bar used elsewhere in the app at the same screen.
    - [ ] Active state and keyboard navigation behavior of the existing tabs is preserved.
    - [ ] No visual treatment elsewhere in the app is changed to look like the new profile sub-tabs.

### 2.9 Auth — Minimal Editorial (Finding #9, Medium)

**Decision:** Replace the centered-card layout with a **minimal editorial** layout: type carries the brand, no marketing tagline. The "Manage your gaming experiences" copy is removed.

- **As a** first-time visitor reaching the auth screen, **I want** the screen to feel like SavePoint, **so that** the first impression is not interchangeable with Steam, Backloggd, or GOG Galaxy.
  - **Acceptance Criteria:**
    - [ ] The sign-in screen lays out as a quiet editorial composition: a typographic SavePoint mark, optional short editorial copy specific to journaling/personal history, and the auth controls.
    - [ ] The string "Manage your gaming experiences" is removed from the screen entirely.
    - [ ] No imagery is required; the screen relies on the type scale (2.12) for hierarchy.
    - [ ] The Google OAuth control and the email/password control remain functional and reachable; their behavior is unchanged from current.
    - [ ] The screen renders correctly at 360px wide and at 1440px wide; nothing is centered to the point of being lost on wide screens.

### 2.10 Settings — Left-Rail Shell (Finding #10, Medium)

**Decision:** Replace the single-card form with a **left-rail settings shell** consistent with the new global desktop rail (2.1). Mobile uses a sectioned-list shell that maps cleanly onto the same rail items.

- **As a** user managing my account, **I want** a settings shell that has room to grow, **so that** future privacy, connected-accounts, notifications, data-export, and account-deletion sections have a place to live.
  - **Acceptance Criteria:**
    - [ ] On viewports ≥ 1024px, Settings renders with a left rail listing the settings sections (initial sections preserved from current implementation; at minimum: Profile / Account). The active section's content fills the right column.
    - [ ] The settings rail visually nests inside (or sits adjacent to) the global app rail (2.1); the user does not see two competing rails fighting for the same space.
    - [ ] On viewports ≤ 1023px, Settings renders as a sectioned list with the same section labels; tapping a section pushes into a sub-page or expands the section.
    - [ ] A "Danger zone" pattern is reserved at the bottom of the relevant section for destructive actions (e.g., delete account). This spec does not require new destructive actions to be implemented; it requires the shell to support them.
    - [ ] Logout (relocated from the profile header per 2.7) is reachable from Settings.
    - [ ] No regression in existing settings behavior (avatar / username / save).

### 2.11 Journal Chips — Mood-as-Eyebrow, Tags as Outlined Chips (Finding #11, Low)

**Decision:** Mood becomes an **eyebrow** (small uppercase header above the entry title) — one mood per entry. Tags become **outlined chips** below the body, with no leading `#`.

- **As a** journaler, **I want** mood and tags to look like what they are, **so that** mood reads as the entry's tone and tags read as filters I can tap.
  - **Acceptance Criteria:**
    - [ ] On journal cards (list and detail), the entry's mood renders as an eyebrow (small, uppercase, color-tinted) directly above the entry title — not as an inline pill in a chip row.
    - [ ] Tags render below the entry body (or as a chip row at the card foot) as outlined chips. The leading `#` character is not rendered.
    - [ ] Mood and tags are not rendered side-by-side as same-shape elements; their roles are encoded by shape, not by adjacency.
    - [ ] Tag chips remain interactive (tappable to filter), preserving any existing behavior; outline visually signals interactivity.
    - [ ] The data model is unchanged; tags continue to be persisted without leading `#`, and any leading `#` in stored data is sanitized at render time.

### 2.12 Type Scale — 6-Stop System (Finding #12, Medium)

**Decision:** Define and document a **6-stop type scale** (display, h1, h2, h3, body, caption). Each stop has a documented role; pages touched by this spec are refactored onto it.

- **As a** designer/developer, **I want** a single shared type scale, **so that** Library, Profile, Settings, and every new page read as the same product.
  - **Acceptance Criteria:**
    - [ ] A 6-stop type scale is defined with named roles: **display**, **h1**, **h2**, **h3**, **body**, **caption**. Each stop has a documented size, line-height, weight, and letter-spacing.
    - [ ] Role rules are documented at minimum:
      - **display** — used at most once per page on a "hero" surface (e.g., game detail title, profile header name) when a beat above h1 is desired; never required.
      - **h1** — exactly one per page; the page's primary subject.
      - **h2** — section headings within a page.
      - **h3** — sub-section headings; not required on every page.
      - **body** — default reading text.
      - **caption** — labels, metadata lines, eyebrows, and timestamps.
    - [ ] The scale is implemented as named utilities/tokens (Tailwind classes, CSS variables, or design tokens — whichever fits the technical spec). Components do not pick raw `text-[NNpx]` literals once on the scale.
    - [ ] Every page touched by this spec (game detail, journal list, journal entry detail, profile, profile sub-tabs page, auth, settings, library) uses scale stops only — no off-scale heading or body sizes remain on these pages after refactor.
    - [ ] A single page-level h1 invariant is enforced on each touched page (see 2.3, 2.5, 2.10).
    - [ ] The scale documentation lives in the codebase (e.g., in the design-system package or in `CLAUDE.md`-adjacent docs) and is the canonical reference for new pages; future pages must use it.

### 2.13 Global Command Center — Raycast-Style ⌘K Palette (Direction)

**Decision:** Build a **global command palette** reachable via `⌘K` (or `Ctrl K`) and via the search-icon affordances established in 2.1 (desktop rail) and 2.2 (mobile top-bar). The palette is the single host for global game search, navigation jumps, and quick-add — the natural pair to the new desktop rail.

- **As a** user, **I want** one keyboard-first surface that knows about every important verb in the app, **so that** I never have to remember where the search input lives this week.
  - **Acceptance Criteria:**
    - [ ] A global command palette is reachable via `⌘K` / `Ctrl K` from every authenticated route on every breakpoint.
    - [ ] On desktop, the palette also opens via the search-icon button in the left rail (2.1) and via the dashboard "Add Game" button.
    - [ ] On mobile, the palette opens via the search-icon button in the top app bar (2.2) and via "Add Game" affordances; no separate mobile-only search route is used as the entry point.
    - [ ] The palette opens as an overlay; opening it does not navigate, and closing it (Esc, backdrop click, or close affordance) returns the user to where they were with focus restored.
    - [ ] The palette supports, at minimum, three result groups visible simultaneously based on the current query:
      - **Games** — IGDB search results (the current global search behavior).
      - **Navigation** — jump to Library / Journal / Timeline / Profile / Settings / Dashboard.
      - **Quick actions** — at minimum: "Add game to library" (re-using the spec 012 §2.11 quick-add server action with smart defaults), and "Log session" / "New journal entry" if reachable from current state.
    - [ ] Selecting a Game result triggers quick-add per spec 012 §2.11 (status `UP_NEXT`, smart-default platform from IGDB metadata, undo toast). It does not navigate the user away from their current page unless they explicitly chose a "Open detail" action within the palette.
    - [ ] The palette is fully keyboard-navigable: arrow keys move selection, Enter triggers, Tab is not a selection key, focus is trapped while open.
    - [ ] The palette is implemented as a single shared component reachable from all entry points listed above; it is not duplicated per route.
    - [ ] The previously inline top-bar search input on desktop is removed (per 2.1); search now lives only in the palette and inside surfaces that have their own page-scoped search (e.g., the Library hero search shortcut from spec 012 §2.6, which uses `/`, remains owned by that page).
    - [ ] `⌘K` is reserved globally for this palette and is **not** rebound by any other surface introduced by this spec.

---

## 3. Scope and Boundaries

### In-Scope

- All 12 pinned findings from the V2 audit:
  1. Desktop left-rail nav (2.1)
  2. Mobile 4-tab nav (2.2)
  3. Game detail unified hero (2.3)
  4. Inline library status on game detail (2.4)
  5. Journal entry detail editorial header (2.5)
  6. Journal list grouped by game (2.6)
  7. Profile header banner + overlap (2.7)
  8. Profile sub-tabs as segmented control (2.8)
  9. Auth minimal editorial (2.9)
  10. Settings left-rail shell (2.10)
  11. Journal mood-as-eyebrow / tags as outlined chips (2.11)
  12. 6-stop type scale (2.12)
- Global ⌘K command palette (2.13) as the cross-cutting direction that pairs with 2.1 / 2.2.
- Refactoring every touched page onto the new type scale (2.12).
- Relocating Logout from profile header to Settings (2.7 → 2.10).
- Archiving the design handoff bundle into `context/spec/014-ui-ux-audit-v2-improvements/design-handoff/` for reference during the technical spec / implementation phases.

### Out-of-Scope

- **Variants from the audit that were not pinned.** Each finding has 3+ documented alternatives; only the pinned variant is normative. Other variants are not built and not maintained.
- **Calendar / heatmap surface for the journal** (audit Finding #6 V3). Parked for a future Stats / Year-in-Review feature.
- **Filter row on the journal list** (mood / tag / status filters). Mentioned in the audit recommendation for Finding #6 but explicitly not required by 2.6; may be added later, additively.
- **Filter row on the journal list** is also distinct from the spec 011 / spec 008 filtering features and is not implemented here.
- **Bulk library actions, keyboard navigation palette beyond ⌘K, view modes, theme variants, density modes, fallback cover rendering, gaming events calendar, dashboard reflow, logged-out landing page** — all referenced in the roadmap as separate future specs and not part of this spec.
- **First-Time User Onboarding** — covered by spec 013 and not duplicated here.
- **Star ratings (1–10 scale) base behavior** — established by spec 011 and re-used inline by 2.4; not redefined here.
- **Quick-add server action with smart defaults** — established by spec 012 §2.11 and re-used by 2.13; not redefined here.
- **Library card redesign and library page chrome** — established by spec 012 §2.10; the global rail (2.1) wraps the page but does not re-litigate the card.
- **Social / follow controls** — established by spec 008; re-used by 2.7 visitor action.
- **Steam Library integration (Stages 2+), PlayStation, Xbox** — separate roadmap items.
- **New destructive actions in Settings.** The shell (2.10) reserves a Danger Zone but this spec does not implement account deletion or data export.
- **Schema changes.** No new database fields are introduced. Existing `User`, `LibraryItem`, `Game`, `JournalEntry`, and platform tables provide the data; behavior changes are presentation-layer plus existing server actions.
- **All other roadmap items** (Upcoming Releases Widget, YTD Stats, Pick Up Where You Left Off, Year-in-Review, Bulk Library Actions, Keyboard Navigation Palette, Bento Dashboard, Gaming Events Calendar, Library View Modes, Game Detail Redesign beyond 2.3/2.4, Theme Variants, Logged-Out Landing) — out of scope; tracked separately on the roadmap.

---

## Appendix A — Source Materials

The following design handoff bundle is archived under `context/spec/014-ui-ux-audit-v2-improvements/design-handoff/` and is the primary reference during the technical spec and implementation phases:

- `design-handoff/README.md` — handoff instructions for coding agents.
- `design-handoff/chats/chat1.md` — V1 audit conversation transcript (background).
- `design-handoff/chats/chat2.md` — V2 audit conversation transcript and pinned-decision rationale.
- `design-handoff/project/UI-UX-Audit-V2.html` — primary spec document (the file the user had open at handoff). Lists all 12 findings with severity, area, impact, recommendation, pinned decision, and a side-by-side design canvas.
- `design-handoff/project/audit-v2/audit-app.jsx` — finding metadata (severity, area, pinned variant) — the canonical machine-readable list.
- `design-handoff/project/audit-v2/mockups-detail.jsx` — game detail variants (2.3, 2.4).
- `design-handoff/project/audit-v2/mockups-journal.jsx` — journal list and detail variants (2.5, 2.6, 2.11).
- `design-handoff/project/audit-v2/mockups-profile.jsx` — profile header, sub-tabs, auth, settings variants (2.7, 2.8, 2.9, 2.10).
- `design-handoff/project/audit-v2/mockups-nav.jsx` — desktop nav and mobile nav variants (2.1, 2.2).
- `design-handoff/project/audit-v2/mockups-misc.jsx` — chips and type scale variants (2.11, 2.12).
- `design-handoff/project/Library-Card-Complete-Spec.html`, `Library-Card-Redesign.html`, `Card-Sizing-Study.html`, `Quick-Add-Flow-Redesign.html`, `UI-UX-Audit.html` — V1 audit and library-card materials, retained for cross-reference; primarily covered by spec 012 already.
- `design-handoff/project/components/`, `config/` — copies of source components from the V1 / V2 audit context; non-normative for technology choice — re-implement using the project's React 19 / Next.js 16 / shadcn/ui / Tailwind stack.

---

## Appendix B — Cross-Spec Dependencies

This spec depends on or re-uses behavior established elsewhere:

- **Spec 008 (Social Engagement)** — Follow / Unfollow control re-used by 2.7 (visitor action on profile header).
- **Spec 011 (Star Ratings)** — 1–10 stars control re-used by 2.4 (inline rating on game detail).
- **Spec 012 §2.6 (Library hero search)** — `/` keyboard shortcut for the library page-scoped search; this spec preserves it and reserves `⌘K` exclusively for the global palette (2.13).
- **Spec 012 §2.10 (Library card)** — Card behavior preserved; the global rail (2.1) wraps the page without changing the card.
- **Spec 012 §2.11 (Quick add with smart defaults)** — Server action re-used by 2.13 for "Add game to library" results; behavior, smart defaults, and undo toast are inherited unchanged.
- **Spec 013 (First-Time User Onboarding)** — Onboarding tour is independent; this spec does not modify onboarding flows.

---

## Appendix C — Data Model Touchpoints

UI changes reference the following existing fields; **no schema change is introduced by this spec**:

- `LibraryItem.status` — segmented control writes (2.4); preserved by 2.13 quick-add.
- `LibraryItem.rating` — inline stars on game detail (2.4); range and write semantics inherited from spec 011.
- `LibraryItem.startedAt`, `createdAt`, `updatedAt`, `actualPlaytime`, `platformId`, `acquisitionType`, `hasBeenPlayed` — referenced by surrounding specs (012); not redefined here.
- `JournalEntry` (title, body, mood, tags, gameId, createdAt, duration) — used by 2.5 (editorial header), 2.6 (grouping by `gameId`), 2.11 (mood as eyebrow, tags as chips). The auto-derived title in 2.5 is render-only; the persisted `title` field is not changed when absent.
- `User` (display name, handle, avatar, banner, email, visibility) — used by 2.7. Email is filtered at the public-profile boundary; banner support may already exist in schema (verify in technical spec).
- IGDB game records — used by 2.13 quick-add to derive the smart-default `platformId`, inherited from spec 012 §2.11.
