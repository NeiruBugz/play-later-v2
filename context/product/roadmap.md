# Product Roadmap: PlayLater

_This roadmap outlines our strategic direction based on user needs and gaming community feedback. It focuses on the "what" and "why," not the technical "how."_

---

## ✅ Completed (Foundation Phase - 2024-Q3 2025)

_The core foundation that makes PlayLater functional and valuable._

- [x] **User Account & Authentication System**

  - [x] **Steam OAuth Integration:** Seamless sign-in using Steam OpenID, providing secure entry point and automatic user profile creation.
  - [x] **User Profile Management:** Enable users to view and manage their profile information, Steam connection status, and account settings.

- [x] **Core Game Collection Management**

  - [x] **Steam Library Import:** Automatic import of user's entire Steam library with game metadata, playtime, and achievement data.
  - [x] **Manual Game Addition:** Allow users to add games from any platform manually with custom metadata.
  - [x] **Status Tracking System:** Enable users to categorize games as Backlog, Playing, Completed, or Wishlist with timestamps.
  - [x] **Platform & Acquisition Tracking:** Track where games were acquired (Digital, Physical, Subscription) and on which platform.

- [x] **Game Database & Metadata**

  - [x] **IGDB Integration:** Rich game information including descriptions, release dates, screenshots, and genre data.
  - [x] **Game Details Pages:** Comprehensive game pages with metadata, user reviews, and collection management options.

- [x] **Review & Rating System**

  - [x] **User Reviews:** Community-driven review system with 10-point rating scale and detailed written reviews.
  - [x] **Review Discovery:** Browse and read reviews from other users to make informed gaming decisions.

- [x] **Analytics Dashboard**

  - [x] **Collection Statistics:** Visual breakdown of collection size, completion rates, and platform distribution.
  - [x] **Recent Activity Tracking:** Timeline of recently played, completed, and added games.
  - [x] **Gaming Progress Insights:** Completion statistics and backlog trends over time.

- [x] **Wishlist Management**
  - [x] **Personal Wishlist:** Organize future game purchases with priority and notes.
  - [x] **Public Wishlist Sharing:** Generate shareable URLs for friends and family to view wishlists for gift ideas.

---

### Q4 2025: API Architecture Foundation

_Establishing proper API architecture for mobile support and external integrations._

- [ ] **API Architecture Decision & Implementation**

  - [ ] **Architecture Assessment:** Evaluate hybrid approach (Route Handlers + Server Actions) vs. full Route Handlers migration.
  - [ ] **REST API Design:** Design comprehensive REST API endpoints for all core functionality (authentication, collection management, reviews, Steam integration).
  - [ ] **API Implementation:** Implement chosen approach with proper error handling, validation, and documentation.
  - [ ] **Authentication Strategy:** Implement API authentication (JWT tokens, API keys) for external consumers while maintaining web session auth.

- [ ] **API Documentation & Testing**
  - [ ] **OpenAPI Specification:** Create comprehensive API documentation with OpenAPI/Swagger specs.
  - [ ] **API Testing Suite:** Implement comprehensive API tests covering all endpoints and error scenarios.
  - [ ] **Rate Limiting & Security:** Implement proper rate limiting, CORS policies, and security measures for API endpoints.

---

### Q1 2026: Social Features Foundation

_Building community engagement and user-to-user interactions (dependent on API architecture completion)._

- [ ] **User Following System**

  - [ ] **Follow/Unfollow Users:** Allow users to follow other gamers to see their activity and reviews.
  - [ ] **Follower/Following Lists:** Display user connections and discover new gamers through mutual connections.

- [ ] **Enhanced Review Interactions**

  - [ ] **Review Likes & Reactions:** Enable users to like, agree, or react to helpful reviews.
  - [ ] **Review Comments:** Allow threaded discussions on game reviews for deeper community engagement.

- [ ] **Activity Feed**
  - [ ] **Personal Activity Stream:** Show recent activities from followed users (completions, reviews, new additions).
  - [ ] **Community Highlights:** Surface popular reviews and trending games within the user's network.

---

### Q1 2026: Platform Integration Research & Social Expansion

_Expanding social features while researching additional platform integrations._

