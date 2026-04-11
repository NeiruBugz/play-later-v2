# Functional Specification: Social Engagement

- **Roadmap Item:** Social Engagement — Follow other users and view an activity feed of their gaming updates
- **Status:** Completed
- **Author:** Nail

---

## 1. Overview and Rationale (The "Why")

SavePoint currently serves as a personal, solo experience. Users curate their libraries, track journey statuses, and write journal entries — but they have no visibility into what other patient gamers are doing. There is no way to discover like-minded players or stay connected with their gaming journeys.

**The problem:** Patient gamers often game in isolation. They want to know what others with similar taste are playing, what games others are picking up, and how other people's gaming journeys are progressing — the same way readers follow each other on Goodreads or film lovers follow each other on Letterboxd.

**The solution:** Social Engagement introduces three capabilities:
1. **Public user profiles** — giving users a visible identity within the community
2. **Follow system** — letting users connect with gamers whose taste resonates with them
3. **Activity feed** — surfacing gaming updates (status changes, library adds) from followed users

**Success criteria:**
- Users follow at least 3 other users within their first month
- Activity feed is visited at least weekly by active users
- Follow relationships grow organically through profile discovery

**Prerequisite dependency:** This feature requires that users already have accounts with basic profile information (name, OAuth avatar). This is already built as part of Phase 1 "User Account Essentials."

---

## 2. Functional Requirements (The "What")

### 2.1 Public User Profiles

- **As a** user, **I want to** have a public profile page, **so that** other users can learn about my gaming taste and decide to follow me.
  - **Acceptance Criteria:**
    - [ ] Each user has a public profile page accessible via a unique URL (e.g., `/user/[username]` or `/user/[userId]`)
    - [ ] The profile displays: display name, avatar (from Google OAuth), total game count in library, followers count, and following count
    - [ ] The profile shows recent activity: the user's last 5 status changes and library adds, displayed chronologically
    - [ ] The profile shows a library preview: up to 6 games the user is currently playing or recently marked as played, displayed as cover art thumbnails
    - [ ] Followers and following counts are clickable and show the list of users (display name + avatar, each linking to their profile)
    - [ ] If a user views their own profile, they see the same public view (no edit controls on this page — editing remains on the existing settings/profile page)

- **As a** user, **I want to** control whether I have a public profile, **so that** I can stay private if I choose.
  - **Acceptance Criteria:**
    - [ ] A "Public profile" toggle exists in user settings (default: OFF)
    - [ ] When OFF, visiting the user's profile URL shows a "This profile is private" message
    - [ ] When OFF, the user does not appear in followers/following lists of other users
    - [ ] When toggled OFF after having followers, existing follow relationships are preserved but the profile becomes inaccessible. [NEEDS CLARIFICATION: Should followers be notified, or should the user simply disappear from feeds silently?]

### 2.2 Follow System

- **As a** user, **I want to** follow another user from their profile page, **so that** I can see their gaming activity in my feed.
  - **Acceptance Criteria:**
    - [ ] A "Follow" button appears on public user profile pages (not on your own profile)
    - [ ] Clicking "Follow" immediately creates the follow relationship — no confirmation required (instant, Letterboxd-style)
    - [ ] After following, the button changes to "Following" with a visual distinction (e.g., filled vs outlined)
    - [ ] The followed user's followers count increments in real-time on the profile page

- **As a** user, **I want to** unfollow someone, **so that** I can curate whose activity I see.
  - **Acceptance Criteria:**
    - [ ] Hovering/clicking the "Following" button reveals an "Unfollow" option
    - [ ] Unfollowing is immediate — no confirmation dialog
    - [ ] After unfollowing, the button reverts to "Follow"
    - [ ] The unfollowed user's activity is immediately removed from the feed on next load
    - [ ] The unfollowed user is NOT notified of the unfollow

### 2.3 Activity Feed

- **As a** user, **I want to** see a feed of gaming activity from people I follow, **so that** I can stay connected with their gaming journeys.
  - **Acceptance Criteria:**
    - [ ] An activity feed widget appears on the dashboard/home page for logged-in users
    - [ ] The feed displays two types of events from followed users:
      - **Status changes:** "[User] marked [Game] as [Status]" (e.g., "Sam marked Hades as Playing")
      - **Library adds:** "[User] added [Game] to their library"
    - [ ] Each feed item shows: user avatar + display name (linked to profile), game cover thumbnail + game name (linked to game detail page), event type, and relative timestamp (e.g., "2 hours ago")
    - [ ] Feed items are ordered reverse-chronologically (newest first)
    - [ ] The feed uses infinite scroll — older items load automatically as the user scrolls down
    - [ ] Initial load shows the 20 most recent items. Each subsequent load fetches 20 more.

- **As a** new user with no follows, **I want to** see interesting activity in the feed widget, **so that** I'm motivated to explore and follow other users.
  - **Acceptance Criteria:**
    - [ ] When a user follows nobody, the feed widget shows recent activity from the most active public users
    - [ ] A subtle banner at the top says: "Showing popular activity. Follow gamers to personalize your feed."
    - [ ] Each activity item in the popular feed includes a "Follow" button next to the user's name for quick follow action
    - [ ] Once the user follows at least one person, the feed switches to showing only followed users' activity

---

## 3. Scope and Boundaries

### In-Scope

- Public user profile pages with display name, avatar, stats, recent activity, and library preview
- Profile visibility toggle (public/private) in user settings
- Follow/unfollow from profile pages
- Public followers and following lists
- Activity feed widget on dashboard showing status changes and library adds
- Infinite scroll pagination for the feed
- Empty state with popular activity for users with no follows

### Out-of-Scope

- **Community Reflections** (public journal entries, browsable community reflections) — separate roadmap item
- **Reflection Likes & Engagement** (likes, comments, bookmarks on reflections) — deferred until public reflections exist
- **Advanced Discovery** (mood-based recommendations, community collections) — separate roadmap item
- **User search** — users discover each other organically through game pages and profiles for now
- **Suggested users / recommendations** — future enhancement
- **Blocking / reporting users** — future moderation feature
- **Push notifications or email notifications** for follow events
- **Steam Library Integration** (Stages 2-4), **PlayStation Trophy Integration**, **Xbox Game Pass Integration** — separate roadmap items
- **Discovery & Exploration**, **Curated Collections** — separate roadmap items
- **Code Health & Developer Experience (Round 2)** — separate roadmap item
