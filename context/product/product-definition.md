# Product Definition: SavePoint

- **Version:** 2.0
- **Status:** Revised Vision

---

## 1. The Big Picture (The "Why")

### 1.1. Project Vision & Purpose

To help patient gamers curate their personal gaming libraries and journal their experiences—ensuring every gaming journey is intentional, memorable, and ready when the moment is right. Games are not chores to complete but worlds to explore and remember.

### 1.2. Target Audience

Patient gamers who view their game collections as opportunities rather than obligations. These are thoughtful players across all demographics who have accumulated libraries through various platforms and want to be intentional about their gaming experiences while preserving memories of their journeys through different worlds.

### 1.3. User Personas

- **Persona 1: "Sam the Patient Gamer"**
  - **Background:** Works full-time, games intentionally during evenings and weekends
  - **Gaming Collection:** 200+ games across Steam, Game Pass, GOG, and other platforms
  - **Philosophy:** Games are worlds waiting for the right season of life, not tasks to complete
  - **Goal:** Be intentional about which games to experience, remember and reflect on completed journeys, discover new worlds when curiosity strikes
  - **Frustration:** Forgets great gaming experiences over time, struggles to recall what each game was about or why they wanted to play something, can't track which worlds truly resonated

### 1.4. Success Metrics

- **Meaningful gaming experiences journaled:** Users regularly write reflections about their play sessions
- **Intentional gaming:** Users feel more purposeful about gaming time rather than overwhelmed
- **Community engagement:** Users actively share reflections and create themed collections
- **Discovery moments:** Users successfully find "the right game for right now" through curation
- **Memory preservation:** Users return to read their past gaming reflections and relive experiences
- **User satisfaction:** Users feel their gaming library is a curated collection, not a burden

---

## 2. The Product Experience (The "What")

### 2.1. Core Features

- **Personal Gaming Library:** Curate your collection across platforms—organize games by intent. Platform tracking is optional; focus is on what you want to play, not cataloging everything you own.
- **Gaming Journal:** Capture thoughts and memories about your gaming experiences. Quick, frictionless entries during or after play—no formal structure required.
- **Journey Tracking:** Mark your relationship with each game using four intuitive statuses: Want to Play, Owned, Playing, Played.
- **Curated Collections:** Create themed collections that reflect your gaming taste ("Cozy Winter Games," "Games That Made Me Think," "Worlds to Revisit")
- **Platform Integration:** Import libraries from Steam and other services to bring awareness to your collection
- **Discovery & Exploration:** Find similar games and new worlds to explore through IGDB integration and community collections
- **Gaming Memories Timeline:** View your gaming journey chronologically through journal entries and experiences
- **Community Reflections:** Read how others experienced the same worlds and share your own perspectives

### 2.2. User Journey

A patient gamer signs up for SavePoint and imports their Steam library, curating which games to track. They mark a few games as "Want to Play," start one and mark it as "Playing," and jot down quick thoughts during or after sessions. When they finish or move on, they mark it "Played." They discover their next game through similar game suggestions or community collections, read others' reflections, create themed collections, and return to revisit past journal entries and relive cherished gaming memories.

### 2.3. UX Principles

SavePoint follows a "Letterboxd for games" philosophy: the core action should be instant, with progressive enhancement for those who want more detail.

**Simplification decisions:**

- **4 statuses, not 6:** Want to Play, Owned, Playing, Played. Simple, obvious, no decision paralysis. See [spec](../spec/002-status-simplification/functional-spec.md).
- **Platform is optional:** Just say "I'm playing Zelda"—platform is metadata, not identity. See [spec](../spec/003-optional-platform/functional-spec.md).
- **Frictionless journaling:** Plain text, optional titles, "save thought" framing. Capture memories in under 10 seconds. See [spec](../spec/004-journal-friction-reduction/functional-spec.md).
- **Intentional library:** Your library reflects games you intend to experience, not everything you own. Steam import is curation, not bulk transfer.

---

## 3. Project Boundaries

### 3.1. What's In-Scope for this Version

- Personal gaming library management across platforms (curate what matters)
- Journey status tracking (Want to Play, Owned, Playing, Played)
- Gaming journal system for writing reflections and memories
- Curated collections creation (themed, personal, shareable)
- Steam integration for library import
- Similar games discovery via IGDB integration
- Basic user authentication and profiles
- Game metadata from IGDB (covers, descriptions, release dates)
- Timeline view of your gaming journey

### 3.2. What's Out-of-Scope (Non-Goals)

**Next Priority Features:**

- Social features (following users, reflection likes, activity feeds) - inspired by Goodreads and Letterboxd's community engagement models
- Additional platform integrations (Xbox, PlayStation, Epic Games, GOG API, etc.)
- Mood-based game recommendations ("I want something cozy tonight")
- Mobile application for journaling on-the-go
- Photo/screenshot uploads to journal entries

**Future Considerations:**

- Achievement and progress sync from platforms
- Game time tracking integrations
- Multiplayer session coordination for friends
- Reading challenges equivalent ("Complete 12 games this year" type goals for those who want them)
- Advanced recommendation algorithms based on journal sentiment
- Streaming/content creation features
- Advanced analytics and insights into gaming patterns
