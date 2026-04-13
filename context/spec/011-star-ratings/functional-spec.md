# Functional Specification: Star Ratings

- **Roadmap Item:** Star Ratings — 1–5 with half-steps on library entries, visible on cards and detail, sortable/filterable, with a rating histogram on the profile
- **Status:** Draft
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

### Problem

SavePoint lets users track _what_ they've played but not _how much they liked it_. The library and game detail surfaces treat a masterpiece and a forgettable completion identically. Users have no lightweight way to:

- Mark the games they loved vs. tolerated
- Find their highest-rated games at a glance
- See the shape of their taste (do they rate harshly, generously, bimodally?)

Without ratings, downstream Phase 2 features have no signal to build on: **Reviews** (2B) need a rating attached, **Aggregate Game Stats** (2C) needs per-user ratings to average, and **Year-in-Review / Wrapped** (2F) needs ratings to surface "top-rated of the year."

### Desired Outcome

Every library entry can carry a 1–5 rating with half-step precision (0.5 through 5.0, 10 discrete values). Ratings are lightweight to set, visible wherever a game appears for the owner, and surfaced publicly on the profile (respecting the existing `isPublicProfile` gate). A new rating histogram on the profile Overview tab shows the distribution of a user's ratings.

### Success Metrics

- Users rate more than a trivial fraction of their library (target: ≥25% of library entries rated within a month of shipping)
- Rated games can be surfaced via sort and filter on the Library tab
- Profile histogram correctly reflects a user's rating distribution
- No measurable friction added to the existing status-change flow (rating is optional)

---

## 2. Functional Requirements (The "What")

### 2.1 Rating Scale

- The rating scale is **1–5 with half-steps**: 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0 (10 discrete values).
- Ratings are optional. An entry with no rating is displayed as "unrated" and excluded from histograms and rating-based sort/filter.
- A user can change or clear their rating at any time.

**Acceptance Criteria:**

- [ ] Users can assign any of the 10 half-step values (0.5–5.0) to a library entry
- [ ] Entries can have no rating (null); "no rating" is a valid, first-class state
- [ ] Users can clear an existing rating back to "no rating"
- [ ] Users can change an existing rating to a different value

### 2.2 Rating Any Library Entry

- A library entry can be rated regardless of status (Want to Play, Owned, Playing, Played).
- Rating is independent of status: changing status does not clear the rating, and rating does not change status.

**Acceptance Criteria:**

- [ ] A user can rate a game in any of the four statuses
- [ ] Changing a game's status does not modify the existing rating
- [ ] Setting or changing a rating does not modify the game's status

### 2.3 Rating Input Component

A single reusable **Rating Input** component is the only way to set or change a rating. It is used on the game detail page and is reused in the Library filter UI (see 2.5).

- The component renders 5 stars supporting half-step precision.
- **Interaction:** hover over a star previews the value under the cursor (left half = half-step, right half = whole-step); clicking commits that value. Clicking the currently-selected value clears the rating back to "no rating."
- There is no alternative input (no dropdown, no slider) — hover + click is the single supported mechanism.
- The rating saves optimistically; failure reverts the UI to the prior value and shows an inline error.

**Acceptance Criteria:**

- [ ] The Rating Input renders 5 stars with half-step precision
- [ ] Hovering previews the value under the cursor; moving the cursor away restores the previous preview to the saved value
- [ ] Clicking a star commits that value
- [ ] Clicking the currently-selected value clears the rating
- [ ] The component is used on the game detail page (owner view) for editing the rating on a library entry
- [ ] An unrated game shows an empty control (no filled stars)
- [ ] A rated game shows stars filled to the rating value
- [ ] On save failure, the UI reverts and an inline error is shown

### 2.4 Rating Display on Library Cards

- Every library card displays its rating if one exists, using a compact **stars-only** display (no numeric value).
- Unrated cards show no rating indicator (not a zero-star placeholder).
- The rating on a card is read-only; editing happens on the game detail page.

**Acceptance Criteria:**

- [ ] Rated library cards show their rating as stars only (no numeric "4.5")
- [ ] Unrated library cards show no rating UI (not a zero-filled control)
- [ ] The rating on a card is not editable (no click-to-rate from the card)

### 2.5 Sort and Filter Library by Rating

The owner's authenticated Library page (`/library`) gains rating-based sort and filter controls.

- **Sort** options added: "Highest rated" and "Lowest rated."
- **Filter** UI: reuses the **Rating Input** component from 2.3 as a minimum-rating selector. The user picks a rating value and the library restricts to entries at or above that rating. Clicking the selected value clears the filter. A separate "Unrated only" toggle exposes entries with no rating.
- **Unrated entries are always last** when sorting by rating, regardless of direction (highest-first or lowest-first). Unrated entries are excluded from rating-based filters unless the "Unrated only" toggle is active.
- **Sort and filter state is URL-addressable**, so users can share or bookmark a filtered view (e.g., `?sort=rating-desc&minRating=4`).
- Existing sort/filter controls on the Library page are preserved; rating sort and filter are additive.

