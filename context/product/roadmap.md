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

- [x] **Steam Library Integration — Stage 1: Technical Foundation** _(Spec 002 — Completed)_
  - [x] **Lambda Integration:** Connect existing Lambda pipeline (fetch Steam library → IGDB enrichment → `ImportedGame` staging table)
  - [x] **Feature Flag:** Environment-based toggle to disable Steam import flow in production (avoid AWS costs until ready)
  - [x] **Local Testing:** SAM/LocalStack setup for local Lambda invocation during development
  - [x] Steam profile connection UI (Steam ID input)
  - [x] Imported games stored in `ImportedGame` table (existing schema: storefront, playtime, IGDB match status)

- [x] **Code Health & Developer Experience** _(Spec 004 — Completed)_
- [x] **Library Status Redesign** _(Spec 005 — Completed)_
- [x] **FSD Architecture Compliance** _(Spec 007 — Completed)_

- [x] **Social Engagement** _(Spec 008 — Completed)_

  _Follow other users, view activity feed of status changes and library adds. Includes public user profiles. See [spec](../spec/008-social-engagement/functional-spec.md)._
  - [x] Public user profiles with display name, avatar, stats, recent activity, and library preview
  - [x] Profile visibility toggle (public/private)
  - [x] Follow/unfollow from profile pages with public follow lists
  - [x] Activity feed widget on dashboard (status changes + library adds from followed users)
  - [x] Empty state with popular activity for users with no follows

---

## Phase 2: Internal Depth & Polish

_Everything we can ship on our own data + IGDB, with no AWS / external platform dependencies. Deepens the social, reflection, curation, and discovery surfaces, and hardens dashboard and polish. Ships before Platform Integrations so the product is mature before bulk library imports land._

### Shipped

- [x] **Next.js 16 Feature Adoption** _(Spec 010 — Completed)_

  _Adopted `cacheComponents` for back-nav state preservation, migrated all `unstable_cache` to `"use cache"` directive, added 24h caching to platform endpoints, enabled `experimental.viewTransition` with cover-image morphs across Library/Search/Detail routes. 1,209 tests pass, zero `unstable_cache` imports remain. See [spec](../spec/010-nextjs-16-feature-adoption/functional-spec.md)._

- [x] **Code Health & Developer Experience (Round 2)** _(Spec 006 — Completed)_

  _Shipped in PR #184 plus follow-ups. Root `CLAUDE.md`, `Makefile`, `scripts/README.md`, repository-bypass fixes, `.gitignore` hardening, `lambdas-py` CI job all merged._
  - [x] **P0:** Root CLAUDE.md with project purpose, cross-service architecture, and key commands (AI-01)
  - [x] **P1:** Dev server run instructions in CLAUDE.md ecosystem (AI-07); tasks.md generated for spec 005 (SDD-05); cross-layer branching convention documented (E2E-01)
  - [x] **P2:** Repository bypass violations fixed (ARCH-02); CLAUDE.md files trimmed (AI-06); `.gitignore` hardened for certs/secrets (SEC-05); stale `savepoint-app/README.md` link fixed and `scripts/README.md` added (DOC-02/04); root `Makefile` with cross-layer targets and `lambdas-py` CI job added (E2E-05)

### 2A · Data Foundations

_Primitives that unlock the rest of the phase._

- [x] **Star Ratings** _(Spec 011)_
  - [ ] 1–10 (or 1–5 with half-steps) rating on each library entry
  - [ ] Rating visible on library cards and game detail
  - [ ] Sort/filter library by rating
  - [ ] Rating histogram on personal profile

- [ ] **Per-Playthrough Logs** _(Spec TBD)_

  _Support replays, New Game+, and multiple completions. A library entry becomes a container for one or more playthroughs, each with its own start/end date, rating, platform, and optional notes._
  - [ ] Multiple playthrough records per library entry
  - [ ] Per-playthrough rating + dates + platform
  - [ ] Playthrough timeline on game detail (personal view)
  - [ ] Journal/review entries can attach to a specific playthrough

### 2B · Reflection & Reviews

_Two distinct models: private long-form Journal vs public short-form Reviews._

- [ ] **Reviews** _(Spec TBD)_

  _Short-form, public, rated takes on a game. Distinct from Journal entries (which remain private, long-form, and reflective). Product framing: Journal = "what this game meant to me", Review = "should you play this"._
  - [ ] Write a review tied to a library entry + rating
  - [ ] Public review feed on game detail pages
  - [ ] Personal review history on profile
  - [ ] Review visibility setting (public/private/followers)
  - [ ] Clear UX separation from Journal entries

- [ ] **Community Reflections** _(Spec TBD)_

  _Builds on the already-shipped public profiles from Spec 008._
  - [ ] **Public Reflections:** Enable users to optionally make their journal entries public to share perspectives with the community.
  - [ ] **Browse Community Reflections:** Allow users to read how others experienced the same games before diving in themselves.

### 2C · Community Surfaces

_Aggregate community data, surfaced where it's decision-useful._

- [ ] **Aggregate Game Stats** _(Spec TBD)_

  _Community data surfaced on game detail pages. Depends on ratings and reviews shipping first._
  - [ ] Play counts (playing / played / backlog / wishlist)
  - [ ] Average community rating + rating histogram
  - [ ] Average / median completion time (from status-change timestamps)
  - [ ] Review count and recent reviews snippet

- [ ] **Profile Slug Resolution** _(Spec TBD)_

  _`/u/[slug]` gracefully handles display-name-style misses: suggest closest username match and surface a "did you mean…" experience instead of a hard 404._

### 2D · Curation

