# Functional Specification: Mindful Core Simplification

- **Topic:** Replace the five-status model and playthrough bookkeeping with three statuses (Want / Playing / Done) plus an ordered Up Next queue; simplify the journal to plain notes with optional prompts; make adding a game and changing its status instant.
- **Status:** Draft
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

SavePoint is meant to be a tool for mindful gaming: choose the next game deliberately, play it at your own pace, remember what it gave you. Today the app works against that. The author — its primary user — does not use it. He describes it as inconvenient for three reasons: **too many concepts**, **adding or marking a game is slow**, and **the main thing is not visible**.

Research confirms each one.

- **Too many concepts.** A game can be in one of five statuses (Wishlist, Shelf, Up Next, Playing, Played). It can also have several "playthroughs", each with its own state. Its status is sometimes calculated from those playthroughs and sometimes pinned by hand.
- **Unpredictable status.** A status set from the library is silently overwritten the next time a playthrough changes. The same game can show two different statuses on one page.
- **Slow adding.** There are several ways to add a game, and they put it in different places. Changing a status takes two to three taps.
- **No real queue.** "Up Next" has no order, so editing any game reshuffles it.

This change replaces all of that with one small model the user can hold in their head:

- **Want** — not started yet, owned or not.
- **Playing**.
- **Done** — finished *or* let go; both are fine.
- **Up Next** — a short, ordered queue on top of these.

Notes become plain notes. Adding a game and changing its status each take one tap and can be undone.

**Success looks like:** the author can add a game, queue it, start it, and mark it done without thinking about where it should go. In the following weeks, he opens SavePoint at least once a week.

---

## 2. Functional Requirements (The "What")

### Terms used below

- **Library** — the user's list of games, with a status filter at the top (All, Up Next, Want, Playing, Done).
- **Library card** — one game in the library, shown either as a cover tile (grid view) or as a row (list view). Every card shows the game's status label and a "⋯" menu.
- **Game page** — the page of one game. On phones it has a sticky bottom bar with the game's status.
- **Status control** — the status label on a library card, the status pill on the game page, or the status pill in the phone bottom bar. Tapping it opens the **status picker**.
- **Play** — one period of playing a game. A play starts when the game becomes Playing. It ends when the game leaves Playing, either to Done or back to Want. A game has been **played before** when it has at least one ended play.
- **Note** — a piece of free text about a game, optionally with time played.
- **Log sheet** — opens from the center "Log" button in the phone navigation or the "Log a session" button in the desktop sidebar. You pick a game, enter time played, and optionally write a note.
- **Journal** — the "Journal" section in the navigation, listing all of the user's notes, newest first. Opening one note shows its **note view**.
- **Phone / desktop** — screens narrower / wider than 768 pixels.

### 2.1. Three statuses

Every game in a person's library has exactly one of three statuses: **Want**, **Playing**, or **Done**. No other status exists anywhere in the app.

- **Acceptance Criteria:**
  - [ ] When the user opens any status picker in the app (library card, game page, phone bottom bar, Steam import), then they see exactly three options: Want, Playing, Done.
  - [ ] When the user views the library status filter, then the choices are All, Up Next, Want, Playing, Done, and no Wishlist, Shelf, or Played choice appears.
  - [ ] When the user views any card, game page, dashboard, or profile, then the only status labels shown are Want, Playing, and Done, plus the queue markers "Up Next" and "Replay" (2.4).

### 2.2. A status only changes when the user changes it

The status shown is always the last one the user chose. Logging time, writing notes, and editing details never change it on their own. When the user logs time for a game that isn't Playing, the confirmation offers a one-tap "Mark as Playing", and the user decides.

- **Acceptance Criteria:**
  - [ ] Given a game is Playing, when the user logs time for it in the Log sheet, then the status still reads Playing.
  - [ ] Given a game is Want, when the user logs time for it in the Log sheet, then the status still reads Want and the confirmation "Logged {time} for {Game}" shows a "Mark as Playing" button.
  - [ ] Given that confirmation is showing, when the user taps "Mark as Playing", then the game shows Playing and leaves Up Next if it was queued; when the user ignores it, then the game stays Want.
  - [ ] Given a game is Done, when the user edits its rating or writes a note, then the status still reads Done.
  - [ ] When the user sets a status on a library card, then the game page shows the same status in the page header and in the phone bottom bar.

### 2.3. One-tap status change, with undo

The user can move a game to its natural next status with one tap. The next-step button appears on library cards in both grid and list views, and on the game page:

| Current status | One-tap button |
|---|---|
| Want | Start playing |
| Playing | Mark done |
| Done | Play again |