**Acceptance Criteria:**

- [ ] Library page exposes a sort control with "Highest rated" and "Lowest rated" options
- [ ] Library page exposes a rating filter using the same Rating Input component used to set a rating
- [ ] Library page exposes an "Unrated only" toggle
- [ ] Sorting by rating places unrated entries at the end of the list, in both directions
- [ ] Filtering by minimum rating excludes unrated entries
- [ ] "Unrated only" shows only entries with no rating
- [ ] Sort and filter state persists in the URL (query parameters) and is restored on reload
- [ ] The public Library tab on `/u/{username}/library` does **not** gain sort/filter controls (it remains read-only per Spec 009)

### 2.6 Rating Histogram on Profile Overview

- The profile Overview tab (`/u/{username}`) gains a **Rating Distribution** section showing a bar chart of how many library entries the user has at each rating value (0.5 to 5.0, 10 bars).
- The histogram is hidden when the user has **fewer than 5 rated entries**, to avoid showing a near-empty chart.
- Each bar shows the count of entries at that rating; hovering or tapping a bar surfaces the exact count and rating value.
- Unrated entries are not represented in the histogram.

**Acceptance Criteria:**

- [ ] Profile Overview shows a Rating Distribution bar chart when the user has ≥ 5 rated entries
- [ ] The chart has one bar per half-step value (0.5–5.0), 10 bars total
- [ ] Bar heights reflect counts of entries at each rating
- [ ] Hovering or tapping a bar reveals the exact count and rating value
- [ ] The chart is hidden entirely when the user has fewer than 5 rated entries
- [ ] The chart is visible to visitors of public profiles; hidden on private profiles (consistent with Spec 009 privacy gating)

### 2.7 Visibility and Privacy

- Ratings follow the existing `isPublicProfile` gate from Spec 009:
  - **Owner** always sees their ratings everywhere.
  - **Visitors to a public profile** see ratings on library cards in the public Library tab and in the histogram on Overview.
  - **Visitors to a private profile** see no ratings (nothing is exposed via server response), consistent with the rest of the private profile gate.
- There is **no** per-rating visibility toggle — visibility is profile-wide.

**Acceptance Criteria:**

- [ ] Owner sees all their ratings regardless of `isPublicProfile`
- [ ] Visitor to a public profile sees the owner's ratings on library cards and the histogram
- [ ] Visitor to a private profile sees no rating data (not in payload, not in UI)

---

## 3. Scope and Boundaries

### In-Scope

- 1–5 half-step rating on each library entry (10 discrete values)
- Optional rating with first-class "unrated" state
- Reusable Rating Input component (hover + click, no alternative UI)
- Rating input on game detail page (owner only)
- Stars-only rating display on library cards (owner and public visitors, per privacy gate)
- Sort by rating (highest-first, lowest-first) on the owner's authenticated Library page
- Filter by minimum rating on the owner's Library page, reusing the Rating Input component
- "Unrated only" filter toggle
- URL-addressable sort and filter state
- Rating Distribution histogram on profile Overview tab (shown at ≥ 5 rated entries)
- Privacy gating consistent with Spec 009 (`isPublicProfile`)
- Schema change: add nullable rating column to the library-entry table, with a CHECK constraint for valid half-step values

### Out-of-Scope

- **Reviews** (written takes on a game) — Phase 2B, separate spec
- **Per-Playthrough Logs** — Phase 2A, separate spec. This spec rates the library entry as a whole; when playthroughs ship, a later spec will decide whether per-playthrough ratings override or coexist.
- **Aggregate / community ratings** on game detail (average across users) — Phase 2C, separate spec
- **Year-in-Review / Wrapped** surface that depends on ratings — Phase 2F, separate spec
- Sort / filter by rating on the **public** Library tab (`/u/{username}/library`) — the public tab stays read-only per Spec 009; a future spec can revisit
- Per-rating visibility toggle (ratings follow profile-wide visibility only)
- Rating import from Steam or any external source
- Rating influence on discovery or recommendations
- Rating input directly from library cards (card is read-only; edits happen on game detail)
- All other Phase 2 roadmap items (Per-Playthrough Logs, Reviews, Community Reflections, Aggregate Game Stats, Profile Slug Resolution, Curated Collections, Similar Games Discovery, Enhanced Game Details, Browse/Catalog, Mood-Based Recommendations, Upcoming Releases Widget, YTD Stats Card, "Pick up where you left off," Year-in-Review/Wrapped, Fallback Cover Rendering, In-Page Status Toggles, Global Quick-Log CTA, Bulk Library Actions, Keyboard Navigation Palette, Bento Dashboard Reflow, Gaming Events Calendar, Library View Modes, Game Detail Redesign, Theme Variants & Density Modes, Logged-Out Landing Page)
