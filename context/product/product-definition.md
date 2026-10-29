# Product Definition: SavePoint

- **Version:** 3.0
- **Status:** Revised Vision (2026-10-29 vision interview)

---

## 1. The Big Picture (The "Why")

### 1.1. Project Vision & Purpose

SavePoint is a tool for mindful gaming: choose your next game deliberately, play it at your own pace, and remember what it gave you. It is not an achievement tracker or a race to finish — games are worlds to live in, not a pile to clear.

Choosing (before) and reflecting (after) carry equal weight and form one loop: a deliberate choice → unhurried play → a free note → which informs the next choice.

### 1.2. Target Audience

Gamers who own more games than they will ever play — across stores, subscriptions, and consoles — and who want to play fewer games, better. The primary user is the author: success is measured by whether he uses SavePoint every week.

### 1.3. User Personas

- **Persona 1: The Author (primary, dogfooding)**
  - **Role:** Developer with a large multi-platform library; already logs games and ratings in Backloggd.
  - **Goal:** Open the app, see what to play next from games he already owns, and keep a light record of what each game meant.
  - **Frustration:** Choice paralysis in a flat backlog; tools that don't know what he owns; buying more than he plays; hopping between games; feeling pushed to finish fast so he can move on.
- **Persona 2: "Sam the Patient Gamer"** _(secondary)_
  - **Role:** Works full-time, plays evenings and weekends, 200+ games across Steam, Game Pass, and consoles.
  - **Goal:** Have one or two games "on the go" and a short, trusted queue of what comes next.
  - **Frustration:** The backlog feels like a debt instead of a collection of opportunities.

### 1.4. Success Metrics

- **Weekly dogfooding:** within 3 months, the author opens SavePoint at least once a week to choose or note a game.
- **Fewer at once:** the number of games in "Playing" at the same time stays small (≤ 3) without feeling forced.
- **Decisions, not paralysis:** when sitting down to play, the next game is picked from the Up Next queue or a suggestion rather than by browsing the whole library.
- **Memory preserved:** finished or dropped games carry a note the author returns to read.
- **Anti-metrics (never optimized, never displayed):** games finished per year, speed of completion, pace compared with other players.

---

## 2. The Product Experience (The "What")

### 2.1. Core Features

- **Simple Game Model:** three statuses — **Want** (not started, owned or not), **Playing**, **Done** (finished _or_ let go — dropping is fine). Any Want game can be flagged **Up Next** and ordered into a short queue.
- **"What's Next" Home:** the home screen is the Up Next queue plus a few suggestions from the owned backlog. Suggestions draw on game length (shown as "about N evenings", never as a benchmark), the author's taste (genres, ratings, notes), mild urgency (e.g. leaving a subscription — shown as information on queued games, never as a "hurry" push), and what friends are playing or praising.
- **Know What I Own:** library fills itself from where games actually live — Steam first, then subscriptions (Game Pass, PS+), then consoles (PlayStation, Xbox, Switch). Manual add stays instant: search → tap → done.
- **Free, Simple Journal:** free-form notes on a game — no entry kinds, no moods, no playthrough bookkeeping. Gentle prompts at the key moments ("why do I want this?" on add, "what stayed with me?" on Done), always optional.
- **Friends as a Signal:** following friends and seeing what they play and rate feeds suggestions; it is not a social network to perform on.

### 2.2. User Journey

The author connects Steam and his library fills in. He flags three games as Up Next and orders them. On a free evening he opens SavePoint: the home screen shows his queue and two suggestions — a short game that fits a weekend and one a friend just loved. He starts the top game, which moves to Playing. If he tries to start a fourth game while three are in progress, SavePoint gently asks whether to put one aside. Weeks later he marks the game Done — finished or let go, both are fine — and jots a line about what stayed with him. That note and rating shape what SavePoint suggests next. Before buying a new game on sale, his wishlist reminds him how much is already waiting ("4 games in the queue, about 20 evenings").

### 2.3. Product Principles

- **Not a competition.** No yearly counters, completion challenges, or pace-vs-benchmark comparisons.
- **Few at once.** A soft limit on Playing nudges against hopping. _(Assumption: limit of 3, soft — a question, not a block; to be validated in use.)_
- **Dropping is fine.** "Let go" is a normal ending, worded neutrally, with no guilt mechanics.
- **Pause before buying.** Wishlist shows the size of what's already waiting.
- **Fewer concepts, faster actions.** Every surface should make the main thing — what to play next — obvious; logging a status change takes one tap.
- **Own path.** SavePoint does not chase Backloggd feature parity and does not import from it; it starts fresh with what the author owns and plays from now on.

---

## 3. Project Boundaries

### 3.1. What's In-Scope for this Version

- **Simplification first:** move to the Want / Playing / Done model with the Up Next queue; simplify the journal to free notes; hide playthrough bookkeeping; make add/mark instant.
- "What's Next" home screen with the Up Next queue.
- Soft limit on concurrent Playing games.
- Steam library import (to fill the library automatically).
- Rule-based suggestions from length, taste, urgency, and friends.
- Wishlist "already waiting" context.
- Existing foundations: accounts, profiles, IGDB game data, game detail pages, following friends.

### 3.2. What's Out-of-Scope (Non-Goals)

**Next:**

- Subscription catalog awareness (Game Pass, PS+), including "leaving soon" information.
- Console library imports (PlayStation, Xbox, Switch).

**Not pursuing (conflicts with the vision):**

- Yearly stats cards, "N games this year" challenges, year-in-review counters.
- Pace-vs-benchmark comparisons ("your pace", "faster than X% of players").
- Public reviews, community reflection feeds, aggregate community stats, and public collections — SavePoint is personal-first, not a review platform.
- Importing history from or matching features with Backloggd.
- LLM free-text recommendations.