Any status can be reached in two taps: tap the status control, then tap a status in the picker. Every status change shows a confirmation with **Undo** for 5 seconds. Marking a game Done is the exception — it follows 2.7.

- **Acceptance Criteria:**
  - [ ] Given a game is Want, when the user taps "Start playing" on its library card, then the card shows Playing and a confirmation "{Game} is now Playing" with "Undo" appears for 5 seconds.
  - [ ] Given a game is Done, when the user taps "Play again", then the game shows Playing.
  - [ ] When the user taps the status control on a grid tile, a list row, the game page, or the phone bottom bar, then the status picker opens directly, without scrolling the page or opening a menu first.
  - [ ] When the user taps a status in the picker, then the new status is shown immediately, without any further confirmation step.
  - [ ] When the user taps "Undo" within 5 seconds of a status change, then the game returns to its previous status and its previous Up Next place.
  - [ ] Given the user undoes "Start playing" or "Play again", when they expand History on the game page, then no new play has been added.
  - [ ] Given the game's previous Up Next place was taken by another game within those 5 seconds and the queue is now full, when the user taps "Undo", then the game returns to its previous status outside the queue and the user sees: "Up Next is full, so {Game} wasn't put back in the queue."

### 2.4. Up Next queue

Up Next is an ordered list of up to **5** games the user intends to play next. It marks a game on top of its status; it is not a status itself.

- Want and Done games can be in Up Next. A Done game in Up Next is labelled **Replay**; a Want game is labelled **Up Next**.
- Changing a queued game between Want and Done keeps its place and switches its label.
- A game that becomes Playing leaves the queue.
- "Put in Up Next" and "Remove from Up Next" are in the "⋯" menu of every library card and on the game page. They are hidden for Playing games.
- On the library with the Up Next filter selected, each queued game shows its place number and "Move up" / "Move down" buttons. "Move up" is hidden on the first game and "Move down" on the last. On desktop, games can also be dragged into a new order.

- **Acceptance Criteria:**
  - [ ] Given a game is Want or Done and the queue holds fewer than 5 games, when the user taps "Put in Up Next", then the game appears at the bottom of the queue.
  - [ ] Given the queue already holds 5 games, when the user taps "Put in Up Next" on another game, then the game is not added and the user sees: "Up Next holds 5 games. Remove one to add this."
  - [ ] Given a game is Playing, when the user opens its "⋯" menu or its game page, then no "Put in Up Next" action is shown.
  - [ ] When the user selects the Up Next filter in the library, then the queued games are listed in the user's chosen order, numbered from 1 up to the number of queued games.
  - [ ] When the user taps "Move up" or "Move down" on a queued game, then it swaps places with its neighbour, and the new order is still shown after reloading the page.
  - [ ] When the user views the first game in the queue, then it has no "Move up" button; when they view the last game, then it has no "Move down" button.
  - [ ] Given the user is on desktop, when they drag a queued game to a new position, then the queue shows the new order and keeps it after reloading the page.
  - [ ] When the user edits any other detail of a queued game (rating, note, ownership), then the queue order does not change.
  - [ ] When the user taps "Remove from Up Next", then the game leaves the queue with its status unchanged, and the games below it each move up one place.
  - [ ] Given a game is in Up Next, when the user starts playing it, then it shows Playing and is no longer in the queue.
  - [ ] Given a Want game is in Up Next, when the user changes it to Done, then it keeps its place and its label changes from "Up Next" to "Replay".
  - [ ] When the user views the dashboard, then the first 3 queued games appear in queue order with a "See all" link, and tapping the link opens the library with the Up Next filter selected.
  - [ ] Given the queue is empty, when the user views the dashboard, then they see: "Nothing queued yet — put up to 5 games in Up Next."

### 2.5. Owned or not

Every game carries an "I own it / I don't own it yet" marker. It replaces the old difference between Wishlist and Shelf. The marker stays the same when the status changes. The "Not owned" tag is shown only on Want games, where it matters for deciding what to play or buy. The user changes it from the card's "⋯" menu or the game page.

- **Acceptance Criteria:**
  - [ ] When the user adds a game, then it is marked as owned.
  - [ ] When the user chooses "I don't own it yet" on a Want game, then the game shows a "Not owned" tag on its card and game page.
  - [ ] Given a Want game is marked as not owned, when the user changes it to Playing and later back to Want, then it still shows the "Not owned" tag.
  - [ ] Given the Want filter is selected in the library, when the user turns on the "Not owned only" toggle that appears next to the filter, then only Want games marked as not owned are listed.
  - [ ] When a friend views the user's profile or activity, then no ownership information is shown.

