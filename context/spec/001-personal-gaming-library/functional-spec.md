# Functional Specification: Personal Gaming Library

- **Roadmap Item:** Personal Gaming Library (Add Games to Library, Journey Status Tracking, Library View & Organization)
- **Status:** Draft
- **Author:** Claude (AI Assistant)

---

## 1. Overview and Rationale (The "Why")

### 1.1. Problem Statement

Sam, our patient gamer persona, can currently search for games via IGDB integration, but has no way to save, organize, or revisit these games within SavePoint. He cannot track where he is in his gaming journey with each title, and he has no central place to view his curated gaming collection. This means Sam cannot be intentional about his gaming experiences or manage his library effectively.

### 1.2. Goal

Enable Sam to build and maintain a personal gaming library within SavePoint where he can:
- Add games from IGDB search results
- Track his journey status with each game (Curious About, Currently Exploring, Taking a Break, Experienced, Wishlist, Revisiting)
- View and organize his library through filtering, sorting, and search
- Manage multiple library entries for the same game (different platforms or different journey cycles)

### 1.3. Success Criteria

- Sam can quickly view his gaming library with selected filters applied
- Sam can add a game to his library and assign it a status and platform
- Sam can update journey statuses as he progresses through games
- Sam can find specific games in his library using filters and search
- Sam understands his collection at a glance (what he's playing, what he's curious about, what he's completed)

---

## 2. Functional Requirements (The "What")

### 2.1. Add Games to Library

**User Story:**
As Sam, I want to add games from IGDB to my personal library, so that I can track and organize my gaming collection.

**Requirements:**

1. **"Add to Library" Button:**
   - An "Add to Library" button appears on game detail pages
   - The button also appears on game search results for faster workflow
   - If the game is already in the library, the button state changes to indicate this

2. **Add to Library Form:**
   When Sam clicks "Add to Library," a form appears with the following fields:

   - **Status (Required):**
     - Dropdown with options: Curious About, Currently Exploring, Taking a Break, Experienced, Wishlist, Revisiting
     - Default value: "Curious About"
     - Status definitions:
       - **Curious About:** Interested in and already own this game
       - **Currently Exploring:** Currently playing the game at this moment in time
       - **Taking a Break:** Has played the game but decided to pause
       - **Experienced:** Has achieved what he wanted from the game (completed or played enough)
       - **Wishlist:** Game from the wishlist (wants to acquire/play)
       - **Revisiting:** Replaying a game already experienced

   - **Platform (Required):**
     - Single-select searchable dropdown
     - Shows all gaming platforms from the platform lookup table
     - **Supported platforms** (based on IGDB data for this game) appear at the top of the list
     - A visual **divider** separates supported platforms from other platforms below
     - Platforms include: Current gen consoles (PS5, Xbox Series X/S, Switch), previous gen (PS4, Xbox One), PC, and any other platforms in the database
     - Platforms are unique (no duplicates)
     - Sam can select any platform, even if not officially supported (for emulation, backwards compatibility, etc.)

   - **Started At (Optional):**
     - Date picker field
     - Indicates when Sam started playing this game

   - **Completed At (Optional):**
     - Date picker field
     - Indicates when Sam finished/experienced this game

3. **Form Submission:**
   - After submitting the form, the game is added to Sam's library
   - A **toast notification** appears confirming the game was added
   - The "Add to Library" button changes state to show the game is in the library

4. **Multiple Library Items:**
   - If Sam owns the same game on multiple platforms (e.g., PS5 and PC), he can add it as **separate library items**
   - Each library item represents a unique combination of game + platform (and potentially different journey cycles)

**Acceptance Criteria:**

- [ ] When Sam views a game detail page or search result, he sees an "Add to Library" button
- [ ] When Sam clicks "Add to Library," a form appears with Status (required, default: "Curious About"), Platform (required, searchable), Started At (optional), and Completed At (optional) fields
- [ ] The Platform dropdown shows supported platforms at the top, followed by a divider, then other platforms below
- [ ] When Sam submits the form with valid data, the game is added to his library
- [ ] After submission, Sam sees a toast notification confirming the addition
- [ ] The "Add to Library" button updates to indicate the game is already in the library
- [ ] Sam can add the same game multiple times (different platforms or different journey cycles)

---

### 2.2. Journey Status Tracking

**User Story:**
As Sam, I want to update the journey status of games in my library, so that I can track my progress and current focus.

**Requirements:**

1. **Quick Actions on Library Cards:**
   - Each game card in the library view has **quick actions** accessible directly
   - Sam can change the journey status from the library view without opening the game detail page
   - A **status indicator** appears on the card showing the current status
   - When Sam updates the status, the card revalidates and a **toast notification** confirms the change

2. **Status Management from Game Detail Page:**
   - The game detail page has existing actions for status management (already implemented)
   - These actions remain available as an alternative to quick actions

3. **Status Transition Rules:**
   - Sam can move statuses **"forward"** in a logical progression within a single library item
   - The progression is: Wishlist → Curious About → Currently Exploring → Taking a Break → Experienced → Revisiting
   - The progression is **flexible:** Sam can skip steps (e.g., Wishlist → Currently Exploring)
   - Sam **cannot move backwards** (e.g., Experienced → Curious About) within a single library item
   - If Sam wants to track a backwards journey, he must create a **new library item** for that game

4. **No Status Limits:**
   - Sam can have **multiple games** with the same status simultaneously (e.g., multiple "Currently Exploring" games)

**Acceptance Criteria:**

- [ ] Each game card in the library view displays the current journey status
- [ ] Sam can change the status using quick actions directly from the library card
- [ ] When the status is updated, the card revalidates and a toast notification appears
- [ ] Sam can change status from the game detail page using existing actions
- [ ] Sam can move statuses forward in the progression (with flexible skipping)
- [ ] The system prevents Sam from moving statuses backwards within a single library item
- [ ] If Sam attempts a backwards status change, the system prompts him to create a new library item instead
- [ ] Sam can have unlimited games with the same status

---

### 2.3. Library View & Organization

**User Story:**
As Sam, I want to view and organize my gaming library, so that I can quickly find games and understand my collection at a glance.

**Requirements:**

1. **Library Display:**
   - The library is displayed as a **grid of game cards**
   - Each card shows:
     - Game cover image
     - Quick actions (for status changes)
     - Indicator showing the number of library items for this game (if multiple entries exist)
     - Game title appears **on hover**

2. **Active Library Item Display:**
   - If Sam has multiple library items for the same game, the library view shows **only the most recently modified item** as the active one
   - A visual indicator (e.g., badge) shows that multiple entries exist

3. **Sorting:**
   - **Default sort order:** Created At (most recently added first)
   - Sam can sort by:
     - Created At
     - Release Date
     - Release Year
     - Started At
     - Completed At

4. **Filtering:**
   - **Filter dropdowns** (not tabs) for:
     - **Status:** Filter by journey status (Curious About, Currently Exploring, Taking a Break, Experienced, Wishlist, Revisiting)
     - **Platform:** Filter by platform (PS5, PC, Switch, etc.)
     - **Text Search:** Search by game name
   - Sam can apply **multiple filters simultaneously** (e.g., "Currently Exploring" + "PS5" + search term "Zelda")

5. **Library Management Modal (Game Detail Page):**
   - On the game detail page, a **library management modal** allows Sam to manage all library items for that game
   - The modal displays all library items Sam has created for this game, showing:
     - Platform
     - Status
     - Started At
     - Completed At
     - Any other related information
   - From the modal, Sam can:
     - **View** all library items
     - **Edit** existing library items:
       - Can change: Status, Started At, Completed At
       - **Cannot change:** Platform (must create a new library item for different platforms)
     - **Delete** library items
     - **Add a new library item** for the same game (alternative to the "Add to Library" button)

**Acceptance Criteria:**

- [ ] The library page displays games as a grid of cards
- [ ] Each card shows: cover image, quick actions, library item count indicator (if multiple entries)
- [ ] Game title appears when Sam hovers over a card
- [ ] If multiple library items exist for a game, the most recently modified entry is shown
- [ ] The library is sorted by Created At (most recent first) by default
- [ ] Sam can change the sort order to: Release Date, Release Year, Started At, Completed At, or Created At
- [ ] Sam can filter the library by Status using a dropdown
- [ ] Sam can filter the library by Platform using a dropdown
- [ ] Sam can search for games by name using a text search input
- [ ] Sam can apply multiple filters simultaneously (Status + Platform + Search)
- [ ] On the game detail page, Sam can open a library management modal
- [ ] The modal displays all library items for that game with full details
- [ ] Sam can edit a library item's Status, Started At, and Completed At from the modal
- [ ] Sam cannot change the Platform of an existing library item
- [ ] Sam can delete library items from the modal
- [ ] Sam can add a new library item from the modal

---

## 3. Scope and Boundaries

### In-Scope

- Adding games from IGDB search results to personal library
- Journey status tracking with six defined statuses (Curious About, Currently Exploring, Taking a Break, Experienced, Wishlist, Revisiting)
- Platform selection for each library item (required field)
- Optional date tracking (Started At, Completed At)
- Multiple library items per game (different platforms or different journey cycles)
- Library view as a grid of game cards
- Filtering by status, platform, and game name
- Sorting by multiple criteria (Created At, Release Date, Release Year, Started At, Completed At)
- Quick actions for status updates from library cards
- Library management modal on game detail pages
- Toast notifications for add/update actions

### Out-of-Scope

- **Steam library import** (Phase 2 roadmap item)
- **Curated/themed collections** (Phase 2 roadmap item)
- **Social/community features** (following users, sharing libraries, etc.)
- **Ratings or reviews** of games
- **Screenshots or photo uploads** to library items
- **Achievement tracking** or progress sync from platforms
- **Game time tracking** integrations
- **Custom tags** or labels beyond the six journey statuses
- **Bulk actions** (e.g., bulk delete, bulk status update)
- **Export/import** of library data

---
