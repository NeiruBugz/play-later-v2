# Functional Specification: Status Simplification

- **Roadmap Item:** Simplify journey status tracking from 6 statuses to 4
- **Status:** Draft
- **Author:** Claude (AI Assistant)

---

## 1. Overview and Rationale (The "Why")

### Context

SavePoint currently uses 6 statuses to track a user's relationship with games in their library: WISHLIST, CURIOUS_ABOUT, CURRENTLY_EXPLORING, TOOK_A_BREAK, EXPERIENCED, and REVISITING. This granularity creates friction rather than clarity.

### Problem

Users experience decision paralysis when categorizing games:

- **WISHLIST vs CURIOUS_ABOUT:** The distinction between "want to play, don't have" and "interested but not committed" is unclear and subjective
- **TOOK_A_BREAK vs EXPERIENCED:** Forces users to judge "am I done with this game?"—a question that often has no clear answer
- **REVISITING:** Functionally identical to CURRENTLY_EXPLORING; replaying a game is still playing it

The complexity meant to enable rich organization actually prevents users from quickly adding games to their library.

### Desired Outcome

Reduce cognitive load by consolidating to 4 intuitive statuses that match how users naturally think about their games. Users should be able to categorize a game instantly without second-guessing their choice.

### Success Metrics

- Reduced time-to-add: Users add games to their library faster (fewer hesitations at status selection)
- Status selection feels obvious, not paralyzing
- No increase in support requests asking "what status should I use?"

---

## 2. Functional Requirements (The "What")

### 2.1 New Status Model

The system must support exactly 4 statuses with the following characteristics:

| Status | Enum Value | Meaning | Use Case |
|--------|------------|---------|----------|
| **Want to Play** | `WANT_TO_PLAY` | On your radar, haven't started | Unreleased games, backlog intentions, series you want to try |
| **Owned** | `OWNED` | In your library, haven't started | Steam purchases, physical copies waiting to be played |
| **Playing** | `PLAYING` | Currently engaged | Whatever you're playing now, including replays |
| **Played** | `PLAYED` | Have experienced it | Finished, abandoned, or moved on—doesn't matter |

**Acceptance Criteria:**

- [ ] The status enum contains exactly 4 values: `WANT_TO_PLAY`, `OWNED`, `PLAYING`, `PLAYED`
- [ ] Each status has a user-facing display name matching the table above
- [ ] Statuses are displayed in natural progression order: Want to Play → Owned → Playing → Played

### 2.2 State Transitions

Users can transition between any status at any time. The state machine is flexible—states can be skipped.

**Valid Transitions (non-exhaustive examples):**

- Want to Play → Playing (user starts a game they don't own, e.g., Game Pass)
- Owned → Played (user decides they won't play it)
- Played → Playing (user returns to a game)
- Any status → Any other status

**Acceptance Criteria:**

- [ ] Users can change a game's status from any state to any other state
- [ ] No validation prevents "non-linear" transitions (e.g., Want to Play directly to Played)

### 2.3 Default Status

When a user adds a game to their library without explicitly selecting a status, the default status is `PLAYED`.

**Acceptance Criteria:**

- [ ] When adding a game via quick action without status selection, the game is added with status `PLAYED`
- [ ] When adding a game via modal/form, `PLAYED` is pre-selected but user can change before saving

### 2.4 UI Updates

#### Quick Action Buttons

The library and game detail pages display 4 quick action buttons with equal visual prominence.

**Acceptance Criteria:**

- [ ] Quick action button group shows exactly 4 buttons
- [ ] All 4 buttons have equal visual weight (same size, same styling pattern)
- [ ] Buttons are ordered: Want to Play, Owned, Playing, Played

#### Status Selection in Modal

The add-to-library modal displays status options as a chip/button group.

**Acceptance Criteria:**

- [ ] Status chip group shows exactly 4 options
- [ ] Chips are ordered: Want to Play, Owned, Playing, Played
- [ ] Selected status is visually distinguished from unselected options

#### Library Filtering

The library view provides filter options by status.

**Acceptance Criteria:**

- [ ] Filter dropdown/chips show exactly 4 status options plus "All"
- [ ] Each filter shows only games with the matching status
- [ ] Filter options are ordered: All, Want to Play, Owned, Playing, Played

### 2.5 Data Migration

Existing library entries must be migrated to the new status model.

| Old Status | New Status |
|------------|------------|
| `WISHLIST` | `WANT_TO_PLAY` |
| `CURIOUS_ABOUT` | `WANT_TO_PLAY` |
| `CURRENTLY_EXPLORING` | `PLAYING` |
| `TOOK_A_BREAK` | `PLAYED` |
| `EXPERIENCED` | `PLAYED` |
| `REVISITING` | `PLAYING` |

**Acceptance Criteria:**

- [ ] All existing library entries are migrated according to the mapping table
- [ ] No library entries have null or invalid status after migration
- [ ] Migration is idempotent (can be run multiple times safely)
- [ ] Old status enum values are removed from the codebase after migration

---

## 3. Scope and Boundaries

### In-Scope

- New 4-status enum definition and validation
- Database migration for existing library entries
- UI updates: quick action buttons, status chips in modal, library filters
- Default status behavior when adding games
- Status display order throughout the application

### Out-of-Scope

- **Optional Platform (Decision 2):** Making platform selection optional is a separate specification
- **Journal Friction Reduction (Decision 3):** Journal UX changes are a separate specification
- **Intentional Library Philosophy (Decision 4):** Steam import curation is a separate specification
- **Combined filter views:** "Active" or other aggregated status filters (may be considered in future)
- **Status-based analytics:** Tracking how users change statuses over time
