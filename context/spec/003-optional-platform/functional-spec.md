# Functional Specification: Optional Platform

- **Roadmap Item:** Make platform selection optional when adding games to library
- **Status:** Draft
- **Author:** Claude (AI Assistant)

---

## 1. Overview and Rationale (The "Why")

### Context

SavePoint currently requires users to select a platform when adding a game to their library. Each platform selection creates a separate library entry, enabling per-platform tracking (e.g., "Zelda on Switch" vs "Zelda on PC").

### Problem

The platform requirement creates unnecessary friction for the most common use case:

- **Forced decision:** Users must decide where they'll play before they can add a game
- **Barrier to quick capture:** Most users just want to say "I'm playing Zelda"—the platform is secondary
- **Premature commitment:** Users may not know which platform they'll use, especially for wishlisted games

The Letterboxd model succeeds because the core action ("I watched this") is instant. Asking "but on which platform?" before a game can be added undermines this simplicity.

### Desired Outcome

Platform becomes optional metadata rather than a required field. Users can add games instantly with just a status, and optionally specify platform when it matters to them.

### Success Metrics

- Users can add a game to their library in 1 click (quick buttons)
- Reduced drop-off at the add-to-library step
- Power users retain ability to track per-platform when desired

---

## 2. Functional Requirements (The "What")

### 2.1 Schema Change

Platform field becomes optional in the library entry schema.

**Acceptance Criteria:**

- [ ] Platform field accepts null/undefined values
- [ ] Library entries can be created without specifying a platform
- [ ] Existing validation requiring platform is removed

### 2.2 Library Entry Uniqueness

Multiple library entries per game remain supported. Platform is optional on each entry.

**Acceptance Criteria:**

- [ ] A user can have multiple library entries for the same game
- [ ] Each entry can have a different platform, or no platform
- [ ] A user can have one entry with platform "Steam" and another with no platform for the same game

### 2.3 Add-to-Library Form

The add-to-library modal/form makes platform optional.

**Acceptance Criteria:**

- [ ] Platform dropdown/selector is not marked as required
- [ ] Form submits successfully when platform is not selected
- [ ] Platform field has a neutral default state (no platform pre-selected)
- [ ] Users can still select a platform if they choose

### 2.4 Quick Action Buttons

Quick action buttons add games without requiring platform selection.

**Acceptance Criteria:**

- [ ] Clicking a quick action status button (Want to Play, Owned, Playing, Played) adds the game immediately
- [ ] Games added via quick action have no platform specified (null)
- [ ] No platform selection prompt appears for quick actions

### 2.5 Platform Display

When platform is not specified, display a placeholder in the UI.

**Acceptance Criteria:**

- [ ] Library list view shows a placeholder (e.g., "—" or "Any Platform") when platform is null
- [ ] Library card/tile view handles missing platform gracefully (no empty space or broken layout)
- [ ] Game detail page shows placeholder when viewing an entry without platform

### 2.6 Journal Entry Linking

Journal entries link to library entries with defined fallback behavior.

**Single Entry Scenario:**

- If a user has exactly one library entry for a game, journal entries auto-link to it

**Multiple Entry Scenario:**

- If a user has multiple library entries for a game, journal entries auto-link to the **most recently updated** entry

**Acceptance Criteria:**

- [ ] When creating a journal entry for a game with one library entry, it auto-links to that entry
- [ ] When creating a journal entry for a game with multiple library entries, it auto-links to the entry with the most recent `updatedAt` timestamp
- [ ] Users can manually change the linked library entry if desired (existing functionality)

### 2.7 Backward Compatibility

Existing library entries retain their data.

**Acceptance Criteria:**

- [ ] Existing entries with platform values keep their platform unchanged
- [ ] Existing multi-platform entries (same game, different platforms) remain as separate entries
- [ ] No data migration required—schema change only makes column nullable

---

## 3. Scope and Boundaries

### In-Scope

- Schema change: platform field becomes nullable
- Form validation update: remove required constraint
- Quick action behavior: add without platform
- UI updates: placeholder display for missing platform
- Journal linking: auto-link to latest entry when multiple exist

### Out-of-Scope

- **Status Simplification (Decision 1):** Covered by separate specification
- **Journal Friction Reduction (Decision 3):** Covered by separate specification
- **Intentional Library Philosophy (Decision 4):** Covered by separate specification
- **Platform consolidation:** Merging existing multi-platform entries into single entries
- **Platform inference:** Automatically detecting platform from import source (e.g., Steam import)
- **Platform editing on existing entries:** Users can already edit platform; no changes needed
