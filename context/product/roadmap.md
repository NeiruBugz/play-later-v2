# Product Roadmap: SavePoint

_This roadmap outlines our strategic direction based on customer needs and business goals. It focuses on the "what" and "why," not the technical "how."_

---

## Phase 1: Core Foundation _(Complete)_

_The highest priority features that form the core foundation of SavePoint—enabling users to track their gaming library and begin journaling._

- [x] **Technical Foundation & Refactoring**
  - [x] **IGDB Integration Consolidation:** Refactor IGDB implementation to eliminate duplication between `shared/lib/igdb.ts` and `data-access-layer/services/igdb/igdb-service.ts`. Extract types to `igdb-api-types` package for unified type definitions. Deprecate legacy utility in favor of service layer pattern.

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

## Phase 2: Near-Term Priorities

_Specced features in implementation order. Each has a functional specification in `context/spec/`._

- [x] **Code Health & Developer Experience** _(Spec 004 — Completed)_

  - [x] **P0: Immediate Fixes**
    - [x] Add Playwright MCP to .mcp.json for UI verification (AI-07)
    - [x] Add PreToolUse security hooks in .claude/settings.json (SEC-02)
    - [x] Add *.key to root .gitignore (SEC-05)

  - [x] **P1: Fix Soon**
    - [x] Trim all CLAUDE.md files to <200 lines (AI-06)
    - [x] Add CLAUDE.md for lambdas-py/ and infra/ (AI-01)
    - [x] Fix stale README claims: add lambdas-py, update feature dirs, replace Bun refs (DOC-04)
    - [x] Move library-status-redesign spec to context/spec/ (SDD-04)

  - [x] **P2: Improve When Possible**
    - [x] Split igdb-service.unit.test.ts into focused suites (ARCH-06)
    - [x] Fix DAL→features reverse imports and @prisma/client leakage (ARCH-02/04)
    - [x] Configure Dependabot or Renovate for automated dependency updates (SBP-07)

- [x] **Steam Library Integration — Stage 1: Technical Foundation** _(Spec 002 — Completed)_
  - [x] **Lambda Integration:** Connect existing Lambda pipeline (fetch Steam library → IGDB enrichment → `ImportedGame` staging table)
  - [x] **Feature Flag:** Environment-based toggle to disable Steam import flow in production (avoid AWS costs until ready)
  - [x] **Local Testing:** SAM/LocalStack setup for local Lambda invocation during development
  - [x] Steam profile connection UI (Steam ID input)
  - [x] Imported games stored in `ImportedGame` table (existing schema: storefront, playtime, IGDB match status)

- [x] **Library Status Redesign** _(Spec 005 — Completed)_

  _Redesigned the 4-status model based on real user feedback. Addressed confusion around "Owned" status, added replay intent, and created a unified "what can I play?" view. See [spec](../spec/005-library-status-redesign/functional-spec.md)._

- [ ] **Code Health & Developer Experience (Round 2)** _(Spec 006)_

  - [ ] **P0: Immediate Fixes**
    - [ ] Create root CLAUDE.md with project purpose, cross-service architecture, and key commands (AI-01)

  - [ ] **P1: Fix Soon**
    - [ ] Add dev server run instructions (pnpm dev, env vars, DB setup) to CLAUDE.md ecosystem (AI-07)
    - [ ] Create specs for new features before implementation; target 70%+ spec-to-branch ratio (SDD-04)
    - [ ] Generate tasks.md for spec 005-library-status-redesign (SDD-05)
    - [ ] Include cross-layer changes (lambdas-py, infra) in feature branches when features span layers (E2E-01)

  - [ ] **P2: Improve When Possible**
    - [ ] Fix 3 repository bypass violations — route through service layer (ARCH-02)
    - [ ] Remove directory trees and code templates from CLAUDE.md files (AI-06)
    - [ ] Add *.p12, *.pfx, credentials*, secrets* to .gitignore (SEC-05)
    - [ ] Fix dead link in savepoint-app/README.md; add README to scripts/ (DOC-02/04)
    - [ ] Add root Makefile/Taskfile with cross-layer commands; extend PR checks to lambdas-py (E2E-05)

- [x] **FSD Architecture Compliance** _(Spec 007)_

  _Fix FSD layer violations, missing public APIs, and domain code cleanup. See [spec](../spec/007-fsd-architecture-compliance/functional-spec.md)._

- [ ] **Steam Library Integration — Stages 2 & 3: Curation** _(Spec 003)_

  _Philosophy: SavePoint is for games you intend to experience, not a catalog. Steam import is curation, not bulk transfer. See [Product Definition](product-definition.md#23-ux-principles)._

  - [ ] **Stage 2: Individual Curation Interface**
    - [ ] Paginated list of imported Steam games with sorting/filtering
    - [ ] Individual import: click game → auto-match IGDB via Steam App ID → add to library
    - [ ] Manual IGDB search for games that don't auto-match
    - [ ] Smart status assignment (playtime/recency → Owned/Playing/Played)
    - [ ] Dismiss action to soft-delete unwanted games from list

  - [ ] **Stage 3: Bulk Selection & Import**
    - [ ] Checkbox selection on each game row
    - [ ] Bulk actions: Select All / Deselect All / Select All on Page
    - [ ] Bulk import: import multiple selected games at once
    - [ ] Selection state persists across pagination

- [ ] **Social Engagement** _(Spec 008)_

  _Follow other users, view activity feed of status changes and library adds. Includes public user profiles. See [spec](../spec/008-social-engagement/functional-spec.md)._
  - [ ] Public user profiles with display name, avatar, stats, recent activity, and library preview
  - [ ] Profile visibility toggle (public/private)
  - [ ] Follow/unfollow from profile pages with public follow lists
  - [ ] Activity feed widget on dashboard (status changes + library adds from followed users)
  - [ ] Empty state with popular activity for users with no follows

---

## Phase 3: Platform Integrations

_Expand library import beyond Steam to other major gaming platforms._

- [ ] **Steam Library Integration — Stage 4: Ongoing Sync**
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

---

## Phase 4: Community & Discovery

_Features planned for future consideration. Their priority and scope may be refined based on user feedback from earlier phases._

- [ ] **Community Reflections**
  - [ ] **Public Reflections:** Enable users to optionally make their journal entries public to share perspectives with the community.
  - [ ] **Browse Community Reflections:** Allow users to read how others experienced the same games before diving in themselves.

- [ ] **Curated Collections**
  - [ ] **Create Themed Collections:** Allow users to create personal, themed collections (e.g., "Cozy Winter Games," "Games That Made Me Think") from their library.
  - [ ] **Browse Personal Collections:** Display all of a user's collections in an organized view for easy navigation.

- [ ] **Discovery & Exploration**
  - [ ] **Similar Games Discovery:** Show similar game recommendations based on IGDB data to help users discover their next experience.
  - [ ] **Enhanced Game Details:** Add franchise information, expansions, and related games to detail pages.

- [ ] **Advanced Discovery**
  - [ ] **Mood-Based Recommendations:** Help users find "the right game for right now" through mood-based filtering ("I want something cozy tonight").
  - [ ] **Community Collections:** Allow users to share their themed collections publicly for others to discover and draw inspiration from.
