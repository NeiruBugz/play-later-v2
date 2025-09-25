# Product Definition: PlayLater

- **Version:** 0.1.2
- **Status:** In Development

---

## 1. The Big Picture (The "Why")

### 1.1. Project Vision & Purpose

To eliminate the overwhelm of choice and rediscover the joy of gaming by providing a unified platform where gamers can organize, track, and make informed decisions about their gaming libraries across all platforms, solving the problem of accumulated games and decision paralysis that modern gamers face.

### 1.2. Target Audience

Any level gamer who has accumulated games across multiple platforms and feels overwhelmed by choice. This includes casual gamers with too many Steam sale purchases, console gamers with subscription backlogs, and anyone who has games spread across PC, PlayStation, Xbox, Nintendo, and emulation platforms.

### 1.3. User Personas

- **Persona 1: "Alex the Steam Collector"**

  - **Role:** PC gamer with 500+ games in Steam library from years of sales.
  - **Goal:** Wants to decide what to play next without scrolling through endless lists, and track completion progress.
  - **Frustration:** Feels overwhelmed by choice and often defaults to playing the same familiar games instead of exploring their backlog.

- **Persona 2: "Jordan the Multi-Platform Gamer"**
  - **Role:** Owns PS5, Xbox Series X, Nintendo Switch, and gaming PC.
  - **Goal:** Wants to manage games across all platforms in one place and track what they've completed on each system.
  - **Frustration:** Can't remember what games they own on which platforms, leading to duplicate purchases and forgotten gems.

### 1.4. Success Metrics

- Reduce time spent deciding what to play next by 70% through better organization and filtering
- Achieve 80%+ user satisfaction with Steam integration and automatic library import
- At least 60% of users successfully organize their backlog and mark their first game as "completed" within their first session
- Increase game completion rate among users by 40% through better tracking and organization

---

## 2. The Product Experience (The "What")

### 2.1. Core Features

- **Steam Integration**: Automatic library import with OAuth authentication and achievement tracking
- **Multi-Platform Game Collection Management**: Track games across different platforms with status tracking (Backlog, Playing, Completed, Wishlist)
- **IGDB-Powered Game Database**: Rich game metadata, screenshots, release dates, and detailed information
- **Review & Rating System**: Community-driven reviews with 10-point rating scale
- **Wishlist Management**: Organize future games with public sharing capabilities
- **Analytics Dashboard**: Collection statistics, completion rates, and gaming insights
- **Platform & Acquisition Tracking**: Track where games were acquired (Digital, Physical, Subscription) and on which platform

### 2.2. User Journey

A new user lands on PlayLater, signs in with Steam OAuth, automatically imports their Steam library (500+ games), uses filters to find unplayed indie games under 10 hours, adds a few to "Currently Playing" status, completes a game and writes a review, then shares their wishlist publicly for friends and family to see gift ideas during holidays.

---

## 3. Project Boundaries

### 3.1. What's In-Scope for this Version

- Steam OAuth integration and automatic library import
- Game status management (Backlog, Playing, Completed, Wishlist)
- IGDB API integration for comprehensive game metadata
- User review and rating system (0-10 scale)
- Public wishlist sharing with unique URLs
- Responsive web application with dark/light themes
- Dashboard with basic collection analytics
- Manual game addition for non-Steam platforms
- User authentication and profile management

### 3.2. What's Out-of-Scope (Non-Goals)

- PlayStation and Xbox automatic integrations (planned for future versions)
- Mobile application (web-responsive only for now)
- Social features like following users or review likes (planned for future)
- Monetization features or paid tiers
- Advanced AI-powered game recommendations
- In-app game purchasing or store integration
- Multi-language support beyond English
- Real-time multiplayer features or chat systems
- Game streaming or download capabilities
- Advanced achievement tracking beyond Steam's built-in system
