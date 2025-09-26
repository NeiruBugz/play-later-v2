# Product Roadmap: PlayLater

_This roadmap outlines our strategic direction based on customer needs and business goals. It focuses on the "what" and "why," not the technical "how."_

---

### Phase 1 ✅ **COMPLETED - Core Foundation**

_The essential features that form the core foundation of the product._

- [x] **User Account Essentials**

  - [x] **Seamless Sign-Up & Login:** Users can create accounts and sign in securely (`features/sign-in`)
  - [x] **Basic Profile Management:** Users can view and update profile information (`features/manage-user-info`)

- [x] **Core Game Library Management**

  - [x] **Manual Game Adding:** Users can search and add games to their backlog using IGDB integration (`features/add-game`)
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

### Phase 2 🚧 **IN PROGRESS - User Experience Enhancement**

_Building on the solid foundation to improve user engagement and discovery._

- [ ] **Technical Architecture Enhancement** ⭐ _HIGH PRIORITY_

  - [ ] **Service Pattern Implementation:** Introduce service layer architecture for better code organization and testability
  - [ ] **Hybrid Architecture Migration:** Implement hybrid approach leveraging both Server Actions and Route Handlers for optimal caching and performance

- [ ] **Enhanced Collection Features**

  - [ ] **Custom Lists and Collections:** Allow users to create curated game lists for different purposes (favorites, recommendations, genre-specific, etc.)
  - [ ] **Wishlist Management:** Enhanced wishlist functionality with priority ordering (`features/view-wishlist`, `features/share-wishlist` exist)
  - [ ] **Gaming Goals:** Personal goal setting and progress tracking (`features/gaming-goals` exists)

- [ ] **Improved User Experience**

  - [ ] **Dashboard Enhancement:** Comprehensive user dashboard with statistics and recommendations (`features/dashboard` exists)
  - [ ] **Theme Customization:** Dark/light theme toggle and personalization (`features/theme-toggle` exists)
  - [ ] **Game Discovery Enhancement:** Improved similar game suggestions and filtering options

- [ ] **Platform Integration Expansion**
  - [ ] **Multi-Platform Support:** Begin integration with additional gaming platforms beyond Steam
  - [ ] **Cross-Platform Game Matching:** Help users identify games they own across different platforms

---

### Phase 3 🔮 **PLANNED - Social Features (Goodreads/Letterboxd Model)**

_Features planned for future consideration. Their priority and scope may be refined based on user feedback from earlier phases._

- [ ] **Social Features Foundation**

  - [ ] **User Following System:** Allow users to follow other gamers and see their activity and reviews
  - [ ] **Review Interactions:** Enable likes, comments, and sharing of user reviews to build community engagement
  - [ ] **Social Feeds:** Create activity feeds showing what games friends are playing and reviewing
  - [ ] **Community Recommendations:** User-generated recommendation lists and discovery

- [ ] **Multi-Platform Integration**

  - [ ] **Xbox Integration:** Connect Xbox Live accounts to import game libraries and achievement data
  - [ ] **PlayStation Integration:** Connect PlayStation Network accounts for library and trophy sync
  - [ ] **PC Storefronts:** Add support for Epic Games Store, GOG, and other major PC gaming platforms

- [ ] **Advanced Features**
  - [ ] **Enhanced Achievement Tracking:** Cross-platform achievement/trophy progress sync and comparison
  - [ ] **Mobile Application:** Create a companion mobile app for on-the-go backlog management
  - [ ] **Advanced Analytics:** Personal gaming statistics, insights, and progress tracking
