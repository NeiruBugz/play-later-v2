# Functional Specification: Reviews

- **Roadmap Item:** Reviews — short-form, public, rated takes on a game; distinct from private long-form Journal. Public review feed on game detail; personal review history on profile; visibility setting (public/private/followers). _Depends on Per-Playthrough Logs._
- **Status:** Draft
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

SavePoint already gives patient gamers two ways to record an experience: a **private Journal** (long-form, reflective, "save a thought") and **per-playthrough logs** (when and how they played, with their personal rating). What's missing is a **public, concise verdict** — the "Letterboxd take" a user wants to leave for a game and share with the community.

**Reviews** fill that gap. A Review is a short, public, text-only take a user writes about a game they have actually played. Reviews surface in a public feed on the game's detail page (so visitors can read how others experienced that world) and in a personal review history on the author's profile (so the author builds a visible body of opinions over time).

**Key product decision — reviews carry no rating.** Although the roadmap line calls these "rated takes," we are deliberately decoupling rating from reviewing. Ratings already live on playthroughs; a Review is pure text. The review feed will **not** display any star rating alongside review text. _(This supersedes the "rated takes" wording in the roadmap; the roadmap line should be updated to match.)_

**Why now / why it depends on playthroughs:** A user may only review a game once they have a **logged playthrough** for it. This keeps reviews as _earned_ takes from people who have actually played the game, and is the concrete reason this feature was sequenced after Per-Playthrough Logs.

**Desired outcome:** Patient gamers can leave and read concise public verdicts on games, strengthening the community-engagement and discovery loops, without diluting the private, reflective nature of the Journal.

**Success measures:**

- Users write reviews on games they've played (review creation rate among users with logged playthroughs).
- Game detail pages accumulate public reviews that other users read.
- Reviews remain distinct from Journal entries (short-form takes, not long diary entries).

---

## 2. Functional Requirements (The "What")

### 2.1 Writing a review

- **As a** user who has played a game, **I want to** write a short public review of it, **so that** I can share my verdict with the community.
  - **Acceptance Criteria:**
    - [ ] Given a user is on the detail page of a game for which they have at least one logged playthrough, they see a control to write a review.
    - [ ] Given a user is on the detail page of a game for which they have **no** logged playthrough, the option to write a review is **not** available, and any explanation shown tells them they need to log a playthrough first.
    - [ ] When writing a review, the user sees a text field with a visible character counter and a stated maximum length (soft cap for short-form).
    - [ ] The user cannot save an empty review; review text is required.
    - [ ] When the user types beyond the character limit, they are prevented from exceeding it (or clearly warned), and cannot save until within the limit.
    - [ ] When writing a review, the user can mark it as containing spoilers.
    - [ ] When writing a review, the user can set its visibility to Public, Followers only, or Private; the visibility defaults to **Public**.
    - [ ] There is **no** rating field anywhere in the review-writing experience.
    - [ ] After the user saves, a success confirmation is shown and the review appears immediately in the relevant places (game detail feed if visible to viewers, and the author's profile review history).

### 2.2 One review per game per user

- **As a** user, **I want** a single review to represent my take on a game, **so that** my opinion isn't fragmented across duplicates.
  - **Acceptance Criteria:**
    - [ ] A user can have at most one review per game.
    - [ ] Given a user already has a review for a game, the detail page offers to **edit** their existing review rather than create a new one.
    - [ ] A user's review is independent of which playthrough prompted it; replaying the game does not create a second review.

### 2.3 Editing and deleting a review

- **As a** user, **I want to** update or remove my review, **so that** it always reflects my current opinion.
  - **Acceptance Criteria:**
    - [ ] The author can edit their review text, its spoiler flag, and its visibility at any time.
    - [ ] When an edited review is saved, the updated text replaces the old text everywhere it appears.
    - [ ] The author can delete their review; once deleted, it no longer appears in any feed or on their profile.
    - [ ] Only the author can edit or delete their own review.

### 2.4 Reading reviews on game detail

- **As a** visitor to a game's detail page, **I want to** read others' reviews, **so that** I can learn how that game was experienced.
  - **Acceptance Criteria:**
    - [ ] The game detail page shows a public review feed for that game.
    - [ ] The feed shows each review's text, its author (linking to the author's profile), and when it was written.
    - [ ] Reviews are ordered with the most recent first.
    - [ ] A viewer only sees reviews they are permitted to see: Public reviews are visible to everyone; Followers-only reviews are visible only to the author's followers; Private reviews are visible only to the author.
    - [ ] The author always sees their own review on the page regardless of its visibility.
    - [ ] No star rating is displayed alongside any review.
    - [ ] When a game has no reviews the viewer is permitted to see, the page shows a clear empty state (e.g., an invitation to be the first to review).

### 2.5 Spoiler handling

- **As a** reader, **I want** spoiler-tagged reviews hidden until I choose to reveal them, **so that** I don't get a game spoiled by accident.
  - **Acceptance Criteria:**
    - [ ] A review marked as containing spoilers is shown collapsed/obscured with a visible "contains spoilers" indicator instead of its text.
    - [ ] The reader can choose to reveal a spoiler review, after which its full text is shown.
    - [ ] Reviews not marked as spoilers display their text normally.

### 2.6 Personal review history on profile

- **As a** user, **I want** my reviews collected on my profile, **so that** I build a visible body of takes over time.
  - **Acceptance Criteria:**
    - [ ] A user's profile shows their review history (each entry identifying the game and showing the review text and date).
    - [ ] A profile visitor only sees the profile owner's reviews they are permitted to see (respecting each review's visibility); the owner sees all of their own reviews.
    - [ ] Each review in the history links to the corresponding game's detail page.

---

## 3. Scope and Boundaries

### In-Scope

- Writing a single short-form, text-only, public-by-default review per game, gated on the user having a logged playthrough for that game.
- A soft character cap with a live counter to enforce short-form.
- Per-review visibility: Public / Followers only / Private.
- Spoiler flag with reader-side reveal control.
- Editing and deleting one's own review.
- Public review feed on game detail (most recent first, visibility-respecting, no rating shown).
- Personal review history on the user's profile (visibility-respecting).

### Out-of-Scope

- **Ratings on reviews** — reviews carry and display no rating; ratings remain a separate, playthrough-level feature. _(Deliberate divergence from the roadmap's "rated takes" wording.)_
- Liking, commenting on, or replying to reviews.
- Reporting / moderation / flagging of reviews.
- Editing-history or "edited" indicators on reviews.
- The following are separate roadmap items, explicitly out of scope here: **Public Reflections** (making Journal entries public), **Game Detail Redesign**, **Aggregate Game Stats** (community play counts / rating histograms / review _count_ surfacing), and all Phase 3 platform-import work.