### 2.6. Instant add

There are four ways to add a game:

- the search page;
- the add dialog, opened by the "Add game" button on the dashboard and in the library;
- the command palette (⌘K / Ctrl+K);
- the "Add to library" button on the page of a game the user doesn't have yet.

All four behave the same:

- One tap adds the game as **Want**.
- A confirmation then shows "Added {Game} to Want", with "Put in Up Next", "Undo", and the optional "why" field of 2.8.
- The confirmation stays for 8 seconds. It stays longer while the user is typing in the "why" field.
- Search results appear as the user types.
- The search stays open after adding, so several games can be added in a row.

Steam import is a separate, reviewed flow (2.13) and is not covered here.

- **Acceptance Criteria:**
  - [ ] When the user taps "+" next to a search result on the search page, in the add dialog, or in the command palette, then the game is added as Want and the confirmation "Added {Game} to Want" appears with "Put in Up Next" and "Undo".
  - [ ] When the user taps "Add to library" on the page of a game they don't have, then the game is added as Want, the same confirmation appears, and the page shows the game's status control.
  - [ ] When the user taps "Put in Up Next" in the confirmation, then the game joins the queue under the rules of 2.4.
  - [ ] When the user taps "Undo" while the confirmation is visible, then the game is no longer in their library, its queue place is freed, and any "why" answer given in that confirmation is gone.
  - [ ] Given the user has not touched the confirmation, when 8 seconds pass, then the confirmation disappears and the game stays in the library.
  - [ ] When the user types a game name in the add dialog, the search page, or the command palette and stops typing, then results appear within 1 second without pressing Enter.
  - [ ] Given the add dialog or the command palette is open, when the user adds a game, then it stays open, the added result shows "In library", and the user can add another game.
  - [ ] Given a game is already in the library, when it appears in search results, then it shows its status (and "Up Next #n" or "Replay" if queued) instead of "+", and tapping it opens the game page.
  - [ ] Given the add cannot be saved, when the user taps "+", then the game is not added and the user sees: "Couldn't add {Game}. Try again."

### 2.7. Done follow-up

Marking a game Done applies immediately and opens a small follow-up with three optional fields:

- how it ended — **Finished** or **Let go**, neither selected by default;
- a rating, pre-filled with the game's current rating if it has one;
- "What stayed with you?".

The follow-up has "Save", "Skip", and "Undo". Closing it (the × button, tapping outside it, or the Escape key) counts as "Skip". After Save or Skip, the status stays Done. Changing it again uses the normal status control.

"How it ended" is private. It is never counted, totalled, or shown to anyone else. The user can change it later from the game page.

- **Acceptance Criteria:**
  - [ ] When the user marks a game Done, then the follow-up appears with "Finished" / "Let go" (neither selected), a rating, a "What stayed with you?" field, and "Save", "Skip" and "Undo" buttons.
  - [ ] Given the game already has a rating, when the follow-up opens, then that rating is pre-filled; when the user changes it and taps "Save", then the new rating replaces the old one everywhere.
  - [ ] When the user taps "Skip", the ×, outside the follow-up, or presses Escape, then the game stays Done and nothing else is recorded.
  - [ ] When the user taps "Undo" in the follow-up, then the game returns to its previous status and nothing entered in the follow-up is kept.
  - [ ] When the user writes "What stayed with you?" and taps "Save", then the text appears as a note on the game page under the heading "What stayed with you?".
  - [ ] When the user picks "Finished" or "Let go" and saves, then the user's own game page shows "Done · Finished" or "Done · Let go".
  - [ ] Given a game shows "Done · Let go", when the user changes how it ended to "Finished" on the game page, then the page shows "Done · Finished".
  - [ ] When a friend views the user's profile or activity, then they see "Done" without "Finished" or "Let go".
  - [ ] When the user views their own profile, library, or dashboard, then no count or total of finished or let-go games appears anywhere.
  - [ ] Given the follow-up cannot be saved, when the user taps "Save", then the follow-up stays open with what they entered and they see: "Couldn't save. Try again."

### 2.8. Optional prompts

Two one-line prompts invite reflection at the key moments. Both can be ignored, dismissed, or answered later.

- **"Why do you want to play this?"** — in the add confirmation, and on the game page of a Want game until it is answered or dismissed.
- **"What stayed with you?"** — in the Done follow-up, and on the game page of a Done game until it is answered or dismissed for that Done.

Each prompt has a "Save" button; pressing Enter also saves. Dismissing a prompt (the × button) hides it for that game. An answer becomes a note headed by its question. Playing games show no prompt.

