# Functional Specification: Enriched Game Detail Page

- **Roadmap Item:** Game Detail — enrichment pass (surface information the app already has; ships independently of the fuller "Game Detail Redesign", which adds reviews, community stats, and a playthrough timeline)
- **Status:** Completed
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

### Context

A game's detail page is the most data-rich screen in SavePoint, yet today it shows only a small slice of what we know about a game: a short summary, the release year, genres, and platforms. Everything else — the critic score, screenshots, themes, the publisher, and how this game relates to others — is either hidden behind secondary tabs or never shown at all. A patient gamer who opens a game they love sees a page that feels emptier than the game deserves.

At the same time, the things that make SavePoint *personal* — your status, your rating, your time with the game, and your written reflections — are scattered around the page rather than presented as a coherent "your history with this world."

### The problem we're solving

When a patient gamer opens a game's page, they should immediately get a satisfying, complete picture — both of the game itself and of their own relationship to it — without hunting through tabs or feeling like the page is a stub. The page should also act gracefully when a game has very little information available, which is common for older or niche titles, rather than showing broken or empty boxes.

### Desired outcome

A single, richer game detail page that:

- Brings forward the information we already have about a game into one well-organized layout.
- Gathers the personal layer (your status, rating, time, and journal) into a clear "your record" area, and lets you change your status and add a reflection without leaving the page.
- Stays calm and tasteful — never cluttered — and adapts cleanly when information is missing, hiding empty areas rather than padding them with placeholders.
- Works equally well on desktop and on a phone.

### Guiding design principle

One visual rule runs through the whole page: **the accent color always means "you."** Your status, your time, your rating, and your reflections are accented; facts about the game itself (critic score, themes, release info) stay neutral; platform names keep their own recognizable platform colors. This lets a user tell at a glance what is *theirs* versus what is *the catalog's*.

### How we'll measure success

- Users open and stay on game detail pages more, and reach the "add a reflection" action more often from this page.
- Users change a game's status directly from its detail page rather than going elsewhere.
- Pages for sparse, little-known games still look intentional and complete, with no empty or broken sections reported.

---

## 2. Functional Requirements (The "What")

The page is organized as a **hero** (top), an optional **screenshot strip**, and a set of **information panels** below. Panels only appear when they have something to show. The following requirements describe each area.

### 2.1 Hero

- **As a** user, **I want** the top of the page to show the game's cover, key facts, my current status, and the critic score at a glance, **so that** I immediately understand both the game and where I stand with it.
  - **Acceptance Criteria:**
    - [x] The hero shows the game's cover art. When no cover art is available, a colored placeholder with the game's initials is shown instead (never a broken image).
    - [x] The hero shows the game's title.
    - [x] Above the title, a single line shows the release year, the publisher, and the primary genre, separated by small dots. Any of these three that are unknown are simply omitted from the line; if all three are unknown, the line does not appear.
    - [x] A **critic score** is shown as a circular score indicator with the numeric score. If no critic score is available for the game, the indicator does not appear at all.
    - [x] A soft, faded backdrop sits behind the hero. When the game has screenshots, the backdrop is drawn from the game's own art. When it has none, the backdrop falls back to a gentle accent-colored wash. The backdrop never obscures the title or controls.

### 2.2 Status control (change status in place)

- **As a** user who has this game in my library, **I want to** change my status for the game directly on its page, **so that** I don't have to open a separate screen to update where I am with it.
  - **Acceptance Criteria:**
    - [x] The hero shows a **status pill** displaying my current status (Wishlist, Shelf, Up Next, Playing, or Played), tinted with that status's color and showing its icon.
    - [x] On desktop, clicking the pill opens a small menu anchored to it, listing all statuses, each with its icon; my current status is checked. Clicking elsewhere closes the menu without changing anything.
    - [x] On a phone, tapping the pill slides up a sheet from the bottom listing the same statuses; my current status is checked.
    - [x] Choosing a status updates the pill immediately and closes the menu/sheet. The change is remembered when I return to the page later.
    - [x] When "Up Next" applies to a game I have already played, it is labeled "Replay" (matching the rest of the app).
    - [x] If the game is **not yet in my library** (or I am not signed in), the pill is replaced by an **"Add to library"** action; using it adds the game (signed-in users) or prompts me to sign in.

### 2.3 Your Record

