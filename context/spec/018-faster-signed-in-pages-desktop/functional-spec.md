# Functional Specification: Faster Signed-In Pages on Desktop

- **Roadmap Item:** Quality regression — desktop performance on signed-in pages (not previously on the roadmap)
- **Status:** Draft
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

SavePoint exists to help patient gamers curate libraries and journal experiences. The Dashboard and Library are the two surfaces a returning user sees most often — every session starts on one of them.

Real-user measurements over the past week show that **desktop visitors wait 4–6 seconds before they see anything appear** on Dashboard and Library. By the standards reported in our measurement tool, less than three out of every four desktop visits are scoring a "great" experience on these pages. Mobile users, by contrast, already see content within about 1.5 seconds and are scoring "great."

This gap matters because:

- A patient gamer opening SavePoint to "see what I should play tonight" should feel the app respond instantly — not stare at a blank screen long enough to wonder if it's broken.
- The product promise is a curated, intentional library; a sluggish entry point undermines that feeling on the first impression of every session.
- Mobile and desktop visitors should get a comparable experience.

**Success measure:** The desktop Real Experience Score for every signed-in page reaches and sustains the "Great" tier (above 90) for seven consecutive days. Mobile must stay in the "Great" tier — no regression.

---

## 2. Functional Requirements (The "What")

### 2.1 The page shell appears immediately

- **As a** signed-in user, **I want** the page frame (sidebar, header, page title, section placeholders) to appear right after I click a navigation link, **so that** the app feels responsive even when the underlying content is still being prepared.
  - **Acceptance Criteria:**
    - [ ] Given I am signed in on a desktop browser on a typical broadband connection, when I click any item in the left navigation, then within roughly half a second I see the destination page's frame: the left sidebar, the page heading, and grey placeholder shapes where the content will appear.
    - [ ] The previous page does not stay on screen while the next page loads — the frame transition is immediate.
    - [ ] The placeholder shapes match the rough layout of what will appear (e.g., a row of card-shaped placeholders where game cards will load).

### 2.2 Sections fill in independently as their content becomes ready

- **As a** signed-in user, **I want** each section of the page to appear as soon as its own content is ready, **so that** I can start reading or interacting with the parts of the page that loaded first instead of waiting for the slowest section.
  - **Acceptance Criteria:**
    - [ ] On the Dashboard, each section (greeting, getting-started checklist, stats, activity feed, continue playing, up next, recently added) replaces its placeholder independently as it becomes ready.
    - [ ] On the Library, the filters and the game grid replace their placeholders independently.
    - [ ] No section's appearance is gated on a different section's data — the user never sees a fully blank page while one slow section blocks everything else.

### 2.3 A single slow section does not break the page

- **As a** signed-in user, **I want** the rest of the page to remain useful even if one section can't load its data, **so that** a transient hiccup in one widget doesn't make the whole page unusable.
  - **Acceptance Criteria:**
    - [ ] When one section's content fails to load, that section displays a small inline message ("Couldn't load this — Retry") and a Retry control.
    - [ ] All other sections on the same page continue to render their content normally.
    - [ ] Clicking Retry attempts to load only that section again; success replaces the error message with the real content.

### 2.4 Performance target — desktop

- The desktop Real Experience Score reaches "Great" (above 90) on each of the following signed-in pages:
  - **Acceptance Criteria:**
    - [ ] Dashboard scores Great on desktop.
    - [ ] Library scores Great on desktop.
    - [ ] Game detail page scores Great on desktop.
    - [ ] Personal journal scores Great on desktop.
    - [ ] Public profile (own profile view) scores Great on desktop.
    - [ ] Settings (each section) scores Great on desktop.
    - [ ] Steam games (curation page) scores Great on desktop.
    - [ ] All of the above are sustained for seven consecutive days of real-user measurement before the spec is considered Completed.

### 2.5 Performance target — mobile (no regression)

- Mobile experience does not regress from the current "Great" tier.
  - **Acceptance Criteria:**
    - [ ] After the changes ship, the mobile Real Experience Score for Dashboard, Library, and any other page measured on mobile remains at or above 90.
    - [ ] If any mobile page drops below 90 for more than two consecutive days, the change is treated as a regression and rolled back or hot-fixed.

### 2.6 Behavior across devices and connection speeds

- **As a** signed-in user on a slower connection, **I want** the page shell to still appear quickly even if individual sections take longer to fill in, **so that** I always have a sense of progress.
  - **Acceptance Criteria:**
    - [ ] On a throttled connection (simulated "Slow 4G" desktop profile), the page frame and placeholders still appear within roughly one second; section content may take longer but appears progressively rather than all-at-once.

---

## 3. Scope and Boundaries

### In-Scope

- All pages a user sees after signing in, including: Dashboard, Library, personal Journal, Game detail, own Profile / public profile self-view, Settings (all sections), Steam games curation page.
- The visible loading behavior (page frame + section placeholders + progressive fill-in).
- The per-section error and retry behavior.
- The performance targets on desktop, and the no-regression guard on mobile.

### Out-of-Scope

- The signed-out marketing surfaces (login page, root landing) — these already score Great.
- All other roadmap items are out-of-scope for this specification:
  - Per-Playthrough Logs, Reviews, Public Reflections, Game Detail Redesign, Aggregate Game Stats, Bento Dashboard Reflow, Upcoming Releases Widget, YTD Stats Card, Pick Up Where You Left Off, Gaming Events Calendar, Similar Games Discovery, Browse / Catalog, Curated Collections, First-Time User Onboarding, Library View Modes, Bulk Library Actions, Global Quick-Log CTA.
  - Steam Library Stages 2–4, PlayStation, and Xbox integrations.
- Pushing mobile from "Great" toward "Perfect" — mobile is held to no-regression only.
- Changes to information architecture, layout, or which widgets appear on each page — only the *appearance behavior during loading* changes.
- Offline support and behavior when the device has no network.
