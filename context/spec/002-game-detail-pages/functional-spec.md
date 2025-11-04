# Functional Specification: Game Detail Pages

- **Roadmap Item:** Game Detail Pages - Create rich game detail pages showing IGDB metadata and user's personal journal entries for that game
- **Status:** Draft
- **Author:** Product Analyst (with Nail Badiullin)

---

## 1. Overview and Rationale (The "Why")

### Problem Statement
Currently, users have no ability to view comprehensive information about games in the SavePoint system. When users discover a game through search or want to learn more about a game in their library, they lack a centralized page that brings together both game metadata (from IGDB) and their personal gaming journey data (journal entries, library status).

### Desired Outcome
Create a rich, informative game detail page that serves as the single source of truth for all information about a specific game. This page will help patient gamers make intentional decisions about which games to add to their library, provide context for games they're considering playing, and display their personal reflections and journey status for games they're tracking.

### User Intent
When "Sam the Patient Gamer" lands on a game detail page, they may be:
- **Researching** a game before deciding to add it to their library (discovering new games through search or related games)
- **Reviewing** their own past journal entries and journey status for a game they're already tracking
- **Deciding** whether now is the right time to start playing a game in their collection
- **Navigating** to related games in the same franchise or series

---

## 2. Functional Requirements (The "What")

### 2.1. Page Layout and Structure

**As a** user, **I want to** see a comprehensive game detail page with clear visual hierarchy, **so that** I can quickly find the information most relevant to my current intent.

**Acceptance Criteria:**
- [ ] The page uses a two-column layout on larger screens (similar to Backloggd reference design)
- [ ] The left column contains the game cover image and quick action buttons (sticky positioning on scroll)
- [ ] The right column contains all game metadata, user journey data, and related content
- [ ] On mobile/smaller screens, the layout stacks vertically with cover image at the top
- [ ] The page uses consistent spacing, typography, and dark theme styling from the SavePoint design system

---

### 2.2. IGDB Game Metadata Display

**As a** user, **I want to** see comprehensive game information from IGDB, **so that** I can understand what the game is about and make informed decisions about playing it.

#### 2.2.1. Game Title
- [ ] The full official game title from IGDB is displayed prominently at the top of the right column
- [ ] Title uses large, bold typography to establish visual hierarchy

#### 2.2.2. Game Description
- [ ] The game's summary field from IGDB is displayed in full with no character truncation
- [ ] Long descriptions are not truncated; all text is immediately visible
- [ ] If IGDB returns no description, display a placeholder message: "No description available"

#### 2.2.3. Release Date
- [ ] Release date is displayed in the format "MMM dd, yyyy" (e.g., "Jan 15, 2023")
- [ ] The `first_release_date` field from IGDB takes priority
- [ ] If `first_release_date` is not available, display "N/A"

#### 2.2.4. Platforms
- [ ] All available platforms from IGDB are displayed as colored badges/chips (reusing existing platform UI components)
- [ ] Platform badges wrap to multiple lines if there are many platforms
- [ ] Each platform badge uses the established color scheme (e.g., PlayStation blue, Xbox green, Nintendo red, PC gray)

#### 2.2.5. Genres
- [ ] All genres from IGDB are displayed as badge/chip UI elements
- [ ] Genres are displayed in a horizontal, wrapping layout
- [ ] Genres are informational only (not clickable in this version)

#### 2.2.6. Times to Beat
- [ ] A "Times to Beat" section queries the IGDB `game_time_to_beat` endpoint separately from the main game data
- [ ] Two time metrics are displayed:
  - "Main Story: [X] hours" (from the main story field)
  - "100% Completion: [Y] hours" (from the completionist field)
- [ ] If no time-to-beat data is available for the game, the section still displays with dashes:
  - "Main Story: —"
  - "100% Completion: —"
- [ ] Time values are formatted as whole numbers (e.g., "12 hours", not "12.5 hours")

#### 2.2.7. Franchise and Related Games
- [ ] A "Franchise" or "Related Games" section displays games in the same franchise or game series from IGDB
- [ ] The first 5 related games are displayed as clickable cards with cover images
- [ ] Each card shows the game's cover and title
- [ ] Clicking a card navigates to that game's detail page
- [ ] If there are more than 5 related games:
  - A "View More" button/link is displayed
  - Clicking "View More" expands the section inline to show all related games
  - A "Show Less" button appears after expansion to collapse back to the first 5