- **As a** user, **I want** a single panel that summarizes my history with the game — my time, how many times I've sat down with it, and my rating — with a quick way to log a new session, **so that** my personal relationship with the game is front and center.
  - **Acceptance Criteria:**
    - [x] The panel shows my **playtime** for the game, totaled from the time I've recorded across my logged sessions. When I haven't recorded any time, the playtime figure is omitted rather than shown as zero or a dash.
    - [x] The panel shows a **sessions** count, defined as the number of journal entries I have written for this game.
    - [x] The panel shows **my rating** as interactive stars. Clicking a star sets my rating; clicking the same level again clears it. When unrated, the stars show a subtle "Rate it" prompt. The chosen rating is remembered.
    - [x] The panel includes a **"Log a session"** action. Using it opens a quick reflection composer (a dialog on desktop, a bottom sheet on phone) with an **optional "time played" field** and an optional text field for what happened.
    - [x] Saving from the composer adds a new journal entry for this game; the new entry appears at the top of the Journal panel, the sessions count goes up by one, my total playtime increases by the time I entered (if any), and the composer closes. Saving with both fields left empty still records the session.
    - [x] Closing or cancelling the composer makes no change.

> Note: "Log a session" records a journal entry. The optional time captured on a session is what feeds my total playtime and the "Your Pace" view; the app does not pull playtime from any other source in this feature.

### 2.4 Times to Beat (with Your Pace fallback)

- **As a** user, **I want** to see how my own time with the game compares to how long the game typically takes, **so that** my progress is given meaning — and when no such comparison exists, to still see my own rhythm rather than an empty box.
  - **Acceptance Criteria:**
    - [x] **When the game has community "time to beat" estimates:** the panel plots my own logged hours against the **main-story** and **100% (completionist)** benchmarks on a single line, clearly marking where I am, with a short sentence putting it in context (for example, "you're a few hours past the main story, with the long road to 100% still ahead"). My marker uses the accent color (it's *me*); the benchmarks are neutral (they're catalog facts).
    - [x] If only one of the two benchmarks is available, the panel shows the one it has and omits the missing one rather than guessing.
    - [x] **When the game has no time-to-beat estimates:** the panel falls back to **"Your Pace"** — a summary built only from my own data: my number of sessions, my total logged time, a simple average per session, and a small visual of my recent per-session times.
    - [x] In both modes, the panel never fabricates a benchmark or shows an empty comparison.

### 2.5 Screenshots

- **As a** user, **I want to** browse the game's screenshots and view them full screen, **so that** I can enjoy and revisit the game's visuals.
  - **Acceptance Criteria:**
    - [x] When the game has screenshots, they appear as a strip — a row of thumbnails on desktop, a horizontally scrollable rail on phone.
    - [x] Clicking/tapping a screenshot opens it full screen.
    - [x] In the full-screen view I can move to the next/previous screenshot and see a row of thumbnails for jumping between them; on desktop the left/right arrow keys also move between screenshots and Escape closes the view.
    - [x] When the game has no screenshots, the entire screenshot strip is omitted (and the hero backdrop falls back to the accent wash, per 2.1).

### 2.6 About

- **As a** user, **I want** a concise "About" panel with the game's description and key facts, **so that** I can remind myself what the game is and who made it.
  - **Acceptance Criteria:**
    - [x] The panel shows the game's summary/description when available.
    - [x] The panel shows the release year, the developer, and the publisher, each omitted individually when unknown.
    - [x] If none of the above (summary, release year, developer, publisher) is available, the entire About panel is omitted.

### 2.7 Themes & Tags

- **As a** user, **I want** the game's themes, genres, and platforms shown together as tags, **so that** I can quickly characterize the game.
  - **Acceptance Criteria:**
    - [x] Themes, genres, and platforms are each shown as a row of tags.
    - [x] Platform tags use their recognizable platform colors; themes and genres use neutral styling.
    - [x] Any row whose information is missing is omitted. If all three are missing, the entire panel is omitted.

### 2.8 Journal

- **As a** user, **I want** my most recent reflection on this game surfaced with a clear way to add another, **so that** my memories of the game are part of its page.
  - **Acceptance Criteria:**
    - [x] The panel shows my latest journal entry for the game (its date, which session it was, and a few lines of the reflection), plus a count of how many entries I have for the game.
    - [x] The panel includes a "New entry" action that opens the same quick reflection composer as "Log a session" (2.3).
    - [x] When I have no entries for the game yet, the panel invites me to write my first one.

