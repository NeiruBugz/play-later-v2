# Functional Specification: SavePoint Foundation Replacement

- **Roadmap Item:** Tech Health (Phase 5) — replace the application's underlying technical foundation with no user-visible behavior change.
- **Status:** Draft
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

SavePoint's underlying technical foundation will be replaced with a new one. From a user's perspective, **nothing visible changes** — every screen, button, link, and flow continues to work the same way, on the same URLs, with the same accounts and data.

The motivation is long-term product sustainability: a more straightforward foundation lets future features be built faster, with stronger guarantees against regressions, and reduces the risk of being locked into a single hosting provider down the road. Patient gamers who use SavePoint should never need to know this work happened.

**Success is measured by:**

- Zero user-reported regressions during the first 7 days after cutover.
- Every shipped feature behaves identically to before.
- Users who were signed in before cutover remain signed in afterward without any action.

---

## 2. Functional Requirements (The "What")

### 2.1 Account and sign-in continuity

- **As a** signed-in user, **I want** my session to survive the change, **so that** I don't need to sign in again.
  - **Acceptance Criteria:**
    - [ ] Given I was signed in before cutover, when I open SavePoint after cutover, then I am still signed in and land on my usual home view.
    - [ ] Given I sign in with Google after cutover, when I complete the sign-in, then I land on my profile with my full library and journal intact.
    - [ ] Given I sign out, when I sign back in, then my account, library, journal, and settings appear unchanged.

### 2.2 Library continuity

- **As a** user with games in my library, **I want** every game preserved exactly, **so that** my curation work is not lost.
  - **Acceptance Criteria:**
    - [ ] Every game previously in my library is still there with the same status (Want to Play / Owned / Playing / Played), rating, platform, and personal notes.
    - [ ] Filters, sorts, and view modes work identically.
    - [ ] Adding a new game from search adds it to the library and it is visible immediately.
    - [ ] Changing a status, rating, or platform persists and is visible on refresh.

### 2.3 Journal continuity

- **As a** user with journal entries, **I want** all my reflections preserved and editable, **so that** my gaming memories remain intact.
  - **Acceptance Criteria:**
    - [ ] Every journal entry I wrote before cutover is visible afterward, attached to the same game, with the same text and timestamp.
    - [ ] Writing a new entry, editing an existing one, and deleting one all work identically to before.
    - [ ] The chronological journal timeline shows entries in the same order.

### 2.4 Profile continuity

- **As a** user, **I want** my profile (mine and the public-facing one) to look and behave identically.
  - **Acceptance Criteria:**
    - [ ] My profile page shows the same display name, avatar, username, stats, and visibility setting as before.
    - [ ] Visiting `/u/<my-username>` shows the same public profile as before.
    - [ ] Editing username, uploading a new avatar, toggling visibility, and updating settings all work identically and persist on refresh.
    - [ ] Username availability checks behave the same way during edit.

### 2.5 Game discovery continuity

- **As a** user, **I want** game search, game detail pages, and the add-to-library flow to work identically.
  - **Acceptance Criteria:**
    - [ ] Searching for a game returns the same results in the same order.
    - [ ] Opening a game detail page shows the same metadata, cover art, and personal information.
    - [ ] Adding a game to my library from search works and the game appears immediately.

### 2.6 Social continuity

- **As a** user with followers/following, **I want** my social graph and activity feed preserved.
  - **Acceptance Criteria:**
    - [ ] My followers and following lists are identical.
    - [ ] My activity feed shows the same entries.
    - [ ] Follow / unfollow actions behave identically.

### 2.7 URLs and bookmarks

- **As a** user with bookmarked links into SavePoint, **I want** every URL to keep working.
  - **Acceptance Criteria:**
    - [ ] Every previously valid URL (profile, public profile, game detail, library, journal, settings) returns the expected page after cutover.

### 2.8 In-progress actions during cutover

- **As a** user actively using SavePoint at the moment of cutover, **I want** a graceful experience.
  - **Acceptance Criteria:**
    - [ ] A user mid-action may need to refresh the page once after cutover and can then continue normally.
    - [ ] No data the user had successfully saved before cutover is lost.

### 2.9 Invisible cutover

- **As a** user, **I should not** see any banner, modal, or message about the change.
  - **Acceptance Criteria:**
    - [ ] No in-app communication about the foundation change is shown.
    - [ ] No new sign-in prompt, terms acceptance, or onboarding step is triggered by the change.

---

## 3. Scope and Boundaries

### In-Scope

- Feature parity for every currently shipped capability: sign-in (Google + email/password in dev), profile (own + public), library (all statuses, ratings, filters, sorts), journal (read/write/edit/delete), game search, game detail, add-to-library, follow/unfollow, activity feed, settings, command palette.
- Preservation of every user account and all user data without migration.
- Preservation of every URL.
- Same upload behavior for avatars (formats, size limits, success/error states identical to today).

### Out-of-Scope

The following separate roadmap items are explicitly NOT part of this specification:

- Per-Playthrough Logs
- Reviews
- Public Reflections
- Game Detail Redesign
- Aggregate Game Stats
- Bento Dashboard Reflow
- Upcoming Releases Widget
- YTD Stats Card
- Pick Up Where You Left Off
- Gaming Events Calendar
- Similar Games Discovery
- Browse / Catalog
- Curated Collections
- First-Time User Onboarding
- Library View Modes
- Bulk Library Actions
- Global Quick-Log CTA
- Steam Library Stages 2–4 and other platform integrations (PSN, Xbox)
- Community Collections

Additionally out-of-scope within this topic itself:

- Any user-visible improvement (faster pages, new layouts, new copy). This change is strictly invisible.
- Any change to authentication providers, session length, or sign-in policies.
- Any change to data retention, privacy posture, or terms of service.
- Decommissioning of the old application (handled as a separate operational task once the new application is verified at parity).
