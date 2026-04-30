# Functional Specification: Per-Playthrough Logs

- **Roadmap Item:** Per-Playthrough Logs — multiple playthroughs per library entry, each with start/end dates, rating, platform, optional notes; playthrough timeline on game detail; journal/review entries can attach to a specific playthrough.
- **Status:** Draft
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

Today, a game in a user's library has a single status, a single rating, and a flat list of journal entries. When a patient gamer revisits a beloved game years later — a second run of *Hollow Knight* on a new platform, an annual replay of *Dark Souls* — that history collapses into one record. The earlier rating gets overwritten or stays stale, and the two journeys blur into one.

Per-Playthrough Logs make the **journey shape** of a game first-class. A user can record each distinct run of a game as its own entry on a timeline, with its own start/end dates, platform, optional rating, and a short note. This preserves the memory of *when* and *how* they played a game across years, not just *whether* they finished it.

This is also a foundational primitive: future Reviews and community game stats need a notion of "a single completed run" to anchor on. Without it, those features can't distinguish a first impression from a tenth replay.

**Success looks like:**
- Users who replay games record those replays as separate entries.
- The game detail page tells a richer story than "Played, 8/10."
- The data primitive is in place for Reviews and Aggregate Game Stats to consume next.

---

## 2. Functional Requirements (The "What")

### 2.1 The Playthrough

- **As a** user, **I want** each playthrough I record to capture a distinct journey through a game, **so that** I can preserve the history of replays and revisits over time.
  - A playthrough belongs to one game in my library and has these fields:
    - **Start date** — when I began this run.
    - **End date** — when I finished it. Required to mark the playthrough closed; left empty while still in progress.
    - **Platform** — required to save. The list of choices is the platforms that game is available on.
    - **Rating** — optional; a 1–10 star rating for this specific run.
    - **Notes** — optional short caption, up to about 280 characters (one-liner memory like "beat it on a snowy weekend").
  - **Acceptance Criteria:**
    - [ ] I cannot save a playthrough without a platform.
    - [ ] I can save an in-progress playthrough (no end date).
    - [ ] If I try to enter notes longer than 280 characters, I am stopped at the limit and shown the character count.
    - [ ] A single library entry can have multiple in-progress playthroughs at once (e.g., one on PC and one on Switch).

### 2.2 Auto-creation when status becomes "Playing"

- **As a** user, **when I** change a game's library status to "Playing", **I want** a new playthrough to be started silently in the background, **so that** I don't have to manually log it every time.
  - **Acceptance Criteria:**
    - [ ] Setting status to "Playing" creates a new playthrough with today's start date, no end date, no rating.
    - [ ] The platform is copied from my most recent playthrough on this game; if I have none, the platform field is left empty and I can set it later.
    - [ ] No dialog appears — the change is invisible unless I open the playthrough timeline.

### 2.3 Prompt when status becomes "Played"

- **As a** user, **when I** change a game's library status from "Playing" to "Played", **I want** to confirm how this run ended, **so that** the closed playthrough reflects when and where I actually finished it.
  - **Acceptance Criteria:**
    - [ ] A dialog appears titled "Wrap up this playthrough" with: end date (default today, editable), platform (pre-filled from the open playthrough, editable), optional rating, optional note.
    - [ ] If there are multiple in-progress playthroughs on this game, the dialog shows a list of them and lets me pick which one to close (or "all of them"); each picked one gets its own end date.
    - [ ] Confirming closes the chosen playthrough(s) and changes the library status to "Played".
    - [ ] Cancelling the dialog leaves the status unchanged.
    - [ ] If the game has no open playthroughs (status was set to Played without ever being Playing), the dialog still appears and offers to create a closed historical playthrough (see 2.6).

### 2.4 Library card entry point

- **As a** user, **I want** a quick way to add a playthrough straight from a game's card in my library, **so that** I don't have to navigate to the detail page just to log a quick replay.
  - **Acceptance Criteria:**
    - [ ] Each library card has an action (icon or menu item) labelled "Add playthrough".
    - [ ] Clicking it opens the same playthrough form used on the game detail page, in a dialog over the library.
    - [ ] After saving, the dialog closes and the card reflects the new playthrough count without a full page reload.

### 2.5 Game detail timeline

- **As a** user, **I want** to see all my playthroughs of a game on its detail page in a single timeline, **so that** I can revisit the story of my history with that game.
  - **Acceptance Criteria:**
    - [ ] The game detail page shows a "Playthroughs" section with each playthrough as a row.
    - [ ] Order is newest-first: in-progress playthroughs appear at the top, then completed ones in reverse chronological order by end date.
    - [ ] Each row shows: a status indicator (in progress / completed), start date, end date (or "—" if open), platform, rating (if set), and the note (if set).
    - [ ] Each row has actions: edit, delete, and (if open) "End playthrough" which opens the wrap-up dialog from 2.3.
    - [ ] If the user has no playthroughs for this game, the section shows an empty state with an "Add playthrough" button.

