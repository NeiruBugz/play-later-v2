# Functional Specification: Per-Playthrough Logs

- **Roadmap Item:** Per-Playthrough Logs — multiple playthroughs per library entry, each with start/end dates, rating, platform, optional notes; playthrough timeline on game detail; journal/review entries can attach to a specific playthrough.
- **Status:** Completed
- **Author:** Nail Badiullin

> **Supersedes the earlier May 2026 draft of this spec.** This version reflects the
> high-fidelity claude.ai/design handoff (`design_handoff_per_playthrough_logs`) and
> the post-migration app (TanStack Start, unified design system). The biggest change
> versus the old draft: a game's library status is now **derived from its runs** rather
> than set by hand, and each run now carries **playtime** and a **completion note**.

---

## 1. Overview and Rationale (The "Why")

Today, a game in a user's library has a single status, a single playtime total, a single
rating, and a flat list of journal entries — one record called "Your Record." When a
patient gamer revisits a beloved game years later (a second run of *Hollow Knight* on a
new platform, an annual replay of *Dark Souls*), that history collapses into one record.
The earlier playthrough's rating, hours, and platform get overwritten or blur into the
latest run.

Per-Playthrough Logs make the **journey shape** of a game first-class. A user records each
distinct run of a game as its own entry on a timeline, with its own platform, start/end
dates, run state (Playing / Finished / Abandoned), hours played, optional completion note
("Platinum", "100%", "Story"), optional rating, and free-text notes. The game-detail page
gains a **playthrough timeline** with a summary band across all runs, and the game's
**library status follows the runs automatically** instead of being a separate thing the
user has to keep in sync.

This is also a foundational primitive: future **Reviews** anchor on a single run, and
future **Aggregate Game Stats** roll totals up across runs. Without it, those features
can't tell a first impression apart from a tenth replay.

**Success looks like:**
- Users who replay games record those replays as separate runs on a timeline.
- A game's library status reflects reality (what runs exist) without manual upkeep.
- The game-detail page tells a richer story than "Played · 40h · 8/10."
- The data primitive is in place for Reviews and Aggregate Game Stats to consume next.

---

## 2. Functional Requirements (The "What")

### 2.1 What a playthrough is

- **As a** user, **I want** each playthrough I record to capture a distinct journey
  through a game, **so that** I can preserve the history of replays and revisits over time.
  - A playthrough belongs to one game in my library and captures:
    - **Run type** — *First playthrough* or *Replay*. My first recorded run is the
      "First playthrough"; every later run defaults to "Replay."
    - **Platform** — which system I played this run on (e.g., PS5, PS4, PC, Xbox, Switch).
    - **Run state** — *Playing*, *Finished*, or *Abandoned*.
    - **Started / Finished dates** — when this run began and ended. The finished date is
      empty (and shows "in progress") while the run state is *Playing*.
    - **Hours played** — how long I spent on this run.
    - **Completion note** — an optional short label for how I left it: "Platinum",
      "100%", "Story", etc.
    - **Rating** — optional; a half-star rating for this specific run (shown 0–5 stars).
    - **Notes** — optional free-text reflection on the run.
  - **Acceptance Criteria:**
    - [x] When I record my first run for a game, it is labelled "First playthrough"; any
          run I add afterward defaults to "Replay."
    - [x] A run set to *Playing* shows "in progress" instead of a finished date, and its
          finished-date field is unavailable until I move it off *Playing*.
    - [x] A run can be saved with hours played of zero (e.g., I just started).
    - [x] The completion note and rating are optional — a run saves without them.
    - [x] A single game can have more than one run at the same time (e.g., one *Playing*
          on PC and one *Playing* on Switch).

### 2.2 Recording a new playthrough

- **As a** user, **I want** to add a new playthrough from a side panel on the game-detail
  page, **so that** I can log a fresh run or a historical one without leaving the page.
  - The "New playthrough" panel slides in from the right and contains, top to bottom: a
    preview chip showing the run marker, its computed label, and the game title; **Run
    type** (First playthrough / Replay; defaults to Replay once a first playthrough
    exists); **Platform**; **Run state** (Playing / Finished / Abandoned); **Started** and
    **Finished** dates; **Hours played**; **Completion note**; **Rating**; **Notes**.
  - **Acceptance Criteria:**
    - [x] A "New playthrough" button appears in the Playthroughs section header.
    - [x] Clicking it opens the panel from the right; pressing Esc or clicking the dimmed
          background closes it without saving.
    - [x] If a first playthrough already exists, the Run type defaults to "Replay."
    - [x] When Run state is *Playing*, the Finished date is unavailable and shows a "Still
          playing" hint.
    - [x] Saving adds the run to the top of the timeline (newest first) and closes the
          panel without a full page reload.
    - [x] The game's library status updates to reflect the new run (see 2.8).

