# Functional Specification: Unified Profile View

- **Roadmap Item:** Unified Profile — Consolidate private dashboard and public profile into a single tabbed profile experience
- **Status:** In Review (pending QA sign-off)
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

### Problem

SavePoint currently has two separate profile experiences that serve overlapping purposes:

- **Private profile** (`/profile`) — A dashboard behind authentication showing the user's avatar, email, join date, library stats, and recently played games. Only the owner can see it.
- **Public profile** (`/u/{username}`) — A public-facing view showing avatar, username, social counts, follow button, and a library preview. Visible to anyone.

These views use separate components (`ProfileView` and `PublicProfileView`), show overlapping but different data, and drift apart as features are added. Every new profile feature must be implemented in both places. Users also find it confusing that their own profile looks different from what others see — they visit `/profile` and see one thing, then check `/u/{username}` and see something different.

### Desired Outcome

A single unified profile experience at `/u/{username}` with URL-based tab navigation (Overview, Library, Activity). The owner sees their full profile with editing controls; visitors see the same view minus private data. Adding a new profile feature requires changes in one place, not two.

### Success Metrics

- Only one profile rendering component exists (no `ProfileView` / `PublicProfileView` split)
- Adding a new profile feature requires changes in one place
- Owner and visitor experiences are visually consistent, differing only in controls
- All three tabs are functional and URL-addressable

---

## 2. Functional Requirements (The "What")

### 2.1 Profile Header

The profile header is always visible at the top of the profile, regardless of which tab is active.

- The header displays the user's **avatar**, **display name**, **@username**, and **social counts** (followers and following).
- Social counts link to `/u/{username}/followers` and `/u/{username}/following` respectively (full-page navigation).
- **Owner view:** The header includes an "Edit Profile" button (links to `/profile/settings`), a "Logout" button, and the user's email address. Email is private — it is only included in the server response when the viewer is the owner.
- **Authenticated visitor view:** The header includes a "Follow" / "Unfollow" button.
- **Unauthenticated visitor view:** No follow control is shown (hidden, not disabled).
- **Owner viewing own profile:** No follow control is shown.

**Acceptance Criteria:**

- [x] Profile header shows avatar, display name, @username, and social counts for all viewers
- [x] Follower count links to `/u/{username}/followers`; following count links to `/u/{username}/following`
- [x] Owner sees "Edit Profile" button, "Logout" button, and their email address
- [x] Email is not present in the page response for non-owner requests (server-side gating)
- [x] Authenticated non-owner visitors see Follow/Unfollow button
- [x] Unauthenticated visitors see no follow control
- [x] Owner viewing their own profile sees no follow control

### 2.2 Tab Navigation

The profile uses URL-based tab navigation with three tabs: **Overview**, **Library**, and **Activity**.

- Tabs are rendered as a horizontal navigation bar below the profile header.
- The currently active tab is visually indicated.
- Tab URLs:
  - **Overview:** `/u/{username}` (the bare route, no suffix)
  - **Library:** `/u/{username}/library`
  - **Activity:** `/u/{username}/activity`
- The tab bar renders **only** on tab routes. It does **not** render on `/u/{username}/followers` or `/u/{username}/following`.
- Clicking a tab navigates to its URL (browser back/forward works, URLs are shareable and bookmarkable).

**Acceptance Criteria:**

- [x] Three tabs are visible below the header: Overview, Library, Activity
- [x] Active tab is visually distinguished from inactive tabs
- [x] Clicking "Library" navigates to `/u/{username}/library`
- [x] Clicking "Activity" navigates to `/u/{username}/activity`
- [x] Clicking "Overview" navigates to `/u/{username}`
- [x] Browser back button returns to the previous tab
- [x] Tab bar does not appear on `/u/{username}/followers` or `/u/{username}/following`

### 2.3 Overview Tab

The Overview tab (at `/u/{username}`) shows a summary of the user's gaming profile. It contains the following sections, in order:

1. **Stats bar** — Shows game count, playing count, completed count, and journal entry count.
2. **Library stats grid** — Shows status breakdown with progress rings. Only visible when the user has 10 or more games in their library. Hidden (not collapsed with a placeholder) when below threshold.
3. **Recently Played** — Shows recently played games with cover art and "last played" timestamps. Hidden when user has no recently played games.
4. **Library Preview** — Shows a grid of 6 game covers from the user's library. Hidden when user has no games.

**Empty state behavior:** When a section has no data, it is hidden entirely rather than showing a placeholder message.

**Acceptance Criteria:**

- [x] Stats bar shows game count, playing, completed, and journal entries
- [x] Library stats grid appears when user has >= 10 games
- [x] Library stats grid is hidden (not shown with empty state) when user has < 10 games
- [x] Recently Played section shows games with timestamps, hidden when no data
- [x] Library Preview section shows up to 6 game covers, hidden when no games
- [x] All data is publicly accessible (no auth required for visitors to see stats)

