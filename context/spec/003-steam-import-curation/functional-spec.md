# Functional Specification: Steam Import Curation

- **Roadmap Item:** Steam Library Integration - Stage 2 (Curation UX) & Stage 3 (Curation Interface)
- **Status:** Completed
- **Author:** Claude (AI-assisted)

---

## 1. Overview and Rationale (The "Why")

### Context

SavePoint's philosophy is that a user's library should reflect games they *intend to experience*, not a complete catalog of everything they own. Steam import is **curation, not bulk transfer**. With Stage 1 (Technical Foundation) complete, the Steam Web API fetches a user's Steam library and stores games in the `ImportedGame` staging table with basic Steam data (name, playtime, last played).

### Problem

Users with large Steam libraries (100-500+ games) face two challenges:
1. **Overwhelm:** Seeing hundreds of games at once creates decision paralysis
2. **Manual work:** Selecting games one-by-one and assigning statuses is tedious

Without smart defaults and good UX, users will either abandon the import process or import everything—defeating the curation philosophy.

### Desired Outcome

A streamlined curation interface that:
- Presents imported Steam games in a manageable, paginated format
- Matches games to IGDB on-demand when importing (using Steam App ID lookup)
- Auto-assigns sensible statuses based on playtime and recency
- Handles IGDB match failures gracefully with manual search
- Allows importing games individually to the library
- Results in an intentionally curated library, not a bulk dump

### Success Metrics

- **Completion rate:** >80% of users who start curation complete it
- **Curation ratio:** Users import <50% of their Steam library on average (indicating intentional selection)
- **Time to complete:** <5 minutes for libraries under 200 games

---

## 2. Functional Requirements (The "What")

### 2.1 Entry Points

- **As a** user, **I want to** access Steam import from both my profile/settings and my library page, **so that** I can find the feature wherever I naturally look for it.
  - **Acceptance Criteria:**
    - [ ] A "Import from Steam" button is visible on the Library page
    - [ ] A "Steam Import" option exists in Profile/Settings under connected accounts
    - [ ] Both entry points navigate to the same curation screen

### 2.2 Curation List Display

- **As a** user, **I want to** see my imported Steam games in a paginated list, **so that** I'm not overwhelmed by hundreds of games at once.
  - **Acceptance Criteria:**
    - [ ] Games are displayed in pages of 25-50 items
    - [ ] Pagination controls (Previous/Next or page numbers) are visible
    - [ ] Total game count and current page indicator are shown (e.g., "Page 1 of 8 - 187 games")

- **As a** user, **I want to** see relevant information for each game, **so that** I can make informed decisions about what to import.
  - **Acceptance Criteria:**
    - [ ] Each game row displays: cover image, title, playtime (hours), last played date, auto-assigned status
    - [ ] Games without IGDB match show a visual indicator (e.g., warning icon)

### 2.3 Individual Game Actions

- **As a** user, **I want to** import games individually from the list, **so that** I can thoughtfully curate my library one game at a time.
  - **Acceptance Criteria:**
    - [ ] Each game row has an "Import" button (or "Add to Library" action)
    - [ ] Clicking the button initiates the IGDB matching and import flow for that single game
    - [ ] Successfully imported games are removed from the list (or marked as imported)
    - [ ] A "Dismiss" action allows removing games from the list without importing

### 2.4 Smart Status Assignment

- **As a** user, **I want** games to be automatically assigned appropriate statuses based on my playtime when I import them, **so that** I don't have to manually categorize each game.
  - **Acceptance Criteria:**
    - [ ] Games with **0 playtime** are assigned **"Owned"** status
    - [ ] Games with **playtime > 0** AND **last played within 7 days** are assigned **"Playing"** status
    - [ ] Games with **playtime > 0** AND **last played more than 7 days ago** are assigned **"Played"** status
    - [ ] The auto-assigned status is displayed in each game row

### 2.5 Per-Game Status Override