### 2.6 Adding a historical playthrough

- **As a** user, **I want** to log a game I finished years ago with both real start and end dates in one go, **so that** my history isn't limited to games I tracked in real time.
  - **Acceptance Criteria:**
    - [ ] The "Add playthrough" form accepts any past start date and any past end date, as long as end date ≥ start date.
    - [ ] After I save a historical (already-closed) playthrough, if my library status for the game isn't already "Played", a follow-up prompt asks: "Mark this game as Played?" with options Yes / No. My answer is applied; either way the playthrough is saved.

### 2.7 Editing and deleting a playthrough

- **As a** user, **I want** to edit or delete any of my playthroughs, **so that** I can correct mistakes or remove an entry I no longer want.
  - **Acceptance Criteria:**
    - [ ] Editing opens the same form pre-filled with current values; saving updates the timeline immediately.
    - [ ] Deleting asks for confirmation: "Delete this playthrough? Any journal entries attached to it will stay on this game and become unattached." Confirming removes the playthrough.
    - [ ] Journal entries previously attached to a deleted playthrough remain visible on the game; they no longer reference that playthrough.

### 2.8 Journal entries can attach to a playthrough

- **As a** user **writing a journal entry**, **I want** to optionally tag it to one of my playthroughs, **so that** my reflections are grounded in a specific run rather than a vague generic memory of the game.
  - **Acceptance Criteria:**
    - [ ] The journal composer shows a "Playthrough (optional)" picker listing this game's playthroughs (newest first), plus a "None" option (the default).
    - [ ] Existing journal entries from before this feature shipped stay unattached and continue to display as before.
    - [ ] On the game detail page, a journal entry attached to a playthrough shows a small label (e.g., "from playthrough #2 — PC, Mar 2024") so the link is visible to the reader.

### 2.9 Rating coexistence

- **As a** user, **I want** my existing library-level rating to remain the canonical "how I feel about this game", **so that** my library, profile, and ratings histogram don't get destabilised by per-run ratings.
  - **Acceptance Criteria:**
    - [ ] The library entry's single 1–10 rating (from Spec 011 Star Ratings) is unchanged in behaviour and is what shows on the library card, on the profile, and in the rating histogram.
    - [ ] A per-playthrough rating, if set, is shown only inside the playthrough timeline row.
    - [ ] Setting or changing a per-playthrough rating never modifies the library-level rating automatically.

### 2.10 Public profile timeline

- **As a** profile visitor, **I want** to see the playthrough history of a user I follow, **so that** I get a sense of how they engage with games over time, not just a static library.
  - **Acceptance Criteria:**
    - [ ] On `/u/[username]`, a "Playthroughs" timeline section shows the user's recent playthroughs (newest first).
    - [ ] Each entry shows: the game (cover + title, linking to its detail page), start date, end date (or "in progress"), platform, rating (if set), and the note if any.
    - [ ] Visitors see only what the profile owner has chosen to share. The owner can toggle the Playthroughs section visibility (public / followers / private) in their profile settings; default is public.
    - [ ] If a user has no playthroughs to display, the section is hidden from visitors entirely.

---

## 3. Scope and Boundaries

### In-Scope

- Multiple playthroughs per library entry, each with start date, end date, platform (required), optional rating, optional short note (≤280 chars).
- Auto-create on status → "Playing"; wrap-up prompt on status → "Played".
- "Add playthrough" entry points on the game detail page and on each library card.
- Playthrough timeline on the game detail page (newest first; in-progress pinned).
- Adding fully historical playthroughs with both dates in the past, with optional follow-up to mark game as Played.
- Editing and deleting playthroughs; deleting detaches (does not delete) attached journal entries.
- Optional attachment of new journal entries to a playthrough.
- Public profile playthrough timeline with per-section visibility setting (default public).

### Out-of-Scope

- **Reviews** *(separate roadmap item — depends on this spec)*.
- **Aggregate Game Stats** *(separate roadmap item — depends on Reviews)*.
- **Game Detail Redesign** *(separate roadmap item)* — this spec adds a Playthroughs section to the existing detail page; the broader hero/columns redesign is later.
- **Public Reflections, Bento Dashboard Reflow, Upcoming Releases Widget, YTD Stats Card, Pick Up Where You Left Off, Gaming Events Calendar, Similar Games Discovery, Browse / Catalog, Curated Collections, First-Time User Onboarding, Library View Modes, Bulk Library Actions, Global Quick-Log CTA** — separate roadmap items.
- **Steam / PSN / Xbox library imports producing playthroughs** — Phase 3.
- **Bulk playthrough operations** (multi-select edit/delete across many playthroughs) — explicitly excluded from this spec.
- **Playtime / hours tracking** — no "hours played" field on a playthrough in this spec.
- **Changing how the library-level rating is computed** — Spec 011's library rating remains the canonical surfaced rating.
