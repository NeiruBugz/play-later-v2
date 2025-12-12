# Functional Specification: Steam Library Import Pipeline (Python Lambdas)

- **Roadmap Item:** Monorepo Consolidation - Migrate `play-later-lambdas` repository into monorepo under `lambdas-py/` with Python implementation
- **Status:** Draft
- **Author:** Claude

---

## 1. Overview and Rationale (The "Why")

### Problem Statement

Patient gamers accumulate large game libraries across platforms like Steam (500-2000+ games). Manually adding each game to SavePoint one-by-one is impractical and creates friction that prevents users from curating their full collection.

### Solution

Provide automated Steam library import that fetches the user's games, enriches them with IGDB metadata, and adds them to their gaming library—transforming a tedious manual process into a one-click experience.

### User Value

- **Reduced friction:** Users can import their entire Steam library with one action
- **Enriched metadata:** Imported games automatically get IGDB data (covers, descriptions, release dates)
- **Awareness of collection:** Users gain visibility into their full gaming backlog
- **Foundation for journaling:** Imported games are ready for users to journal about

### Success Metrics

- Users successfully import their Steam libraries
- Imported games appear in user's library with IGDB metadata
- Import completion rate for large libraries (500+ games)
- Time to complete full import pipeline

---

## 2. Functional Requirements (The "What")

### 2.1 Steam Library Fetch

**As a** user with a Steam account, **I want to** connect my Steam account and import my game library, **so that** I can see all my Steam games in SavePoint without manual entry.

**Acceptance Criteria:**

- [ ] When user initiates import with their Steam ID, the system fetches their owned games from Steam Web API
- [ ] System retrieves game name, Steam app ID, playtime, and icon URLs for each game
- [ ] System filters out non-game content (DLC, demos, soundtracks, tools) before processing
- [ ] System stores raw import data to S3 for durability and retry capability
- [ ] Import supports libraries up to 2000+ games

### 2.2 IGDB Enrichment

**As a** user who imported their Steam library, **I want** my games to be enriched with metadata from IGDB, **so that** I see cover images, descriptions, and release dates.

**Acceptance Criteria:**

- [ ] System matches Steam games to IGDB entries via external game ID lookup
- [ ] Matched games receive: title, description, cover image, release date, slug, genres, platforms
- [ ] System respects IGDB rate limits (4 requests/second) with adaptive backoff
- [ ] Enrichment results are stored to S3 before database import
- [ ] Games that cannot be matched to IGDB are flagged for manual resolution

### 2.3 Database Import

**As a** user, **I want** my imported and enriched games to appear in my gaming library, **so that** I can start organizing and journaling about them.

**Acceptance Criteria:**

- [ ] All imported games are stored in `ImportedGame` table (raw Steam data)
- [ ] Successfully matched games create/update `Game` records with IGDB data
- [ ] Successfully matched games automatically create `LibraryItem` records with status based on playtime:
  - Playtime = 0 hours → "Curious About" status
  - Playtime > 0 hours → "Experienced" status
- [ ] Playtime from Steam is preserved on the `ImportedGame` record
- [ ] Games that couldn't be matched to IGDB remain in `ImportedGame` with a flag for manual resolution
- [ ] Duplicate imports update existing records rather than creating duplicates

### 2.4 Re-Import and Sync

**As a** user who has previously imported, **I want to** re-import my Steam library, **so that** newly purchased games are added to SavePoint.

**Acceptance Criteria:**

- [ ] User can manually trigger a re-import at any time
- [ ] System performs automatic periodic sync (frequency TBD - daily/weekly)
- [ ] Re-import identifies new games since last import
- [ ] Existing games are updated (e.g., new playtime) rather than duplicated
- [ ] User is notified of import results (new games added, games updated)

### 2.5 Unmatched Games Handling

**As a** user with obscure/indie games that couldn't be auto-matched, **I want to** see these games and manually link them to IGDB, **so that** my full library is represented.

**Acceptance Criteria:**

- [ ] Unmatched games appear in a dedicated "Needs Review" or "Imported Games" view
- [ ] Each unmatched game shows: name, Steam app ID, playtime, import date
- [ ] User can search IGDB and manually link an unmatched game to an IGDB entry
- [ ] Once linked, the game follows normal enrichment → library flow
- [ ] User can mark games as "ignored" if they don't want them in their library

---

## 3. Scope and Boundaries

### In-Scope

- Three-Lambda pipeline architecture (Steam→S3, S3→IGDB→S3, S3→DB)
- Python 3.12 implementation with SQLAlchemy
- Steam Web API integration for fetching owned games
- IGDB API integration for metadata enrichment
- S3 for intermediate data storage
- Steam app classification (filtering DLC, demos, tools)
- Manual re-import capability
- Automatic periodic sync (basic implementation)
- Unmatched games tracking and flagging

### Out-of-Scope (Separate Roadmap Items)

- **Gaming Journal** - Write/view journal entries (Phase 1)
- **Steam Library Import UI** - Frontend for initiating/viewing imports (separate spec)
- **Similar Games Discovery** - IGDB-based recommendations (Phase 2)
- **Enhanced Game Details** - Franchise info, expansions (Phase 2)
- **Curated Collections** - Themed collections feature (Phase 2)
- **Community Reflections** - Public journal entries (Phase 3)
- **Other Platform Integrations** - Xbox, PlayStation, Epic, GOG (Phase 3)
- **Achievement/progress sync** - Not included in this spec
- **Manual linking UI** - Frontend for linking unmatched games (separate spec)