- [ ] **Curated Collections** _(Spec TBD)_
  - [ ] **Create Themed Collections:** Allow users to create personal, themed collections (e.g., "Cozy Winter Games," "Games That Made Me Think") from their library.
  - [ ] **Browse Personal Collections:** Display all of a user's collections in an organized view for easy navigation.

  _Public sharing stays in Phase 4 under Community Collections._

### 2E · Discovery

_Uses already-integrated IGDB — no new external dependency._

- [ ] **Similar Games Discovery** _(Spec TBD)_ — IGDB-driven recommendations on game detail.
- [ ] **Enhanced Game Details** _(Spec TBD)_ — franchise, series, expansions, and related games on detail pages.
- [ ] **Browse / Catalog** _(Spec TBD)_ — first-class IGDB browse surface (trending, recent releases, by genre) so users have something to do when their library feels dull.
- [ ] **Mood-Based Recommendations** _(Spec TBD)_ — "I want something cozy tonight" filter over library + IGDB.

### 2F · Dashboard & Retention

_Reclaim the empty real estate on the dashboard._

- [ ] **Upcoming Releases Widget** _(Spec TBD)_ — countdowns for unreleased wishlisted games using IGDB release dates.
- [ ] **YTD Stats Card** _(Spec TBD)_ — games finished this year, hours logged, journal entries written, top genres / platforms.
- [ ] **"Pick up where you left off"** _(Spec TBD)_ — surface oldest `Playing` with days-since-last-update to nudge against backlog guilt.
- [ ] **Year-in-Review / Wrapped** _(Spec TBD)_ — shareable year-end stat card (finished, hours, top-rated, top genres). Depends on Ratings.

### 2G · Polish & Power Use

- [ ] **Fallback Cover Rendering** _(Spec TBD)_ — typographic cover from title + platform color when IGDB art is missing or not yet cached.
- [ ] **In-Page Status Toggles** _(Spec TBD)_ — Played / Playing / Shelf / Wishlist / Up Next one-click on game detail (no modal).
- [ ] **Global Quick-Log CTA** _(Spec TBD)_ — persistent header entry point (button + ⌘K) to log/add a game from any page, with smart default status.
- [ ] **Bulk Library Actions** _(Spec TBD)_ — multi-select on library with bulk status change / delete. Useful independent of Steam import.
- [ ] **Keyboard Navigation Palette** _(Spec TBD)_ — `g l` → library, `g j` → journal, `n` → new log, etc.

### 2H · Layout & UI Refresh

_The cyberpunk / terminal aesthetic is a brand asset — keep it. The problem is density: the dashboard wastes ~30–40% of viewport real estate below the fold, and there are no time-sensitive surfaces. This cluster reclaims that space and adds industry context._

- [ ] **Bento Dashboard Reflow** _(Spec TBD)_

  _Denser, viewport-filling dashboard on a 12-column grid with consistent height tiers. Widgets include existing (Library stats, Activity, Playing, Up Next, Recently Added) plus new (Upcoming Releases, YTD Stats, Pick Up Where You Left Off, Gaming Events)._
  - [ ] 12-col responsive grid with height tiers
  - [ ] Fill viewport on ≥1280px; graceful stacking on mobile/tablet
  - [ ] Consistent widget chrome aligned with the terminal aesthetic

- [ ] **Gaming Events Calendar** _(Spec TBD)_

  _Industry event countdowns: Summer Games Fest, Gamescom, The Game Awards, Nintendo Direct, PlayStation State of Play, Xbox Showcase. Integrate with the IGDB events endpoint for automatic updates — no hand-curation burden._
  - [ ] IGDB events endpoint integration (fetch + cache)
  - [ ] Dashboard widget with next 3–5 upcoming events + countdowns
  - [ ] Dedicated `/events` page with full calendar view
  - [ ] Event detail: date, stream link, expected announcements (where available)
  - [ ] Optional: notify/remind me for an event (later milestone)

- [ ] **Library View Modes** _(Spec TBD)_
  - [ ] Grid (current default)
  - [ ] Compact grid (more cards per row)
  - [ ] Dense list (table with title + status + rating + platform + playtime)
  - [ ] View preference persists per user

- [ ] **Game Detail Redesign** _(Spec TBD)_

  _One coordinated redesign pass instead of piecemeal additions across specs._
  - [ ] Hero with blurred cover backdrop
  - [ ] One-click status strip (no modal)
  - [ ] Stats column: personal (playthroughs, your rating, journal count) + community (aggregate stats from 2C)
  - [ ] Playthrough timeline
  - [ ] Reviews feed

- [ ] **Theme Variants & Density Modes** _(Spec TBD)_
  - [ ] Keep "Terminal Green" as default
  - [ ] Add at least one contrast variant (e.g., "Paper" / light, "Amber" retro)
  - [ ] Comfortable / compact density toggle applied app-wide
  - [ ] Preferences persist per user

- [ ] **Logged-Out Landing Page** _(Spec TBD)_

  _Currently `/` likely redirects to auth. A proper marketing landing page in the product's aesthetic makes SavePoint shareable and gives the terminal/cyberpunk brand a public face._
  - [ ] Hero with product pitch + screenshots
  - [ ] Feature highlights (library, journal, reviews, events, imports)
  - [ ] Sign in / sign up CTAs
  - [ ] Public profile / library preview links for SEO

---

## Phase 3: Platform Integrations

_Expand library import to external gaming platforms. Gated on external APIs (Steam, PSN, Xbox) and the AWS Lambda enrichment pipeline. Deferred until Phase 2 internal work is shipped so progress is not blocked by third-party constraints._

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

## Phase 4: Community Scaling

_Features that build on Phase 2 community foundations. Depends on Curated Collections shipping first._

- [ ] **Community Collections**
  - [ ] Allow users to share their themed collections publicly for others to discover and draw inspiration from.
