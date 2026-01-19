# Product Roadmap: SavePoint

_This roadmap outlines our strategic direction based on customer needs and business goals. It focuses on the "what" and "why," not the technical "how."_

---

### Phase 1: Core Foundation

_The highest priority features that form the core foundation of SavePoint—enabling users to track their gaming library and begin journaling._

- [x] **Technical Foundation & Refactoring**
  - [x] **IGDB Integration Consolidation:** Refactor IGDB implementation to eliminate duplication between `shared/lib/igdb.ts` and `data-access-layer/services/igdb/igdb-service.ts`. Extract types to `igdb-api-types` package for unified type definitions. Deprecate legacy utility in favor of service layer pattern. ✅ **Completed:** All 18 methods migrated, legacy implementation removed, comprehensive documentation in place.

- [x] **User Account Essentials**
  - [x] **Google OAuth Sign-Up & Login:** Allow users to create an account and sign in using Google OAuth as the primary authentication method.
  - [x] **Credentials-Based Login:** Provide email/password authentication as a secondary option, primarily for testing and development scenarios (E2E tests with Playwright).
  - [x] **Basic Profile Management:** Enable users to view and update their name and basic profile information after signing up.

- [x] **Game Metadata Foundation**
  - [x] **IGDB Integration:** Connect to IGDB as the primary source for game metadata, covers, descriptions, release dates, and platform information.
  - [x] **Game Search:** Allow users to search for games via IGDB to add to their library.
  - [x] **Game Detail Pages:** Create rich game detail pages showing IGDB metadata and user's personal journal entries for that game.

- [x] **Personal Gaming Library**
  - [x] **Add Games to Library:** Enable users to add games from IGDB search results to their personal library.
  - [x] **Journey Status Tracking:** Allow users to mark games with status indicators (Want to Play, Owned, Playing, Played) to organize their collection by intent.
  - [x] **Library View & Organization:** Display the user's gaming library in a clear, browsable format with filtering by status and platform.

- [x] **Gaming Journal**
  - [x] **Write Journal Entries:** Provide a form for users to write reflections and memories about their gaming experiences, linked to specific games.
  - [x] **View Personal Journal:** Display a chronological timeline of the user's journal entries to revisit past reflections.

---

### Phase 2: Enhanced Discovery & Integration

_Once the foundational features are complete, we will move on to these high-value additions that enhance discovery and reduce manual work._

- [ ] **Steam Library Integration**

  _Philosophy: SavePoint is for games you intend to experience, not a catalog. Steam import is curation, not bulk transfer. See [Product Definition](product-definition.md#23-ux-principles)._
  - [ ] **Stage 1: Technical Foundation**
    - [ ] **Lambda Integration:** Connect existing Lambda pipeline (fetch Steam library → IGDB enrichment → `ImportedGame` staging table)
    - [ ] **Feature Flag:** Environment-based toggle to disable Steam import flow in production (avoid AWS costs until ready)
    - [ ] **Local Testing:** SAM/LocalStack setup for local Lambda invocation during development
    - [ ] Steam profile connection UI (Steam ID input)
    - [ ] Imported games stored in `ImportedGame` table (existing schema: storefront, playtime, IGDB match status)

  - [ ] **Stage 2: Curation UX Research**
    - [ ] Research: How to present 100+ games without overwhelming users
    - [ ] Evaluate approaches: playtime filtering, configurable criteria, smart grouping
    - [ ] Define the curation flow and create functional spec

  - [ ] **Stage 3: Curation Interface**
    - [ ] Present imported games for user selection ("Choose games to track")
    - [ ] Smart defaults: games with playtime pre-selected, never-launched unchecked
    - [ ] Bulk actions: Select All / Deselect All
    - [ ] Selected games added to library with chosen status

  - [ ] **Stage 4: Ongoing Sync**
    - [ ] Re-import detects new games only (no duplicates)
    - [ ] Optional: periodic sync for new purchases

- [ ] **PlayStation Trophy Integration** _(Research Complete)_

  _Import games based on earned trophies. Uses unofficial PSN API with "About Me" verification (same approach as PSNProfiles). See [research/playstation-integration.md](../research/playstation-integration.md)._

  - [ ] **Stage 1: Account Linking**
    - [ ] PSN username input with verification code flow
    - [ ] "About Me" verification via psn-api library
    - [ ] Store verified PSN account link in database

  - [ ] **Stage 2: Trophy Import**
    - [ ] Fetch trophy list (games with trophies earned)
    - [ ] Match to IGDB games (similar to Steam import)
    - [ ] Store in `ImportedGame` staging table

  - [ ] **Stage 3: Curation** _(Shared with Steam)_
    - [ ] Reuse Steam import curation UI
    - [ ] User selects which trophy games to track

- [ ] **Xbox Game Pass Integration** _(Research Complete)_

  _Import games and achievements via OpenXBL API. Supports full game library (not just achievements). See [research/xbox-integration.md](../research/xbox-integration.md)._

  - [ ] **Stage 1: Account Linking**
    - [ ] OpenXBL OAuth integration ("Login with Xbox")
    - [ ] Store Xbox XUID and access credentials
    - [ ] Gamertag display in user profile

  - [ ] **Stage 2: Game Import**
    - [ ] Fetch title history (full owned games)
    - [ ] Match to IGDB games (similar to Steam import)
    - [ ] Store in `ImportedGame` staging table
    - [ ] Include achievement data for enrichment

  - [ ] **Stage 3: Curation** _(Shared with Steam/PlayStation)_
    - [ ] Reuse platform import curation UI
    - [ ] User selects which Xbox games to track

- [ ] **Discovery & Exploration**
  - [ ] **Similar Games Discovery:** Show similar game recommendations based on IGDB data to help users discover their next experience.
  - [ ] **Enhanced Game Details:** Add franchise information, expansions, and related games to detail pages.

- [ ] **Curated Collections**
  - [ ] **Create Themed Collections:** Allow users to create personal, themed collections (e.g., "Cozy Winter Games," "Games That Made Me Think") from their library.
  - [ ] **Browse Personal Collections:** Display all of a user's collections in an organized view for easy navigation.

---

### Phase 3: Community & Social Features

_Features planned for future consideration. Their priority and scope may be refined based on user feedback from earlier phases._

- [ ] **Community Reflections**
  - [ ] **Public Reflections:** Enable users to optionally make their journal entries public to share perspectives with the community.
  - [ ] **Browse Community Reflections:** Allow users to read how others experienced the same games before diving in themselves.
  - [ ] **User Profiles:** Create public user profiles showing shared collections and public journal entries.

- [ ] **Social Engagement**
  - [ ] **Follow Other Users:** Allow users to follow other patient gamers whose taste and perspectives resonate with them.
  - [ ] **Activity Feed:** Display a feed of gaming reflections and collection updates from followed users (inspired by Letterboxd and Goodreads).
  - [ ] **Reflection Likes & Engagement:** Enable users to like and engage with others' reflections to build community connection.

- [ ] **Advanced Discovery**
  - [ ] **Mood-Based Recommendations:** Help users find "the right game for right now" through mood-based filtering ("I want something cozy tonight").
  - [ ] **Community Collections:** Allow users to share their themed collections publicly for others to discover and draw inspiration from.

---