### 2.4 Library Tab

The Library tab (at `/u/{username}/library`) shows a public read-only view of the user's game collection.

- Games are displayed in a **cover grid layout** with **status badges** on each cover (e.g., "Playing", "Completed", "Want to Play").
- No filtering or sorting controls — the view is read-only and static.
- The tab links individual game covers to their game detail pages.

**Acceptance Criteria:**

- [x] Library tab shows game covers in a grid layout
- [x] Each game cover displays a status badge (Playing, Completed, Want to Play, etc.)
- [x] Clicking a game cover navigates to the game's detail page
- [x] No filtering or sorting controls are present
- [x] Library data is accessible without authentication (for public profiles)

### 2.5 Activity Tab

The Activity tab (at `/u/{username}/activity`) shows the profile user's own activity log — a chronological record of their library actions.

- **Events shown:** Games added to library and status changes (e.g., "Added Zelda to library", "Started playing Elden Ring", "Completed Hollow Knight").
- **Events NOT shown:** Journal entries, follow events, and social feed items are excluded.
- This is the user's own activity, not a social feed of accounts they follow.

**Acceptance Criteria:**

- [x] Activity tab shows a chronological list of the user's library actions
- [x] "Game added" events are shown (e.g., "Added [Game] to library")
- [x] "Status changed" events are shown (e.g., "Changed [Game] to Playing")
- [x] Journal entries do not appear in the activity log
- [x] Follow events do not appear in the activity log
- [x] Activity data is accessible without authentication (for public profiles)

### 2.6 Privacy Gating

Profile visibility is controlled by the `isPublicProfile` setting. Privacy behavior applies consistently:

- **Owner always sees their full profile** regardless of the `isPublicProfile` setting. The privacy gate only applies to visitors.
- **Visitors viewing a private profile** see a minimal header (avatar, display name, @username) with a "This profile is private" message below. No tabs, no stats, no games, no activity.
- **Visitors viewing specific tabs on a private profile** (direct URL to `/u/{username}/library` or `/u/{username}/activity`) see the same minimal header with "This profile is private" message.

**Acceptance Criteria:**

- [x] Owner with `isPublicProfile=false` sees their full profile with all tabs and data
- [x] Visitor viewing a private profile sees avatar, display name, and @username
- [x] Visitor viewing a private profile sees "This profile is private" message
- [x] Visitor viewing a private profile does not see tabs, stats, games, or activity
- [x] Direct URL to `/u/{username}/library` on a private profile shows the private message, not library data
- [x] The system distinguishes between "profile is private" and "user not found" — showing appropriate messages for each

### 2.7 Routing and Redirects

- **`/profile`** redirects to `/u/{my-username}` for authenticated users who have a username set.
- **`/profile`** redirects to `/profile/setup` for authenticated users who do not have a username.
- **`/profile/settings`** and **`/profile/setup`** remain as separate, auth-protected pages. They are not part of the tab navigation and are not affected by this change.
- **`/u/{username}/followers`** and **`/u/{username}/following`** continue to work as standalone pages, outside the tab layout (no tab bar).

**Acceptance Criteria:**

- [x] Authenticated user with username: `/profile` redirects to `/u/{their-username}`
- [x] Authenticated user without username: `/profile` redirects to `/profile/setup`
- [x] `/profile/settings` remains accessible and unchanged
- [x] `/profile/setup` remains accessible and unchanged
- [x] `/u/{username}/followers` renders without the tab bar
- [x] `/u/{username}/following` renders without the tab bar

---

## 3. Scope and Boundaries

### In-Scope

- Unified profile component replacing both `ProfileView` and `PublicProfileView`
- URL-based tab navigation (Overview, Library, Activity)
- `/profile` redirect to `/u/{username}`
- Public read-only library view (Library tab with cover grid and status badges)
- Personal activity log (Activity tab with library actions only)
- Privacy gating with `isPublicProfile` for all tabs
- Owner bypass of privacy gate (owner always sees full profile)
- Public-facing stats data (game count, playing, completed, journal entries accessible without auth)
- Service-level discriminator between "user not found" and "profile is private"

### Out-of-Scope

- Bio/description field (no data model exists yet)
- Favorite games section
- Badges or achievements system
- Profile customization (themes, banners)
- Changes to `/profile/settings` or `/profile/setup` pages
- Removal of the existing auth-protected `/library` page (it stays as-is)
- Filtering or sorting on the public Library tab
- Journal entries or follow events in the Activity tab
- Sign-in prompt for unauthenticated visitors
- **Steam Library Integration — Stages 2 & 3** (separate roadmap item)
- **Code Health & Developer Experience Round 2** (separate roadmap item)
- **PlayStation Trophy Integration** (separate roadmap item)
- **Xbox Game Pass Integration** (separate roadmap item)
- **Community Reflections** (separate roadmap item)
- **Curated Collections** (separate roadmap item)
- **Discovery & Exploration** (separate roadmap item)