### 2.9 Related games

- **As a** user, **I want to** see games related to this one (such as others in the same series or franchise), **so that** I can discover what to explore next.
  - **Acceptance Criteria:**
    - [x] When related games exist, they appear as a row of covers with titles and years, leading to those games' pages.
    - [x] When there are no related games, the entire panel is omitted.

### 2.10 Graceful behavior when information is missing

- **As a** user looking at a sparse, little-known game, **I want** the page to still feel intentional and complete, **so that** it never looks broken or padded with empty boxes.
  - **Acceptance Criteria:**
    - [x] **Hide, never placeholder:** no panel ever shows an empty "—" value or fabricated text/scores. A piece of information that is missing is simply not rendered.
    - [x] **Collapse a whole panel only when all of its information is missing** (for example, About disappears only when summary, release year, developer, and publisher are all unknown).
    - [x] **Substitute personal for catalog:** where catalog information is missing, the page leans on the user's own data instead (the "Your Pace" panel standing in for external estimates is the canonical example).
    - [x] **The worst case still works:** when a game has only a title and is in my library, the page renders a clean minimal hero (placeholder cover, title, status pill, accent-wash backdrop) plus only the personal panels that have data (Your Record, Your Pace, Journal). This matches the empty-state artboard in the handoff bundle.
    - [x] As catalog information thins out and fewer panels remain, the layout relaxes toward a calmer single-column arrangement rather than leaving large gaps in a dense grid.

### 2.11 Responsive layout and light/dark

- **As a** user on any device, **I want** the page to be comfortable to read and use, **so that** it works whether I'm on my laptop or my phone.
  - **Acceptance Criteria:**
    - [x] On desktop, the panels are arranged in a multi-column grid within the app's normal layout.
    - [x] On a phone, the content stacks in a single column, the screenshot strip becomes a horizontal rail, and the status control uses the bottom sheet (2.2).
    - [x] The page reads correctly in both light and dark appearances, with the accent color consistently marking the "you" elements in both.

---

## 3. Scope and Boundaries

### In-Scope

- A single enriched game detail page that surfaces information **already available** to the app: cover, title, release year, publisher, primary/secondary genres, critic score, screenshots (with full-screen viewer), themes, developer/publisher, and related/franchise games.
- A consolidated **Your Record** area (total logged playtime, sessions as journal-entry count, interactive star rating) with an in-place **status switcher** (popover on desktop, bottom sheet on phone) covering the five existing statuses.
- **"Log a session"** as a fast way to add a journal entry with an **optional time-played value** and optional reflection, wired so it updates the Journal panel, the sessions count, and total playtime.
- A **Times to Beat** comparison (the user's hours against main-story / 100% benchmarks) that **falls back to a personal "Your Pace"** view when the game has no benchmark.
- **Graceful degradation** behavior (hide-never-placeholder, collapse-when-all-absent, substitute-personal-for-catalog, relax-toward-single-column), including the title-only worst case.
- Basic handling for **not-in-library / signed-out** viewers (status pill becomes "Add to library"; personal panels give way to an invitation to add the game).
- Full **light and dark** support and **desktop + mobile** responsiveness.

### Out-of-Scope

- **Per-game visual theming / the "Crystal Command" dialect** (game-flavored accents, command-window menus, segmented gauges). This is a separate theming concern related to the unified design-system work.
- **Reviews** (public, short-form rated takes) and any review feed on the page.
- **Community / aggregate stats** (how many people are playing/played, average community rating, average completion time, review counts).
- **Playthrough timeline** and anything depending on multiple playthroughs per game.
- The richer, fully-designed **catalog/not-in-library mode** beyond the basic "Add to library" behavior described above (can be refined in a later pass).

### Out-of-Scope — separate roadmap items

The following are unrelated roadmap items, automatically out of scope for this specification: Per-Playthrough Logs, Reviews, Public Reflections, the full Game Detail Redesign, Aggregate Game Stats, Bento Dashboard Reflow, Upcoming Releases Widget, YTD Stats Card, Pick Up Where You Left Off, Gaming Events Calendar, Similar Games Discovery, Browse / Catalog, Curated Collections, First-Time User Onboarding, Library View Modes, Bulk Library Actions, Global Quick-Log CTA, and all Phase 3+ platform integrations.