- [ ] If there are no related games, the section is hidden entirely

---

### 2.3. Game Cover Image

**As a** user, **I want to** see the game's cover art prominently displayed, **so that** I can quickly recognize the game visually.

**Acceptance Criteria:**
- [ ] The game's cover image from IGDB is displayed in the left column (on larger screens)
- [ ] The cover image uses sticky positioning and remains visible when the user scrolls down the page (desktop only)
- [ ] On mobile/smaller screens, the cover appears at the top of the page with normal scrolling behavior
- [ ] If IGDB has no cover image available, a placeholder is displayed with:
  - A generic game controller icon or colored background
  - Text reading "No cover available"

---

### 2.4. User's Personal Journey Data

#### 2.4.1. Library Status (Journey Status) Display

**As a** user, **I want to** see my current journey status for this game, **so that** I know where this game fits in my gaming plans.

**Acceptance Criteria:**
- [ ] If the game is in the user's library, display the most recently modified library item's status (e.g., "Currently Exploring", "Curious About")
- [ ] Display the date when this status was last updated (e.g., "Updated: Jan 15, 2023")
- [ ] A "Manage Library" or "Edit Status" button is displayed next to the status
- [ ] Clicking the button opens a modal window where the user can:
  - View all library entries for this game (if multiple exist)
  - Edit the status of existing entries
  - View timestamps for each entry
- [ ] If the game is NOT in the user's library, display an "Add to Library" button instead [NEEDS CLARIFICATION: Confirm that a game in the library always has at least one status set]

#### 2.4.2. Quick Action Buttons

**As a** user, **I want to** quickly update my journey status with one click, **so that** I can efficiently track my gaming progress without opening a modal.

**Acceptance Criteria:**
- [ ] Quick action buttons for all journey status options are displayed in the left column (on desktop) or below the cover image (on mobile):
  - Curious About
  - Currently Exploring
  - Taking a Break
  - Experienced
  - Wishlist
  - Revisiting
- [ ] Each button has:
  - A distinctive icon representing the status
  - A small text label below or beside the icon
- [ ] The button corresponding to the user's current/most recent status is highlighted/selected visually
- [ ] Clicking a quick action button updates the most recently modified library item for this game to the new status
- [ ] After clicking, the button's visual state updates to show it's now the active status
- [ ] If the game is not in the library, clicking a quick action button first adds the game to the library with the selected status [NEEDS CLARIFICATION: Should this match the "Add to Library" modal flow described below?]

#### 2.4.3. "Add to Library" Modal

**As a** user who hasn't added this game to my library yet, **I want to** add it with an initial journey status, **so that** I can start tracking this game.

**Acceptance Criteria:**
- [ ] If the game is not in the user's library, an "Add to Library" button is prominently displayed
- [ ] Clicking "Add to Library" opens a modal window
- [ ] The modal allows the user to:
  - Select a journey status from all available options (Curious About, Currently Exploring, etc.)
  - Optionally add notes or context (if supported by the library item data model)
- [ ] After submission, the modal closes, the game is added to the library, and the page updates to show the new status and quick action buttons
- [ ] The "Add to Library" button is replaced with the journey status display and "Manage Library" button [NEEDS CLARIFICATION: Should the "Add to Library" modal and "Manage Library" modal be merged into a single modal component since they serve similar purposes?]

#### 2.4.4. Journal Entries Section

**As a** user, **I want to** see my recent journal entries for this game, **so that** I can revisit my thoughts and memories about my experience.

**Acceptance Criteria:**
- [ ] A "Journal Entries" section is displayed in the right column
- [ ] The section shows the last 3 journal entries for this game (if they exist)
- [ ] Entries are displayed in reverse chronological order (newest first)
- [ ] Each entry card displays:
  - The entry's title
  - The date the entry was created (format: "MMM dd, yyyy")
  - A glimpse of the content (first 2 lines of text)
- [ ] Clicking an entry card navigates to the full journal entry detail page (not yet implemented)
- [ ] If the user has fewer than 3 entries, display all available entries
- [ ] If the user has NO journal entries for this game, display a message: "No journal entries yet" with a link/button to "Write Your First Entry"
- [ ] If the user HAS existing journal entries, a "Write New Entry" button is displayed at the top or bottom of the section
- [ ] The "Write New Entry" button links to the journal entry creation page for this game (not yet implemented)

---

### 2.5. Navigation and Access