### 2.3 The playthrough timeline

- **As a** user, **I want** to see all my runs of a game on its detail page as a single
  vertical timeline, **so that** I can revisit the story of my history with that game.
  - The timeline lists runs **newest first**. Each run shows a **marker** (the Save-Glow
    diamond, tinted by run state) on a connecting spine, then its content:
    - **Header:** the run label ("First playthrough" / "Replay") on the left; the run's
      rating (read-only stars) and a run-state badge on the right.
    - **Details line:** platform · started → finished dates (or "in progress") · hours
      played · completion note (each shown only when present).
    - **Notes:** the run's free-text reflection, when present.
    - **Run journal:** the journal entries logged against this run (see 2.10), with a
      "Log session" action.
    - **Edit** action.
  - At the end of the timeline, an **"Start a new playthrough"** row opens the same panel
    as the "New playthrough" button.
  - **Acceptance Criteria:**
    - [x] The game-detail page shows a "Playthroughs" section in place of the former
          single "Your Record" panel.
    - [x] Runs are ordered newest first.
    - [x] Each run's marker colour reflects its state: Playing, Finished, or Abandoned.
    - [x] A run with no finished date shows "in progress" rather than a blank or "—".
    - [x] An "Edit" action on each run opens the edit panel (see 2.6).
    - [x] The trailing "Start a new playthrough" row opens the new-playthrough panel.

### 2.4 The summary band

- **As a** user, **I want** a one-line summary across all my runs of a game, **so that**
  I can see my totals at a glance without adding them up myself.
  - Above the timeline, a band shows four figures:
    - **Playtime** — total hours across all runs.
    - **Playthroughs** — how many runs I have recorded.
    - **Best rating** — the highest rating I gave any run (read-only stars).
    - **Completion** — a badge showing my best completion note ("Platinum" preferred if
      present, otherwise the first completion note I recorded). Shown only if at least one
      run has a completion note.
  - **Acceptance Criteria:**
    - [x] Playtime equals the sum of hours across all runs.
    - [x] Playthroughs equals the count of runs.
    - [x] Best rating shows the highest run rating; if no run is rated, it shows no stars.
    - [x] The Completion badge is hidden when no run has a completion note, and prefers
          "Platinum" when more than one note exists.
    - [x] Adding or editing a run updates these figures without a full page reload.

### 2.5 Logging a session against a run

- **As a** user, **I want** to log a play session against a specific run — adding hours
  and optionally a thought — **so that** my playtime and reflections stay attached to the
  right journey.
  - The "Log session" panel slides in from the right and contains: a **run picker** (a
    list of this game's runs, preselected to the run whose "Log session" I clicked, each
    showing its marker, label, and platform/date), a **date** (defaults to today), **hours
    played** for this session, and an optional **thoughts** field.
  - **Acceptance Criteria:**
    - [x] The thoughts field is clearly optional — helper text states that logging playtime
          alone is a complete entry.
    - [x] The run picker is preselected to the run I logged from, and I can switch it to a
          different run of the same game.
    - [x] Saving adds the session's hours to the chosen run's total and adds the entry to
          the top of that run's journal, then closes the panel without a full reload.
    - [x] If I leave thoughts empty, the session still saves (a playtime-only entry).

### 2.6 Editing a playthrough

- **As a** user, **I want** to edit any of my runs, **so that** I can correct a platform,
  date, rating, hours, or note.
  - **Acceptance Criteria:**
    - [x] "Edit" opens the same panel as "New playthrough", pre-filled with the run's
          current values and titled "Edit playthrough."
    - [x] Saving updates the run in the timeline and recomputes the summary band and the
          library status immediately.
    - [x] Changing a run's state (e.g., Playing → Finished) updates its marker colour and
          may change the derived library status (see 2.8).

### 2.7 Deleting a playthrough

- **As a** user, **I want** to delete a run I no longer want, **so that** I can remove a
  mistake without losing the reflections I wrote.
  - **Acceptance Criteria:**
    - [x] Deleting asks for confirmation and warns that any journal entries logged against
          this run will stay on the game but become unattached to a run.
    - [x] After deletion, those journal entries remain visible on the game and in the
          journal feed; they simply no longer show a run label.
    - [x] Deleting a run recomputes the summary band and the library status.

