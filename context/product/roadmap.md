# Product Roadmap: SavePoint

_This roadmap outlines our strategic direction based on the revised product vision. SavePoint is a gaming journal and library curator—not a backlog manager. It focuses on intentional curation, memorable experiences, and warm reflection._

---

### Phase 1 ✅ **COMPLETED - Core Foundation**

_The essential features that form the core foundation of the product._

- [x] **User Account Essentials**

  - [x] **Seamless Sign-Up & Login:** Users can create accounts and sign in securely (`features/sign-in`)
  - [x] **Basic Profile Management:** Users can view and update profile information (`features/manage-user-info`)

- [x] **Core Game Library Management**

  - [x] **Manual Game Adding:** Users can search and add games to their library using IGDB integration (`features/add-game`)
  - [x] **Game Status Tracking:** Users can organize games by status (Want to Play, Currently Playing, Completed, etc.) (`features/manage-backlog-item`)
  - [x] **Collection Viewing:** Users can browse, filter, and manage their game collections (`features/view-collection`)
  - [x] **Game Information Display:** Rich game details with IGDB metadata (`features/view-game-details`)

- [x] **Steam Integration V1**

  - [x] **Steam Authentication:** Secure OAuth flow using Steam OpenID (`features/steam-integration`)
  - [x] **Steam Library Import:** Users can import their Steam game libraries (`features/view-imported-games`)
  - [x] **Achievement Tracking:** Display Steam achievements with rarity analysis (`features/steam-integration`)

- [x] **Review System**
  - [x] **User Reviews:** Users can write and rate completed games (`features/add-review`)
  - [x] **Review Management:** Users can manage their written reviews

---

### Phase 2 🚧 **IN PROGRESS - Vision Transformation & Architecture**

_Critical phase to align the product with the SavePoint vision: gaming journal, library curation, and intentional experiences._

- [ ] **Vision Transformation (SavePoint Rebrand)** ⭐ _HIGHEST PRIORITY_

  - [ ] **Database Schema Migration:**
    - [ ] Rename `BacklogItem` model to `LibraryItem` (reflects curation, not burden)
    - [ ] Update `BacklogItemStatus` enum values to match new journey-focused language:
      - `TO_PLAY` → `CURIOUS_ABOUT` or `WAITING`
      - `PLAYING` → `CURRENTLY_EXPLORING`
      - `PLAYED` → `TOOK_A_BREAK` or `PAUSED`
      - `COMPLETED` → `EXPERIENCED`
      - Add `REVISITING` status for games being replayed
    - [ ] Consider renaming `Review` model to `JournalEntry` or `GameReflection`
    - [ ] Add fields to support richer journaling (mood tags, play session notes, etc.)
  - [ ] **UI/UX Language Revision:**
    - [ ] Replace "backlog" terminology across the entire application
    - [ ] Update navigation labels, page titles, and CTAs to reflect warmth and curation
    - [ ] Revise empty states and onboarding copy to emphasize journey and discovery
    - [ ] Update status labels in UI components to match new enum values
    - [ ] Change tone from productivity/guilt to curiosity/memory
  - [ ] **Homepage Redesign:**
    - [ ] Redesign landing page to emphasize "gaming journal" and "library curator" positioning
    - [ ] Create warm, inviting hero section that celebrates gaming as meaningful experiences
    - [ ] Highlight journaling and curation as core value propositions
    - [ ] Update marketing copy to reflect patient gamer persona

- [ ] **Gaming Journal Feature** ⭐ _HIGHEST PRIORITY_

  - [ ] **Journal Entry System:**
    - [ ] Design journal entry UI/UX (rich text editor, timestamps, mood indicators)
    - [ ] Create journal entry creation and editing flows
    - [ ] Link journal entries to games and library items
    - [ ] Support multiple entries per game (ongoing journaling throughout play)
  - [ ] **Gaming Memories Timeline:**
    - [ ] Build chronological timeline view of all journal entries
    - [ ] Filter by game, date range, or mood/tags
    - [ ] Display entry previews with associated game covers
  - [ ] **Journal Entry Types:**
    - [ ] Reflection entries (post-completion thoughts)
    - [ ] Session notes (quick thoughts during gameplay)
    - [ ] Milestone entries (key moments in a game journey)

- [ ] **Technical Architecture Enhancement**

  - [ ] **Service Pattern Implementation:** Introduce service layer architecture for better code organization and testability
  - [ ] **Hybrid Architecture Migration:** Implement hybrid approach leveraging both Server Actions and Route Handlers for optimal caching and performance

- [ ] **Enhanced Collection Features**

  - [ ] **Custom Lists and Collections:** Allow users to create curated game collections ("Cozy Winter Games," "Games That Made Me Cry")
  - [ ] **Wishlist Management:** Enhanced wishlist functionality with priority ordering (`features/view-wishlist`, `features/share-wishlist` exist)
  - [ ] **Gaming Goals:** Personal goal setting and progress tracking - optional for users who want it (`features/gaming-goals` exists)

