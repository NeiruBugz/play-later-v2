# Functional Specification: Steam Library Integration - Stage 1 Technical Foundation

- **Roadmap Item:** Steam Library Integration - Stage 1: Technical Foundation
- **Status:** Draft
- **Author:** Claude (AI Assistant)

---

## 1. Overview and Rationale (The "Why")

### Context

Patient gamers often have accumulated large game libraries across platforms like Steam (200+ games is common). Manually adding each game to SavePoint is tedious and creates friction that discourages adoption. Users need a way to bring awareness of their existing collections into SavePoint while maintaining the philosophy that **SavePoint is for games you intend to experience, not a catalog**.

### Problem Statement

Without Steam integration, users must manually search and add each game they want to track. This creates a high barrier to entry, especially for users with large Steam libraries who want to curate their collection intentionally.

### Desired Outcome

Users can connect their Steam account to SavePoint and see their owned games, setting the foundation for curated import in later stages. Stage 1 establishes the technical infrastructure and basic UI scaffolding for two import paths:

1. **Manual Import Path** (always enabled): User-controlled, on-demand fetching with webapp-based IGDB enrichment
2. **Background Sync Path** (feature-flagged): Automated Lambda pipeline for bulk processing

### Success Criteria

- Users can successfully connect their Steam account (via OAuth or manual ID entry)
- Steam profile info (ID, display name, avatar) is persisted to the user record
- Both import path UIs are scaffolded and accessible
- Imported games are viewable with search, filtering, sorting, and pagination
- Lambda integration works locally in development
- Background sync option is visible but disabled in production
- No AWS costs incurred in production until ready

---

## 2. Functional Requirements (The "What")

### 2.1 Steam Account Connection

**As a** user, **I want to** connect my Steam account to SavePoint, **so that** I can import my game library.

**Acceptance Criteria:**

- [ ] User can access "Connect Steam" from both the Profile/Settings page AND the Library page
- [ ] User can connect via Steam OpenID OAuth (primary method)
- [ ] User can alternatively enter their Steam ID manually (17-digit Steam ID64 or custom URL like `steamcommunity.com/id/username`)
- [ ] Upon successful connection, the following is persisted to the User record:
  - Steam ID64
  - Steam display name
  - Steam avatar URL
- [ ] User sees confirmation message: "Steam account connected successfully"
- [ ] Connected Steam account info is displayed in the Profile/Settings area

### 2.2 Import Path Selection

**As a** user with a connected Steam account, **I want to** choose how to import my games, **so that** I can pick the method that suits my preference.

**Acceptance Criteria:**

- [ ] User sees two import options after connecting Steam:
  1. **"Fetch & Curate"** (Manual path) - "Fetch your owned games and select which ones to add to your library"
  2. **"Background Sync"** (Lambda path) - "Automatically import all games in the background"
- [ ] Background Sync option shows a "Coming Soon" badge when feature flag is OFF
- [ ] Background Sync option is fully functional when feature flag is ON (development only)

### 2.3 Manual Import Path Foundation

**As a** user, **I want to** fetch my Steam games on-demand, **so that** I can see what I own before deciding what to import.

**Acceptance Criteria:**

- [ ] Clicking "Fetch & Curate" triggers a request to fetch the user's owned games from Steam Web API
- [ ] Games are fetched and stored in the `ImportedGame` table with:
  - `storefront`: STEAM
  - `storefrontGameId`: Steam App ID
  - `name`: Game name from Steam
  - `playtime`: Total playtime in minutes
  - `igdbMatchStatus`: PENDING (enrichment happens on-demand later)
- [ ] Re-fetching updates existing records (upsert behavior) and adds new games

### 2.4 Background Sync Path Foundation

**As a** user, **I want to** trigger an automatic background import, **so that** all my games are imported without manual intervention.

**Acceptance Criteria:**

- [ ] Clicking "Background Sync" (when enabled) triggers the Lambda pipeline
- [ ] Import runs in the background - user is NOT blocked waiting
- [ ] User receives a toast notification when import completes: "Steam import complete! X games imported."
- [ ] If import fails, user receives notification with clear error message
- [ ] Lambda pipeline flow: Steam fetch → S3 → IGDB enrichment → S3 → Database import
- [ ] All games stored in `ImportedGame` table with appropriate `igdbMatchStatus`