### 2.8 Library status follows the runs

- **As a** user, **I want** a game's library status to reflect the runs I've recorded,
  **so that** I don't have to keep a separate status in sync with reality.
  - With no runs yet, the status is whatever I set by hand (Wishlist / On the Shelf /
    Up Next). Once runs exist, the status **follows the runs**:
    - Any run *Playing* → the game is **Playing**.
    - Otherwise, any run *Finished* → the game is **Played**.
    - Otherwise (only *Abandoned* runs) → the game is **Played** — I experienced it.
  - When the status is following the runs, the header shows a **read-only status pill**
    with a "Follows your playthroughs" caption — there is no status menu.
  - **Acceptance Criteria:**
    - [x] With no runs, the header status control is the normal manual menu (Wishlist /
          On the Shelf / Up Next, and "Add to library" when not yet added).
    - [x] Adding a *Playing* run flips the header to "Playing."
    - [x] Marking the last active run *Finished* (or *Abandoned*) rolls the game up to
          "Played."
    - [x] A game whose only runs are *Abandoned* shows "Played."
    - [x] Once the game has been finished or abandoned at least once, the "Up Next" choice
          in the manual menu reads **"Replay"** instead of "Up Next."
    - [x] While following the runs, the status pill is read-only and captioned "Follows
          your playthroughs."

### 2.9 Setting the status manually (override)

- **As a** user, **I want** to be able to set a game's status by hand even when it has
  runs, **so that** I can correct an edge case where the automatic status doesn't match
  what I mean — and have my choice stick.
  - The "follows your playthroughs" pill offers a **"Set manually"** action. Choosing it
    lets me pick any status; from then on the pill shows my chosen status with a **"Set
    manually"** caption and a **"Follow my playthroughs"** action to switch back.
  - A manual status **persists** — adding, editing, or finishing runs does **not**
    silently overwrite it. The timeline always shows the true state of each run regardless
    of the manually-set library status.
  - **Acceptance Criteria:**
    - [x] From the read-only pill, "Set manually" lets me choose any library status.
    - [x] After setting manually, the pill shows my chosen status and a "Set manually"
          caption, not "Follows your playthroughs."
    - [x] Adding or changing a run while in manual mode does not change the displayed
          status — my manual choice holds.
    - [x] A "Follow my playthroughs" action returns the game to the derived status (2.8),
          and the caption returns to "Follows your playthroughs."

### 2.10 Journal entries belong to runs