- [ ] **Improved User Experience**
  - [ ] **Dashboard Enhancement:** Comprehensive user dashboard with recent journal entries, currently exploring games, and gentle prompts (`features/dashboard` exists)
  - [ ] **Theme Customization:** Dark/light theme toggle and personalization (`features/theme-toggle` exists)
  - [ ] **Game Discovery Enhancement:** Improved similar game suggestions and mood-based filtering

---

### Phase 3 🔮 **PLANNED - Community & Platform Expansion**

_Building on the solid journal foundation to foster community and expand platform support._

- [ ] **Community Reflections & Social Features**

  - [ ] **Public Journal Entries:** Allow users to share journal entries publicly (opt-in)
  - [ ] **User Following System:** Follow other patient gamers and see their gaming journeys
  - [ ] **Reflection Interactions:** Enable likes, thoughtful comments on shared journal entries
  - [ ] **Community Collections:** Discover curated collections created by other users
  - [ ] **Activity Feeds:** See what worlds your followed users are exploring

- [ ] **Platform Integration Expansion**

  - [ ] **Multi-Platform Support:** Begin integration with additional gaming platforms beyond Steam
  - [ ] **Xbox Integration:** Connect Xbox Live accounts to import game libraries
  - [ ] **PlayStation Integration:** Connect PlayStation Network accounts for library sync
  - [ ] **PC Storefronts:** Add support for Epic Games Store, GOG, and other major PC gaming platforms
  - [ ] **Cross-Platform Game Matching:** Help users identify games they own across different platforms

- [ ] **Advanced Journal Features**

  - [ ] **Screenshot & Media Uploads:** Attach screenshots or videos to journal entries
  - [ ] **Mood-Based Game Recommendations:** "I want something cozy tonight" discovery
  - [ ] **Journal Entry Templates:** Pre-made prompts to help users reflect ("What surprised you most?")
  - [ ] **Reading Challenges Equivalent:** Optional goals like "Journal 12 gaming experiences this year" (for users who want structure)

- [ ] **Mobile & Accessibility**
  - [ ] **Mobile Application:** Companion app for journaling on-the-go and quick library browsing
  - [ ] **Voice Journaling:** Dictate journal entries while playing (accessibility + convenience)
  - [ ] **Advanced Analytics (Optional):** Personal gaming insights for users who want them—never forced

---

## Migration Notes

### Immediate Technical Debt (Phase 2)

1. **Database Migration Strategy:**

   - Create migration scripts to rename tables and columns
   - Update all repository layer code to use new naming
   - Ensure backward compatibility during transition

2. **Codebase Language Audit:**

   - Run comprehensive search for "backlog" across codebase
   - Update all component names, variables, and comments
   - Update test descriptions and factory names

3. **Feature Directory Restructuring:**
   - Consider renaming feature directories:
     - `features/manage-backlog-item` → `features/manage-library-item`
     - `features/add-review` → `features/add-journal-entry`
   - Maintain git history through proper renames

### Success Metrics Alignment

Track these metrics to validate the vision transformation:

- **Before (Backlog Manager):** Completion rate, time spent choosing games
- **After (Gaming Journal):** Journal entries written, timeline revisits, intentional play sessions, community engagement on reflections

---

## Decided Approaches

### Dual Feature Strategy: Reviews + Journal Entries

**Decision:** Implement BOTH as distinct features serving different purposes:

- **Reviews** (public, community-facing)

  - Rating + text content
  - Discoverable by other users
  - Social engagement (likes, comments in Phase 3)
  - One review per game per user
  - Focus: Sharing opinions and recommendations with the community

- **Journal Entries** (private by default, optionally shareable)
  - Rich text with mood tags, session notes, timestamps
  - Multiple entries per game (ongoing journaling throughout play)
  - Privacy controls: private, friends-only, or public
  - Focus: Personal reflection and memory preservation

**Implementation Impact:**

- Keep existing `Review` model for public reviews
- Create new `JournalEntry` model with richer schema
- Update UI to clearly distinguish between the two features
- Game detail pages show both community reviews and user's personal journal entries

### Migration Strategy

**Decision:** Aggressive migration without backward compatibility concerns

Since there are no existing users:

- Rename database tables and columns directly (no gradual migration needed)
- Update all codebase terminology in a single refactor
- No need for data migration scripts or dual naming support
- Can make breaking changes freely to align with SavePoint vision

### Achievement Tracking Philosophy

**Decision:** Keep achievement tracking with reframing and user control

**Reframe as:** "Remembering what you did in that world" rather than completion pressure

**Implementation:**

- Achievement tracking remains in Steam integration feature
- Add user setting: "Show achievement tracking" (toggle on/off)
- Update achievement UI language to emphasize memories, not completion
- Avoid progress bars and completion percentages in prominent positions
- Focus on interesting/rare achievements rather than 100% completion