- [ ] **Advanced Social Features**

  - [ ] **User Profiles Enhancement:** Public profile pages showing collection highlights, favorite games, and recent activity.
  - [ ] **Game Recommendation Engine:** AI-powered suggestions based on followed users' preferences and completion patterns.
  - [ ] **Collection Comparison:** Compare libraries and completion progress with friends.

- [ ] **Platform Integration Research**

  - [ ] **PlayStation API Investigation:** Research Sony's developer program and API access requirements for library imports.
  - [ ] **Xbox/Microsoft Store Research:** Investigate Xbox Game Pass and Microsoft Store integration possibilities.
  - [ ] **Epic Games Store Analysis:** Explore Epic's developer resources for potential library integration.

- [ ] **Community Features V1**
  - [ ] **Game Discussion Threads:** Enable discussions around specific games with spoiler management.
  - [ ] **Collection Showcases:** Allow users to create themed collections (e.g., "Best Indies of 2025") to share with community.

---

### Q2 2026: Platform Integration Implementation

_Based on Q1 research, implement the most feasible platform integrations._

- [ ] **First Additional Platform Integration**

  - [ ] **PlayStation Integration (if feasible):** Automatic library import from PlayStation Network with trophy tracking.
  - [ ] **Alternative Platform (if PlayStation unavailable):** Epic Games Store or GOG integration based on research findings.

- [ ] **Enhanced Multi-Platform Management**

  - [ ] **Cross-Platform Game Linking:** Connect the same game across different platforms to avoid duplicates.
  - [ ] **Platform-Specific Features:** Achievement/trophy tracking per platform with unified progress view.

- [ ] **Import & Migration Tools**
  - [ ] **Bulk Import Improvements:** Enhanced tools for importing large libraries with conflict resolution.
  - [ ] **Data Export:** Allow users to export their collection data for backup or migration purposes.

---

### Q3 2026: Mobile Strategy & Advanced Features

_Expanding accessibility and adding power-user features._

- [ ] **Mobile-First Improvements**

  - [ ] **Mobile Web Optimization:** Enhanced responsive design for mobile browsers with touch-optimized interactions.
  - [ ] **Progressive Web App (PWA):** Enable installation and offline functionality for mobile users.

- [ ] **REST API Development**

  - [ ] **Public API V1:** Create endpoints for third-party developers and potential mobile app development.
  - [ ] **Developer Documentation:** Comprehensive API docs for community developers.

- [ ] **Advanced Analytics**
  - [ ] **Gaming Insights Dashboard:** Deeper analytics on gaming habits, completion patterns, and time investment.
  - [ ] **Personalized Reports:** Monthly/yearly gaming summaries with achievements and milestones.

---

### Q4 2026 & Beyond: Ecosystem Growth

_Features planned for future consideration. Priority and scope may be refined based on user feedback and platform API availability._

- [ ] **Native Mobile Application**

  - [ ] **iOS/Android Apps:** Native mobile applications with full feature parity and mobile-specific optimizations.
  - [ ] **Offline Mode:** Basic collection browsing and status updates without internet connection.

- [ ] **Additional Platform Integrations**

  - [ ] **Nintendo eShop Integration:** Connect Nintendo Account for Switch game tracking (pending API availability).
  - [ ] **Retro Gaming Support:** Integration with emulation platforms and retro game databases.
  - [ ] **PC Launcher Support:** GOG Galaxy, Epic Games, Ubisoft Connect, EA App integrations.

- [ ] **Community & Discovery**

  - [ ] **Gaming Groups:** Create interest-based groups around genres, franchises, or gaming styles.
  - [ ] **Curator System:** Allow experienced users to curate game recommendations and collections.
  - [ ] **Events & Challenges:** Community gaming challenges and events (e.g., "Indie Game Month").

- [ ] **Infrastructure & Scalability**

  - [ ] **AWS Migration:** Migrate from Vercel to AWS infrastructure for better control and scalability (timeline TBD).
  - [ ] **Microservices Architecture:** Break down monolithic structure into specialized services for better maintainability.
  - [ ] **Advanced Caching:** Implement Redis caching layer for improved performance.

- [ ] **Advanced Features**
  - [ ] **Gaming Time Tracking:** Automatic playtime tracking across platforms with productivity insights.
  - [ ] **Price Tracking & Alerts:** Monitor game prices across platforms and alert users to sales.
  - [ ] **Monetization Exploration:** Investigate potential premium features while maintaining core functionality free.