- **Acceptance Criteria:**
  - [ ] When the user adds a game, then the confirmation shows an optional "Why do you want to play this?" field with a "Save" button.
  - [ ] When the user ignores the field and the confirmation disappears, then the game is in the library with no note.
  - [ ] When the user types an answer and presses Enter or taps "Save", then the answer appears as a note on the game page under the heading "Why do you want to play this?".
  - [ ] Given a Want game has no "why" answer and the prompt was not dismissed, when the user opens its game page, then they see the "Why do you want to play this?" field and can answer it there.
  - [ ] Given a Done game has no "What stayed with you?" answer since it last became Done and the prompt was not dismissed, when the user opens its game page, then they see that field and can answer it there.
  - [ ] When the user taps × on a prompt on the game page, then the prompt disappears and does not return for that game.
  - [ ] When the user opens the game page of a Playing game, then no prompt is shown.

### 2.9. Plain notes

All journal entries are plain notes. A note has text and, optionally, time played, entered in hours in half-hour steps. It has no type label, mood, tags, or title, and it is not tied to a playthrough. Logging a session means writing a note with time played in the Log sheet. Notes are private.

- **Acceptance Criteria:**
  - [ ] When the user views any note on the game page, in the Journal, or in the note view, then no "Quick note" or "Reflection" label, mood, or tag is shown.
  - [ ] When the user writes a note from the Log sheet, the "New note" button on a game page, or the Journal, then they see only a text field and an optional time field, with no type, mood, title, or playthrough choice.
  - [ ] When the user enters time played without any text, then "Save" is enabled and the note is saved, for any game in the library.
  - [ ] When the user has entered neither text nor time, then "Save" stays disabled.
  - [ ] When a friend views the user's profile, then none of the user's notes are visible.

### 2.10. Play history instead of playthroughs

Playthroughs disappear from the main flow. The game page has no Playthroughs panel, timeline, or "add playthrough" form. A collapsed, read-only **History** section lists the game's ended plays, newest first, each with its start date and end date. The play in progress is not listed. Notes stay in the game's notes list, each with its date. Nothing the user recorded before is lost.

Play dates are recorded automatically: a play starts on the day the game becomes Playing and ends on the day it leaves Playing. The game's details no longer have separate "started" and "completed" date fields.

- **Acceptance Criteria:**
  - [ ] When the user opens a game page, then no Playthroughs panel, playthrough timeline, or "Start a new playthrough" button is shown.
  - [ ] When the user opens a library card's "⋯" menu, then no "Add playthrough" action is shown.
  - [ ] Given a game has been played before, when the user expands "History" on its game page, then each ended play is listed with its start and end date, newest first.
  - [ ] Given a game has no ended plays, when the user opens its game page, then no History section is shown.
  - [ ] Given a game is Done after one play, when the user taps "Play again" and later marks it Done again, then History lists two plays.
  - [ ] When the user opens the Log sheet for a game, then no playthrough picker is shown.
  - [ ] Given the user started playing a game on 3 March and marked it Done on 20 March, when they expand History, then that play shows 3 March – 20 March.
  - [ ] When the user opens a game's details for editing, then there are no "started" or "completed" date fields.

### 2.11. One rating per game

Each game has at most one rating, shown as up to 5 stars in half-star steps (1 = half a star, 10 = five stars). The user sets it in the Done follow-up or on the game page.

- **Acceptance Criteria:**
  - [ ] When the user views a game page, then at most one rating is shown and no "Best rating" label appears.
  - [ ] Given the user rates a game 7, when they view its card, then it shows three and a half stars.
  - [ ] Given the user changes a game's rating on the game page, when they use the library's "Minimum rating" filter (which shows only games rated at or above the chosen stars), then the game is included or excluded according to the new rating.

### 2.12. Existing libraries move to the new model

When this change is released, every existing library is converted at once. Nothing is deleted.

| Before | After |
|---|---|
| Wishlist | Want, not owned |
| Shelf | Want, owned |
| Up Next, never played before | Want, owned, in Up Next |
| Up Next, played before (shown as "Replay") | Done, owned, in Up Next (shown as "Replay") |
| Playing | Playing, owned |
| Played | Done, owned — "Let go" if every earlier playthrough was marked abandoned, otherwise unset |

- **Up Next.** Existing Up Next games enter the queue with the most recently edited first. Only the first 5 are queued; the rest keep their new status outside the queue.
- **Ratings.** Each game keeps its game rating. A game without one takes the highest rating from its earlier playthroughs.
- **Playthroughs.** Earlier finished or abandoned playthroughs appear as ended plays in History (2.10). An in-progress playthrough becomes the current play of a Playing game.
- **Notes.** Earlier notes appear as plain notes (2.9).
- **Explanation.** Existing users see a one-time message explaining Want, Playing, Done and Up Next. Users who sign up after the change do not see it.