- **As a** user, **I want to** optionally change the auto-assigned status before importing a game, **so that** I can correct any misassignments.
  - **Acceptance Criteria:**
    - [ ] When importing, a status selector shows the auto-assigned value as default
    - [ ] Dropdown options: Want to Play, Owned, Playing, Played
    - [ ] User can accept the default or select a different status
    - [ ] The selected status is used when creating the library entry

### 2.6 Sorting & Filtering

- **As a** user, **I want to** sort and filter the import list, **so that** I can find specific games and organize my view.
  - **Acceptance Criteria:**
    - [ ] **Sort options:** Playtime (high to low), Playtime (low to high), Name (A-Z), Name (Z-A), Last Played (recent first), Last Played (oldest first)
    - [ ] **Filter options:** All games, Played, Never played, playtime ranges
    - [ ] Default sort: Playtime (high to low)
    - [ ] Sort and filter selections persist during the session

### 2.7 IGDB Matching & Manual Search

- **As a** user, **I want** games to be automatically matched to IGDB when I click import, **so that** I get full game metadata in my library.
  - **Acceptance Criteria:**
    - [ ] When importing, the system first attempts to match via Steam App ID lookup in IGDB
    - [ ] If matched, the game imports with full IGDB metadata (cover, description, etc.)
    - [ ] If not matched, user is prompted to search IGDB manually
    - [ ] Manual search modal shows results with cover, title, and release year
    - [ ] Selecting a result completes the import with that IGDB game's metadata

- **As a** user, **I want to** skip games that can't be matched, **so that** I can continue curating without getting stuck.
  - **Acceptance Criteria:**
    - [ ] If auto-match fails, user can choose to search manually OR dismiss the game
    - [ ] Dismissed games are soft-deleted from the import list
    - [ ] User can restore dismissed games if needed (future enhancement)

### 2.8 Post-Import Experience

- **As a** user, **I want to** see confirmation when a game is imported, **so that** I know it was successful.
  - **Acceptance Criteria:**
    - [ ] After successful import, a success toast confirms "Game added to library"
    - [ ] The imported game is removed from the curation list (or marked as imported)
    - [ ] User can click through to view the game in their library

### 2.9 Error Handling

- **As a** user, **I want to** understand what went wrong if the import fails, **so that** I can take corrective action.
  - **Acceptance Criteria:**
    - [ ] If IGDB matching fails due to rate limiting, show a clear message and suggest trying again later
    - [ ] If import fails (e.g., network error), show an error toast with retry option
    - [ ] Game remains in the list if import fails, allowing user to retry

---

## 3. Scope and Boundaries

### In-Scope

- Paginated curation interface for imported Steam games
- Individual game import actions (one game at a time)
- On-demand IGDB matching via Steam App ID lookup when importing
- Manual IGDB search for games that don't auto-match
- Smart status assignment based on playtime (0 hrs → Owned) and recency (7-day threshold for Playing vs Played)
- Per-game status override during import
- Sorting by playtime, name, last played
- Filtering by playtime status and ranges
- Dismiss/soft-delete games from import list
- Entry points from both Library page and Profile/Settings

### Out-of-Scope

*(These are separate roadmap items or future enhancements)*

- **Bulk Selection & Import** — Checkbox selection, Select All/Deselect All, bulk import (see Stage 3 in roadmap)
- **Stage 4: Ongoing Sync** — Re-import detection, periodic sync for new purchases
- **PlayStation Trophy Integration** — Separate integration with different API
- **Xbox Game Pass Integration** — Separate integration with different API
- **Discovery & Exploration** — Similar games, franchise info
- **Curated Collections** — Themed collection creation
- **Community & Social Features** — Public reflections, following users
- Pre-selection logic (no checkboxes in MVP)
- Configurable thresholds (7-day recency is fixed for MVP)
- Infinite scroll (pagination chosen instead)
- Restore dismissed games (future enhancement)
