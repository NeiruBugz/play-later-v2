# Functional Specification: Related Games Categorization

## 1. Overview and Rationale

### 1.1. Purpose

The primary purpose of this feature is to enhance the game detail page by providing a more structured and intuitive display of related game content. Currently, related games might appear as a flat list, making it difficult for users to understand the nature of the relationship (e.g., is it an expansion, a remake, or just another game in the series?). By categorizing these relationships, users can more easily discover content relevant to their interests for a specific game.

### 1.2. User Value

Users gain significant value by having related games clearly categorized. This helps them:
- **Discover expansions and DLCs:** Easily find additional content for a game they enjoy.
- **Understand game lineage:** See the original version of a remake or remaster, providing historical context.
- **Explore entire franchises:** Navigate through a series to find other main entries and remakes without being overwhelmed by unrelated titles or DLCs.
- **Reduce friction in discovery:** Spend less time sifting through a generic list, and more time engaging with relevant content.

## 2. Functional Requirements

### 2.1. Display of Related Games

On a game's detail page, a new section for "Related Games" shall be displayed. This section will be organized into distinct categories presented as a tabbed interface.

#### 2.1.1. Categories and Content

The following categories shall be displayed, populated by data retrieved from IGDB:

*   **DLC (Downloadable Content):**
    *   **Content:** This tab shall display games identified by IGDB as Downloadable Content (DLC) or Expansions for the current game.
    *   **Acceptance Criteria:**
        *   Given a game with associated DLCs/Expansions, when viewing its detail page, then a "DLC" tab is visible and populated with the relevant games.
        *   Given a game with no associated DLCs/Expansions, when viewing its detail page, then the "DLC" tab is not displayed.

*   **Ports:**
    *   **Content:** This tab shall display the "Original Version" or "Source Material" of the current game, if the current game is a remake or remaster. For example, if viewing "Final Fantasy VII Remake", this tab should display "Final Fantasy VII" (1997).
    *   **Acceptance Criteria:**
        *   Given a remake or remaster game with an identifiable original version (parent game), when viewing its detail page, then a "Ports" tab is visible and populated with the original game.
        *   Given a game that is not a remake or remaster, or for which no original version can be identified, when viewing its detail page, then the "Ports" tab is not displayed.

*   **Remakes:**
    *   **Content:** This tab shall display other games that are identified by IGDB as remakes or remasters of the current game. For example, if viewing "Final Fantasy VII" (1997), this tab should display "Final Fantasy VII Remake".
    *   **Acceptance Criteria:**
        *   Given a game with identifiable remakes or remasters, when viewing its detail page, then a "Remakes" tab is visible and populated with the relevant games.
        *   Given a game with no identifiable remakes or remasters, when viewing its detail page, then the "Remakes" tab is not displayed.

*   **Series:**
    *   **Content:** This tab shall display other "Main Games" and "Remakes" within the same game collection or franchise as the current game, as identified by IGDB. This tab should exclude any games already listed under the "DLC", "Ports", or "Remakes" tabs to avoid duplication.
    *   **Acceptance Criteria:**
        *   Given a game belonging to a series with other main entries or remakes, when viewing its detail page, then a "Series" tab is visible and populated with the relevant games, excluding those already displayed in other related game tabs.
        *   Given a game not belonging to a series, or where all other series games are already listed in other tabs, when viewing its detail page, then the "Series" tab is not displayed.

#### 2.1.2. Tab Ordering

The tabs shall be ordered as follows from left to right:
1.  DLC
2.  Ports
3.  Remakes
4.  Series

#### 2.1.3. Empty Tab Handling

If a category has no associated games, its corresponding tab shall not be displayed.

#### 2.1.4. Game Display within Tabs

Within each tab, related games shall be displayed as clickable entries, typically showing their cover art and title. Clicking on a game entry shall navigate the user to that game's detail page.

### 2.2. Data Source

All related game information (DLCs, expansions, remakes, ports/originals, and series data) shall be sourced exclusively from IGDB. The application will rely on IGDB's defined relationships (e.g., `dlcs`, `expansions`, `remakes`, `remasters`, `parent_game`, `collection`) to populate these categories.

## 3. Acceptance Criteria

*   **GIVEN** a user is viewing a game detail page,
*   **WHEN** the game has associated DLC/Expansions,
*   **THEN** a "DLC" tab is displayed, containing a list of these games, and clicking any listed game navigates to its detail page.

*   **GIVEN** a user is viewing a game detail page for a remake/remaster (e.g., "Final Fantasy VII Remake"),
*   **WHEN** an original version of the game is identifiable (e.g., "Final Fantasy VII" (1997)),
*   **THEN** a "Ports" tab is displayed, containing the original game, and clicking it navigates to its detail page.

*   **GIVEN** a user is viewing a game detail page for an original game (e.g., "Final Fantasy VII" (1997)),
*   **WHEN** remakes or remasters of that game are identifiable (e.g., "Final Fantasy VII Remake"),
*   **THEN** a "Remakes" tab is displayed, containing a list of these remakes/remasters, and clicking any listed game navigates to its detail page.

*   **GIVEN** a user is viewing a game detail page,
*   **WHEN** the game belongs to a series with other main entries or remakes (not already listed as DLC, Ports, or Remakes),
*   **THEN** a "Series" tab is displayed, containing a list of these games, and clicking any listed game navigates to its detail page.

*   **GIVEN** a user is viewing a game detail page,
*   **WHEN** a category (DLC, Ports, Remakes, or Series) has no associated games,
*   **THEN** the tab for that specific category is not displayed.

*   **GIVEN** a user is viewing a game detail page,
*   **WHEN** multiple categories are displayed,
*   **THEN** the tabs are ordered from left to right: DLC, Ports, Remakes, Series.

## 4. Out of Scope

The following items are explicitly out of scope for this functional specification and will not be addressed as part of this feature:

*   **Manual Relationship Management:** There will be no functionality for users or administrators to manually add, remove, or modify game relationships. All relationships are derived solely from IGDB data.
*   **Relationship Type Customization:** The specific categories (DLC, Ports, Remakes, Series) are fixed and cannot be customized by users.
*   **Display of non-IGDB related content:** Any related game information not directly available or inferable from IGDB data (e.g., fan-made content, unofficial mods) is out of scope.
*   **Advanced Filtering/Sorting within tabs:** Within each tab, games will be displayed in an order provided by IGDB or a default order (e.g., by release date, title), without additional user-facing sorting or filtering options.
*   **Social Features (following users, reflection likes, activity feeds)** (Roadmap item)
*   **Additional platform integrations (Xbox, PlayStation, Epic Games, GOG API, etc.)** (Roadmap item)
*   **Mood-based game recommendations ("I want something cozy tonight")** (Roadmap item)
*   **Mobile application for journaling on-the-go** (Roadmap item)
*   **Photo/screenshot uploads to journal entries** (Roadmap item)