- **Acceptance Criteria:**
  - [ ] Given a game was on the Wishlist, when the user opens the library after the change, then it shows Want with the "Not owned" tag.
  - [ ] Given a game was on the Shelf, when the user opens the library after the change, then it shows Want without the "Not owned" tag.
  - [ ] Given a game was Played, when the user opens the library after the change, then it shows Done.
  - [ ] Given a game showed "Replay", when the user opens the Up Next queue after the change, then it is queued and shows "Replay".
  - [ ] Given 7 games were Up Next, when the user opens the Up Next queue after the change, then the 5 most recently edited are queued in that order (most recent first), and the other 2 show Want or Done outside the queue.
  - [ ] Given a game had no game rating but a rated earlier playthrough, when the user opens its page after the change, then it shows the highest such rating as the game's rating.
  - [ ] Given a game had two finished playthroughs, when the user expands History after the change, then two ended plays are listed.
  - [ ] Given an existing user opens the app for the first time after the change, when the page loads, then they see a one-time message explaining Want, Playing, Done and Up Next with a "Got it" button; when they tap "Got it", then the message does not appear again on any device.
  - [ ] When a user who signed up after the change opens the app, then the one-time message does not appear.

### 2.13. Other places that show a status

Steam import, friends' activity, search results and the profile use the new labels.

- **Steam import.** The user reviews each imported game and confirms it with a status picker. Picking Done there does not open the follow-up.
- **Friends' activity.** It shows each game at most once, describing its current status.

- **Acceptance Criteria:**
  - [ ] When the user opens an imported Steam game to add it, then the status picker offers Want, Playing, Done, pre-selected with Playing if Steam reports it was last played within the 7 days before the import, and Want otherwise.
  - [ ] When the user views an imported Steam game card, then its suggested status is shown as a readable label such as "Want", never in capitals or code form.
  - [ ] When a friend views the user's activity, then each line reads "{name} wants to play {Game}", "{name} is playing {Game}", or "{name} is done with {Game}", matching the game's current status.
  - [ ] Given the user undoes a status change, when a friend views the user's activity, then the line shows the restored status.
  - [ ] When the user views a profile, then it shows how many games are Want, Playing, and Done, and no "played" or "completed" counts.

### 2.14. Failed changes

Any change that cannot be saved leaves things as they were and says so.

- **Acceptance Criteria:**
  - [ ] Given there is no connection, when the user changes a status, puts a game in or out of Up Next, reorders the queue, or changes ownership, then the previous state is shown again and the user sees: "Couldn't save. Try again."

---

## 3. Scope and Boundaries

### In-Scope

- The three-status model (Want / Playing / Done) everywhere a status appears.
- Statuses change only when the user chooses; nothing changes them automatically.
- One-tap next-step buttons and undoable status changes on library cards (grid and list), the game page, and the phone bottom bar.
- The ordered Up Next queue (at most 5 games), with reordering, the "Replay" marker, and the top 3 on the dashboard.
- The owned / not-owned marker and the "Not owned only" toggle.
- One add behaviour across the four add paths: add as Want, live search, a confirmation with "Put in Up Next" and Undo, and the search staying open. Plus "Add game" buttons on the dashboard and the library.
- The Done follow-up (private Finished / Let go, rating, "What stayed with you?") and the "Why do you want to play this?" prompt.
- Plain notes, with time-only logs working for every game.
- A read-only play History replacing playthrough panels, timelines, and forms.
- One rating per game.
- Converting existing libraries, with a one-time explanation.
- New labels in Steam import, friends' activity, search results, and the profile.

### Out-of-Scope

- The "What's Next" home screen beyond the dashboard's top 3 (roadmap Phase 3 #4).
- A soft limit on how many games can be Playing (roadmap #5).
- Reframing Times to Beat and removing "Your Pace" comparisons (roadmap #6).
- Smarter Steam import suggestions beyond the label change and the 7-day rule (roadmap #7).
- Suggestions of what to play next (roadmap #8).
- Wishlist "already waiting" context before buying (roadmap #9).
- Editing or deleting plays in History.
- Sharing notes publicly or with friends; moods, tags, or note titles.
- Ownership from subscriptions and consoles (roadmap Phase 4).
- A welcome tour for new users (spec 013, parked).

---

## Change Log

- [YYYY-MM-DD] — [source reference] — [what behavior changed and why]