- **As a** user, **I want** my journal entries to live under the specific run they belong
  to, **so that** my reflections are grounded in a particular journey instead of a vague
  memory of the game.
  - Each run on the timeline shows its own **run journal**: a "JOURNAL · N" label, a "Log
    session" action, and the entries logged against that run (each showing date · hours ·
    the reflection in italics).
  - Below the page's two-column layout, a **full-width Journal feed** mirrors every entry
    across the game's runs, newest first, each showing its date, the run it belongs to,
    its hours, and the reflection.
  - **Acceptance Criteria:**
    - [x] An entry logged via "Log session" appears both under its run and in the
          full-width feed.
    - [x] Each entry in the full-width feed shows which run it belongs to (e.g., "First
          playthrough" / "Replay").
    - [x] Journal entries written before this feature shipped stay valid and display
          without a run label (they are not attached to any run).
    - [x] The full-width Journal feed is hidden when the game has no runs (empty state).

### 2.11 Empty state (no runs yet)

- **As a** user looking at a game I haven't played, **I want** a clear invitation to log
  my first run, **so that** I understand what the Playthroughs section is for.
  - **Acceptance Criteria:**
    - [x] When a game has no runs, the Playthroughs section shows a faded marker, a "No
          playthroughs yet" heading, encouraging copy, and a "Log your first playthrough"
          button.
    - [x] In this state the header status control is the manual menu (2.8), and the
          full-width Journal feed is hidden.

### 2.12 Rating coexistence

- **As a** user, **I want** my existing library-level rating to stay the canonical "how I
  feel about this game," **so that** my library card, profile, and ratings histogram are
  not destabilised by per-run ratings.
  - **Acceptance Criteria:**
    - [x] The library entry's single rating (from Spec 011 Star Ratings) is unchanged in
          behaviour and is what shows on the library card, the profile, and the histogram.
    - [x] A per-run rating, when set, appears only inside the playthrough timeline (on its
          run and as the "Best rating" in the summary band).
    - [x] Setting or changing a per-run rating never changes the library-level rating.

### 2.13 Library-card quick-add

- **As a** user, **I want** to add a playthrough straight from a game's card in my
  library, **so that** I don't have to open the detail page just to log a quick run.
  - **Acceptance Criteria:**
    - [x] Each library card offers an "Add playthrough" action (icon or menu item).
    - [x] Clicking it opens the same new-playthrough panel used on the detail page, over
          the library.
    - [x] After saving, the panel closes and the card reflects the change (status and/or
          run count) without a full page reload.

### 2.14 Public-profile playthrough timeline

- **As a** profile visitor, **I want** to see a user's recent playthroughs on their
  profile, **so that** I get a sense of how they engage with games over time, not just a
  static library.
  - **Acceptance Criteria:**
    - [x] On `/u/[username]`, a "Playthroughs" section shows the user's recent runs,
          newest first.
    - [x] Each entry shows the game (cover + title, linking to its detail page), platform,
          started → finished dates (or "in progress"), rating if set, and the note if any.
    - [x] The Playthroughs section is visible to visitors only when the profile owner's
          profile is public; on a private profile it is hidden. (Visibility follows the
          existing public-profile setting — there is no separate per-section or
          "followers-only" tier in this spec.)
    - [x] When a user has no runs to display, the section is hidden from visitors entirely.

### 2.15 Recording a historical playthrough

- **As a** user, **I want** to log a game I finished years ago with real past start and end
  dates in one go, **so that** my history isn't limited to games I tracked in real time.
  - **Acceptance Criteria:**
    - [x] The new-playthrough panel accepts any past started date and any past finished
          date, as long as the finished date is on or after the started date.
    - [x] Saving a *Finished* historical run rolls the game up to "Played" per the derived
          status rule (2.8), unless the user has set the status manually (2.9).

---

## 3. Scope and Boundaries

### In-Scope

- Multiple playthroughs per library entry, each with run type (First / Replay), platform,
  run state (Playing / Finished / Abandoned), started/finished dates, hours played,
  optional completion note, optional rating, and free-text notes.
- A playthrough timeline on the game-detail page (newest first; markers tinted by run
  state; spine layout) with a summary band (Playtime · Playthroughs · Best rating ·
  Completion).
- Adding, editing, and deleting playthroughs via a right-hand panel; deleting detaches
  (does not delete) attached journal entries.
- "Log a session" against a specific run — adds hours to that run and creates a journal
  entry tied to it; thoughts optional.
- Per-run journal under each timeline run, plus a full-width run-aware Journal feed below
  the page layout.
- Library status **derived from runs** (with the Abandoned-only → Played rule), shown as a
  read-only "Follows your playthroughs" pill once runs exist; **manual override that
  sticks** until the user chooses to follow the runs again.
- Empty state inviting the first run; manual status menu only before any run exists.
- Existing library-level rating remains canonical for the card, profile, and histogram.
- Library-card "Add playthrough" quick-add entry point.
- Public-profile playthrough timeline, shown only on public profiles (follows the
  existing public-profile setting; no separate followers tier).
- Recording fully historical runs with past start and end dates.

### Out-of-Scope

- **Reviews** *(separate roadmap item — depends on this spec)*.
- **Aggregate Game Stats** *(separate roadmap item — depends on Reviews)*. The summary
  band here is per-user only; community totals are out of scope.
- **Game Detail Redesign** *(separate roadmap item)* — this spec replaces the single
  "Your Record" panel with the Playthroughs section and adds the full-width Journal feed;
  the broader community-stats / reviews-feed redesign is later.
- **Public Reflections, Bento Dashboard Reflow, Upcoming Releases Widget, YTD Stats Card,
  Pick Up Where You Left Off, Gaming Events Calendar, Similar Games Discovery, Browse /
  Catalog, Curated Collections, First-Time User Onboarding, Library View Modes, Bulk
  Library Actions, Global Quick-Log CTA** — separate roadmap items.
- **Steam / PSN / Xbox library imports producing playthroughs** — Phase 3.
- **Bulk playthrough operations** (multi-select edit/delete across many runs).
- **Changing how the library-level rating is computed** — Spec 011's library rating
  remains the canonical surfaced rating.
- The alternate "cards" and "compact" timeline layouts and the "numbered"/"neutral" run
  labels shown in the prototype — the committed design is the **spine** timeline with
  **journey** ("First playthrough" / "Replay") labels.
