# Functional Specification: Game Metadata Foundation

- **Roadmap Item:** Game Metadata Foundation
- **Status:** Draft
- **Author:** Claude (with Nail Badiullin)

---

## 1. Overview and Rationale (The "Why")

### Problem Statement
Currently, SavePoint users have no way to search for or discover games within the application. Users cannot browse game information, view metadata, or identify games they want to add to their library. This creates a fundamental gap in the product experience—users need access to accurate, rich game information (cover art, release dates, platforms, descriptions) to make informed decisions about which games to explore and journal about.

### Goal
Establish the foundational game metadata system by integrating with IGDB (Internet Games Database) as the primary data source. This will enable users to search for games by name and view essential game information including cover art, release dates, and supported platforms.

### Desired Outcome
After implementation, users will be able to:
- Search for any game by entering its full or partial name
- View search results displaying basic game metadata (cover art, release date, platforms)
- Successfully find games to prepare for adding them to their personal library (a separate roadmap item)

### Success Measurement
[NEEDS CLARIFICATION: No specific success metrics were defined. Consider adding metrics in future iterations such as: number of successful searches per user, search result relevance satisfaction, or API uptime percentage.]

---

## 2. Functional Requirements (The "What")

### 2.1. IGDB Integration

**As a** system, **the application must** establish a connection to the IGDB API **so that** game metadata can be retrieved and displayed to users.

**Acceptance Criteria:**
- [x] The application successfully authenticates with the IGDB API using valid credentials
- [x] The application can query IGDB for game data and receive responses
- [x] When IGDB API is unavailable or returns an error, the user sees the message: "Game search is temporarily unavailable. Please try again later."
- [x] API errors are logged for monitoring and debugging purposes

---

### 2.2. Game Search Functionality

**As a** user, **I want to** search for games by entering their full or partial name **so that** I can discover games and view their information.

**Acceptance Criteria:**

**Search Input Behavior:**
- [x] The search input field is prominently displayed and easily accessible
- [x] Search is case-insensitive (e.g., "zelda" finds "The Legend of Zelda")
- [x] Search is triggered dynamically with a 500ms debounce after the user stops typing
- [x] Search requires a minimum of 3 characters before being triggered
- [x] Before the user starts typing (or with fewer than 3 characters), the search results area is empty or shows a neutral empty state

**Search Results Display:**
- [x] When search results are loading (during debounce or API call), a pulse animation appears around the search input
- [x] Search results display up to 10 games initially
- [x] Results are sorted by relevance (if IGDB supports relevance sorting; otherwise use default IGDB ordering)
- [x] When no games are found, the following message is displayed: "We couldn't find any games matching '[search term]'. Try searching with a different name or keyword."

**Infinite Scroll:**
- [x] When the user scrolls to the bottom of the search results, a "Load More" button is displayed
- [x] Clicking "Load More" fetches the next 10 results from IGDB
- [x] While additional results are loading, a loading indicator is shown on or near the "Load More" button
- [x] If there are no more results to load, the "Load More" button is hidden or disabled with appropriate messaging (e.g., "No more results")

---

### 2.3. Game Metadata Display in Search Results

**As a** user, **I want to** see essential game information in search results **so that** I can identify the correct game and understand its basic details at a glance.

**Acceptance Criteria:**

**Cover Art:**
- [x] Each search result displays the game's cover art in portrait orientation
- [x] Cover art uses IGDB thumbnail size (264x352px) for optimal performance on mobile and desktop
- [x] If a game has no cover art in IGDB, a placeholder image is displayed showing:
  - A generic game controller icon
  - The game title as text

**Release Date:**
- [x] Each search result displays the game's release date in the format: "MMM dd, yyyy" (e.g., "Mar 03, 2017")
- [x] If the release date is unknown or unavailable in IGDB, the text "Unspecified" is displayed

**Platforms:**
- [x] Each search result displays supported platforms as badges (with icons and text)
- [x] If a game has 5 or fewer platforms, all platform badges are displayed
- [x] If a game has more than 5 platforms, exactly 5 platform badges are displayed followed by a "+X more" badge (e.g., "+3 more")
- [x] When hovering over (or tapping on mobile) the "+X more" badge, a tooltip appears showing all remaining platforms
- [x] If platform information is missing from IGDB, no platform badges are displayed for that game (the platform section is omitted)

---

## 3. Scope and Boundaries

### In-Scope

- IGDB API integration and authentication
- Game search functionality with debounced, case-insensitive search
- Display of search results with basic metadata: cover art, release date, platforms
- Infinite scroll with user-controlled "Load More" functionality
- Placeholder handling for missing cover art
- Platform badge display with tooltip for additional platforms
- Error handling and messaging when IGDB is unavailable

### Out-of-Scope

- **Game Detail Pages:** Detailed game pages showing full descriptions, genres, developer/publisher info, screenshots, and user journal entries will be specified separately
- **Adding Games to Library:** Functionality to add games from search results to the user's personal library is a separate roadmap item
- **User Actions on Search Results:** No ability to favorite, rate, or interact with games beyond viewing metadata at this stage
- **Filtering or Advanced Search:** No filters by platform, genre, release date, or other criteria
- **Game Recommendations:** No similar games or personalized recommendations
- **Offline/Cached Search:** Search requires active IGDB API connection; no offline search capability