### 2.5 View Imported Games

**As a** user, **I want to** see and explore my imported Steam games, **so that** I can understand my collection and prepare for curation.

**Acceptance Criteria:**

- [ ] Imported games viewable from the Profile/Settings area (same location as Steam connection)
- [ ] Shows total count header: "X games imported from Steam"

**Display per game:**

- [ ] Game name
- [ ] Playtime (formatted as hours, e.g., "12.5 hrs" or "Never played")
- [ ] Last played date (formatted relative, e.g., "3 days ago" or "Never")

**Pagination:**

- [ ] Results paginated (default 25 games per page)
- [ ] Page navigation controls (Previous / Next, page numbers)
- [ ] Total page count displayed

**Search:**

- [ ] Fuzzy search by game name
- [ ] Search updates results as user types (debounced)
- [ ] "No results found" state when search matches nothing

**Filtering:**

- [ ] **Playtime Status:** All / Played / Never Played
- [ ] **Playtime Range:** All / <1 hr / 1-10 hrs / 10-50 hrs / 50+ hrs
- [ ] **Platform Played On:** All / Windows / Mac / Linux (based on where playtime > 0)
- [ ] **Last Played:** All / Last 30 days / Last year / Over a year ago / Never
- [ ] Multiple filters can be combined (AND logic)
- [ ] Active filters shown as removable chips/tags
- [ ] "Clear all filters" action

**Sorting:**

- [ ] Name (A-Z) - default
- [ ] Name (Z-A)
- [ ] Playtime (High to Low)
- [ ] Playtime (Low to High)
- [ ] Last Played (Recent First)
- [ ] Last Played (Oldest First)
- [ ] Recently Added (newest imports first)

### 2.6 Error Handling

**As a** user, **I want to** understand why an import failed, **so that** I can take corrective action.

**Acceptance Criteria:**

- [ ] If Steam profile is private, show: "Your Steam profile game details are set to private. To import your library, please set your game details to public in [Steam Privacy Settings](https://steamcommunity.com/my/edit/settings)."
- [ ] If Steam ID is invalid, show: "We couldn't find a Steam profile with that ID. Please check the ID and try again."
- [ ] If Steam API is unavailable, show: "Steam is temporarily unavailable. Please try again later."
- [ ] If Lambda invocation fails (background sync), show: "Background import failed. Please try again or use manual fetch."
- [ ] All errors include a "Try Again" or "Retry" action

### 2.7 Feature Flag Behavior

**As a** developer, **I want** the Lambda-based sync to be toggleable, **so that** we don't incur AWS costs in production until ready.

**Acceptance Criteria:**

- [ ] Environment variable `ENABLE_STEAM_BACKGROUND_SYNC` controls Lambda path availability
- [ ] When OFF: Background Sync option visible with "Coming Soon" badge, click shows informational message
- [ ] When ON: Background Sync option fully functional
- [ ] Manual import path is always available regardless of feature flag
- [ ] Feature flag is OFF by default in production, ON in development

---

## 3. Scope and Boundaries

### In-Scope

- Steam account connection (OAuth + manual entry)
- Persisting Steam ID and profile info to User record
- UI scaffolding for both import paths (manual and background)
- Manual fetch that stores games in `ImportedGame` table
- Imported games list with pagination, fuzzy search, filtering, and sorting
- Lambda pipeline integration (invocable from app, works locally)
- Feature flag for background sync
- Error messages with actionable guidance
- Re-import upsert behavior

### Out-of-Scope

_(The following are separate roadmap items and will be addressed in their own specifications)_

- **Stage 2: Curation UX Research** - Research on presenting 100+ games, filtering approaches
- **Stage 3: Curation Interface** - Game selection UI, smart defaults, bulk actions, promoting to library
- **Stage 4: Ongoing Sync** - Detecting new games only, periodic sync
- **Discovery & Exploration** - Similar games, enhanced game details
- **Curated Collections** - Creating and browsing themed collections
- **All Phase 3 features** - Community reflections, social engagement, advanced discovery