**As a** user, **I want to** easily navigate to game detail pages from multiple entry points, **so that** I can access game information whenever I need it.

**Acceptance Criteria:**
- [ ] Users can access a game detail page by:
  - Clicking a game from search results on the existing game search page
  - Clicking a game from their personal library view (when implemented)
  - Clicking a related game card on another game's detail page
- [ ] The page URL uses slug-based routing (e.g., `/games/dragon-quest-i-ii-hd-2d-remake`)
- [ ] The existing back button in the application navigation allows users to return to the previous page
- [ ] Breadcrumbs or other navigation aids are not required for this version

---

### 2.6. Loading States and Error Handling

**As a** user, **I want to** see clear feedback when data is loading or when errors occur, **so that** I understand what's happening and am not confused.

#### 2.6.1. Loading State
**Acceptance Criteria:**
- [ ] While fetching game data from IGDB, a skeleton loading UI is displayed
- [ ] The skeleton UI mimics the structure of the final page (cover placeholder, text line placeholders for title/description, badge placeholders for genres/platforms)
- [ ] Loading state is visible for all asynchronous data fetches (game metadata, time-to-beat, related games)

#### 2.6.2. Incomplete IGDB Data
**Acceptance Criteria:**
- [ ] If a specific metadata field is missing from IGDB (e.g., no description), display a placeholder:
  - Description: "No description available"
  - Cover image: Placeholder image with "No cover available" text
  - Release date: "N/A"
  - Times to beat: Display section with "—" (dashes)
- [ ] Missing genres or platforms: Hide the section if no data exists
- [ ] Related games: Hide the entire section if no related games exist

#### 2.6.3. Invalid Game / Not Found
**Acceptance Criteria:**
- [ ] If the user navigates to a game detail page with an invalid slug or a game that doesn't exist in IGDB, display a "Not Found" page
- [ ] The Not Found page includes:
  - A clear message: "Game not found"
  - A suggestion to return to the search page or homepage
  - A search input to try finding another game

---

## 3. Scope and Boundaries

### In-Scope

- Display all IGDB game metadata fields specified above (title, description, release date, platforms, genres, times to beat, related games)
- Display user's personal journey data (library status, journal entry summaries)
- Quick action buttons for updating journey status
- Modals for adding/managing library items
- Sticky cover image positioning on desktop
- Slug-based routing for game detail pages
- Skeleton loading states for all async data
- Error handling for missing data and invalid game IDs
- Navigation from search results and related games

### Out-of-Scope

- **Full journal entry detail pages** (linked but not yet implemented)
- **Journal entry creation page** (linked but not yet implemented)
- **User ratings or reviews** for games (future social features)
- **Community data** (how many users have this game, average community rating, etc.)
- **Screenshots or media gallery** from IGDB
- **DLC, expansions, or edition details** (may be added later as enhanced game details)
- **Achievements or progress sync** from Steam/other platforms
- **Similar games recommendations** based on IGDB similarity (future discovery feature)
- **User-generated tags or collections** displayed on the game page
- **Platform-specific purchase links** (Steam store, Epic Games, etc.)

---

## 4. Open Questions and Clarifications

### Data Model Clarification (High Priority)
**[NEEDS CLARIFICATION: Data model for library items needs final decision before implementation]**
- Current model supports multiple library entries per game per user, with each entry having its own status and timestamp
- Quick actions modify the most recently modified library entry
- Question: Should we simplify the data model to one library entry per game with status history, or keep the current model?
- **Recommendation:** Discuss with engineering team to determine if current model can be optimized at the database level for better performance while maintaining flexibility

### Modal Flow Consolidation
**[NEEDS CLARIFICATION: Should "Add to Library" and "Manage Library" modals be merged?]**
- Both modals serve similar purposes (setting/editing journey status for a game)
- Merging them could reduce code duplication and provide a more consistent user experience
- **Recommendation:** Consider a single "Library Manager" modal that adapts its UI based on whether the game is already in the library

### Quick Actions for Non-Library Games
**[NEEDS CLARIFICATION: When a user clicks a quick action button for a game NOT in their library, should it immediately add the game with that status, or open the "Add to Library" modal first?]**
- Option A: Immediately add the game with the selected status (faster, one-click action)
- Option B: Open the modal for confirmation and optional notes (more explicit, allows user to add context)
- **Recommendation:** Conduct quick usability test or decide based on product philosophy (speed vs. intentionality)

---

**End of Functional Specification**
