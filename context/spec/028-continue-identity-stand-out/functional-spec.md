# Functional Specification: Continue? identity round 2 — stand-out Home, game page and library

- **Topic:** Make the app recognizably its own on the three screens where a person decides what to play. Home opens with one question, "Continue …?". A game's cover tints its main surface. Game length reads as evenings. The game page and library cards are regrouped so they feel calmer.
- **Status:** Draft
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

Spec 027 gave the product its name ("Continue?"), its plum accent, its title font and its logo. Below the header, though, the app still reads like a stock template. The screens where a person actually decides what to play don't help with that decision:

- Home is a dashboard. A person opens it and has to scan a shelf, a counts row and a list to work out what to do tonight.
- Nothing tells a person how long a game is in terms of their own life. Length appears only on the game page, in hours, in a typewriter-style font, and only once the game is already in the library.
- The game page is split into many uneven boxes:
  - the title sits apart from its actions;
  - a large critic-score ring competes for attention;
  - an empty "Time played 0 h" card appears for games the visitor doesn't own;
  - the person's own notes sit near the bottom.
- Library cards show the status twice, and their covers carry badges that cover the art.

This spec addresses both problems equally: the UI looks generic, and the nightly decision is slow. It applies the product's principle: choose the next game deliberately, play it at your own pace, remember what it gave you.

- **Home asks one question:** "Continue Metal Gear Solid Delta?", with **Log time** and **Not tonight**. It uses the product's name as its voice and replaces scanning with a single yes or no. Research found no strong evidence that fewer choices make decisions faster, so the reason is calm and intent. The full lists stay one scroll away.
- **The cover colors its surface.** The main surface of Home and of the game page takes a soft tint from the game's cover art, so each game feels like itself. Research found no other game tracker that does this.
- **Length is told in evenings:** "About 8 evenings" instead of "14.5 h". An evening is 1.75 hours of play unless the person sets their own length. The product definition already promised this, and research found no comparable product that does it.
- **The game page is regrouped** into three groups: what the game is, what you did with it, and more like it. For the owner, a calmer game page is the single most valuable improvement.

**Success looks like:**
- On a phone, a person who opens the app with one or more games in progress reaches the Log sheet for the game they mean to continue with one tap on Home.
- A person can tell roughly how many evenings a game takes, without converting hours, from any game page and from any library card.
- At desktop width, the game page shows no empty half-width area beside the title, and its two main cards sit side by side at the same height.
- Someone shown screenshots of this app next to other game trackers can pick it out by its tinted surfaces and the "Continue …?" question.

---

## 2. Functional Requirements (The "What")

### 2.0 Definitions used in this specification

- **Statuses:** a game in the library is **Want** (not started), **Playing** or **Done**. A Done game can carry a private reason, **Finished** or **Let go**, that only its owner sees.
- **Play:** one stretch of playing a game. A play starts when the game becomes Playing and ends when it leaves Playing. A game played twice has two plays.
- **Up Next:** an ordered queue of up to 5 games the person plans to play next. It may hold Want games, and Done games meant for a replay (shown as "Replay").
- **Session:** time the person logs for a game with the Log sheet, in hours. **Time played** is the sum of a game's session lengths. It is shown as it is everywhere in the app: hours with at most one decimal, for example "6 h" or "4.5 h".
- **Note:** a free-text entry the person writes about a game in the Log sheet. A note may be saved with or without time. Only entries with time count as sessions.
- **Log sheet:** the existing sheet titled "Log time" that records time and a note for a game. On a phone it opens as a panel that slides up from the bottom.
- **Status control:** the existing status badge with a small down arrow. Tapping it opens a list of Want, Playing and Done, and choosing one changes the game's status.
- **Next-step button:** the existing one-tap button on a library card. It reads "Start playing" for Want, "Mark done" for Playing and "Play again" for Done.
- **Up Next actions:** the existing menu items "Put in Up Next" and "Remove from Up Next".
- **Typical play time:** how long a game usually takes, from the public game catalog. The catalog gives up to two figures, which the app labels "Main story" and "100%". Many games have neither.
- **Evening:** a person's usual evening of play. It is 1.75 hours unless the person chooses another length in Settings (2.12). Visitors who are signed out always get 1.75 hours.
- **Cover tint:** a soft background color in the main hue of a game's cover art.
- **Accent:** the brand color, plum, used for the primary button, the selected item, the Playing status, focus outlines and links.
- **Primary button:** the filled plum button for a screen's or panel's main action.
- **Readable:** text meets the standard accessibility contrast level, WCAG AA. That is a contrast ratio of at least 4.5:1, or 3:1 for large text, against its background. This is the level spec 027 already requires.
- **Widths:**
  - **Phone layout:** any window narrower than 768 points, where the app shows its bottom bar. It is designed at 390 × 844 points and checked at 360 × 780 and 430 × 932.
  - **Desktop layout:** 768 points and wider, where the app shows its sidebar. It is reviewed at 1440 × 900.
- **Screens covered:** Home, the game page and the Library page, in both layouts, in Light and Dark, plus one new item in Settings (2.12).
- **Default evening in examples:** every example and acceptance criterion in 2.1–2.11 assumes the default 1.75-hour evening.
- **Reference design:** the owner-approved review page "Continue? identity round 2" (2026-11-10) shows the intended look. Where it and this text differ, this text wins.

#### 2.1 Game length in evenings

Wherever the app shows how long a game takes, it shows it in evenings, in words. Time a person has already played stays in hours.

- The number of evenings is the game's "Main story" figure divided by the length of an evening (2.0; 1.75 hours unless changed in Settings). It is rounded to the nearest whole number, with halves rounding up, and is never less than one.
  The catalog's own meaning of this figure may be "main story plus some extras". If that is confirmed, evenings are based on the catalog's time-to-credits figure instead, and the About list's labels (2.7) are corrected to say what each figure measures.
- It reads "One evening" for one, and "About N evenings" otherwise.
- There are no dots, bars or other drawn marks for length.
- The length never changes because of time played. It is not a progress measure.
- When a game has no "Main story" figure, no length is shown, even if a "100%" figure exists.
- Length appears in exactly these places:
  - the game page header (2.6);
  - the Home question for an Up Next game (2.3);
  - the first cover of the Up Next shelf (2.4);
  - library cards (2.10).
  
  Today it appears only on the game page.

- **Acceptance Criteria:**
  - [ ] Given a game whose "Main story" time is 14.5 hours, when the user views its game page, then its length reads "About 8 evenings".
  - [ ] Given a game whose "Main story" time is 1.5 hours, when the user views its game page, then its length reads "One evening".
  - [ ] Given a game whose "Main story" time is 51 hours, when the user views its game page, then its length reads "About 29 evenings", with no dots, bars or other marks.
  - [ ] Given a game whose "Main story" time is 4.375 hours (exactly 2.5 evenings), when the user views its game page, then its length reads "About 3 evenings".
  - [ ] Given a game with a "100%" time but no "Main story" time, when the user views its game page, then no length is shown and no placeholder text such as "Unknown" appears.
  - [ ] Given a Playing game with 6 hours of time played and a length of "About 8 evenings", when the user views its game page, then the length still reads "About 8 evenings" and time played reads "6 h".
  - [ ] When the user views the game page, then the header's Length fact is in evenings, and hours for typical play time appear only in the About card's list (2.7).

#### 2.2 Cover tint

Two surfaces are tinted with a soft color taken from the cover of the game they are about: the Home question panel (2.3) and the game page header (2.6). No other surface is tinted, so a screen has at most one tinted surface.

- **The tint keeps the cover's main hue.**
  - In Light it is a pale wash; in Dark it is a deep wash.
  - Every cover gives the same lightness of wash, so text on it stays readable whatever the cover.
- **Colors on the tinted surface:**
  - Text, buttons and the accent keep their normal colors. The primary button stays plum.
  - A few words may take a darker (Light) or lighter (Dark) shade of the cover's hue and must still be readable: "Continue", "Start" and "Play" in the Home question, and the values of the key facts on the game page.
- **A cover with no clear color gives no tint.** This means a cover with almost no colorful areas, for example black-and-white art, or a white cover with only a small colored logo. A game without cover art behaves the same way. The surface then uses the normal neutral card color.
- **Exception to spec 027.** The tint is a deliberate exception to spec 027's rule that every interface color comes from the fixed palette (027 §2.4), and to its list of accent uses (027 §2.9). Neither rule otherwise changes.

- **Acceptance Criteria:**
  - [ ] Given the Home question is about a game with a mostly red cover, when the user views Home in Light, then the question panel has a pale red-tinted background, and in Dark it has a deep red-tinted background.
  - [ ] Given a game with a mostly green cover, when the user opens its game page, then the header background is green-tinted.
  - [ ] When the user compares the game pages of two games with differently colored covers, then their header backgrounds differ in hue, and the game title has the same contrast ratio against both headers to within 0.5.
  - [ ] Given a game whose cover is black and white, when the user opens its game page, then the header uses the plain neutral card color with no tint.
  - [ ] When the user checks every text on a tinted surface in Light and in Dark, then each one is readable (at least 4.5:1, or 3:1 for large text).
  - [ ] When the user views the Library page, then no card and no part of the page is tinted.
  - [ ] When the user views a tinted surface that has a primary button, then the button is plum, not the tint color.

#### 2.3 Home: the "Continue …?" question

Home opens with a single question about what to play tonight, in a tinted panel (2.2). In the phone layout this panel takes the place of the page title "Home". In the desktop layout the page title "Home" stays above it.

The panel goes through up to three steps, in order, skipping any step that has no game:

1. **Each Playing game, most recently played first.**
   - **Order:** "most recently played" is the date of the game's latest session. A Playing game with no sessions counts from the day it became Playing. Ties go to the game that became Playing most recently, then alphabetically by title.
   - **Question:** "**Continue** {game}?".
   - **Line above the question:**
     - the game's cover;
     - the last session in words, for example "Last session 3 days ago", or "Started playing 2 weeks ago" when the game has no sessions;
     - the platform the person recorded for this game. The platform is left out when none is recorded.
   - **Buttons:** **Log time** (primary) and **Not tonight**. The label follows spec 026's word list; the reference design's "Log a session" is not used anywhere.
2. **The first Up Next game.** Only the first game in the queue is asked about.
   - **Question:** "**Start** {game}?".
   - **Line above the question:** the cover, "First in Up Next", the recorded platform, and the game's length when known ("About 18 evenings").
   - **Buttons:** **Start playing** (primary) and **Not tonight**.
   - **Replay:** if the first queued game is a Done game queued for a replay, the question reads "**Play** {game} **again**?" and the primary button is **Play again**.
3. **A rest state.**
   - It reads "Nothing tonight is fine too.", with "Your games will be here when you come back." below.
   - It has one button, **Ask me again**, which returns to the first step that has a game.
   - The rest state has no tint.

Wording for "how long ago":

| Time since | Wording |
| --- | --- |
| same day | "today" |
| 1 day | "yesterday" |
| 2–13 days | "N days ago" |
| 14–29 days | "N weeks ago" (2–4, rounded down) |
| 30–59 days | "a month ago" |
| 60–364 days | "N months ago" (rounded down) |
| 365 days or more | "over a year ago" |

Behavior:
- **Not tonight** moves to the next game or step without changing anything about the game. On the Up Next question, it moves to the rest state. Nothing is remembered: leaving Home and coming back starts again at the first step that has a game.
- **Log time** opens the Log sheet with that game already chosen.
  - If the user saves time, the panel keeps asking about the same game, now with "Last session today".
  - If the user closes the sheet without saving, the panel is unchanged.
- **Start playing** and **Play again** change the game's status to Playing, exactly as the same buttons do elsewhere: the game leaves Up Next and an Undo option appears.
  - The panel then asks "Continue {game}?" about that game, with "Started playing today".
  - If the user taps Undo, the game returns to its previous status and queue position, and the panel asks the question it asked before.
- **Changing questions:** the old question fades out, the new one fades in, and the tint changes to the new game's cover. With the device's "reduce motion" setting on, the change is immediate.
- **Nothing to ask:** with no Playing games and an empty Up Next, there is no question panel. Home shows the existing empty state "Nothing playing right now", with "Pick from Up Next" and "Add a game".

- **Acceptance Criteria:**
  - [ ] Given three Playing games whose latest sessions were 3 days, 2 weeks and 40 days ago, when the user opens Home, then the panel asks "Continue {the 3-days game}?", with "Last session 3 days ago" and its recorded platform above the question.
  - [ ] Given the same three games, when the user taps "Not tonight" twice, then the panel asks about the 2-weeks game ("Last session 2 weeks ago") and then the 40-days game ("Last session a month ago"), in that order.
  - [ ] Given the panel is asking about the last Playing game and Up Next holds a Want game, when the user taps "Not tonight", then the panel asks "Start {first Up Next game}?", with "First in Up Next" and the game's length.
  - [ ] Given the panel asks "Start {first Up Next game}?", when the user taps "Not tonight", then the panel reads "Nothing tonight is fine too." with an "Ask me again" button and no tint.
  - [ ] Given the rest state, when the user taps "Ask me again", then the panel asks about the most recently played Playing game again.
  - [ ] Given the user tapped "Not tonight" on a game, when the user goes to the Library and back to Home, then the panel asks about the most recently played Playing game again, and that game's status and queue position are unchanged.
  - [ ] Given the panel asks "Continue {game}?", when the user taps "Log time", then the Log sheet opens with that game already chosen.
  - [ ] Given the panel asks "Continue {the 2-weeks game}?", when the user saves 1.5 hours in the Log sheet, then the panel still asks about that game and reads "Last session today".
  - [ ] Given the panel asks "Start {game}?", when the user taps "Start playing", then the game becomes Playing, leaves Up Next, an Undo option appears, and the panel asks "Continue {game}?" with "Started playing today".
  - [ ] Given the user just tapped "Start playing" on the panel, when they tap Undo, then the game is back in Up Next in its old position and the panel asks "Start {game}?" again.
  - [ ] Given a Playing game with no sessions that became Playing 15 days ago and no other Playing game, when the user opens Home, then the line above the question reads "Started playing 2 weeks ago".
  - [ ] Given two Playing games whose latest sessions were both yesterday, when the user opens Home, then the panel first asks about the one that became Playing more recently.
  - [ ] Given no Playing games and at least one Up Next game, when the user opens Home, then the first question is "Start {first Up Next game}?".
  - [ ] Given no Playing games and an empty Up Next, when the user opens Home, then there is no question panel and the empty state "Nothing playing right now" is shown.
  - [ ] Given the first Up Next game is a Done game queued for a replay and there are no Playing games, when the user opens Home, then the panel asks "Play {game} again?" with a "Play again" button.
  - [ ] Given a Playing game with no recorded platform, when the panel asks about it, then the line above the question shows the last-session wording with no platform and no stray separator.
  - [ ] When the user views Home in the phone layout, then there is no "Home" page title, and the question panel is the first thing below the top bar.
  - [ ] When the user views Home in the desktop layout, then the page title "Home" appears above the question panel.
  - [ ] Given "reduce motion" is turned on in the device settings, when the user taps "Not tonight", then the next question appears immediately without a fade.

#### 2.4 Home: below the question

Below the question panel, Home shows, in this order:

1. **Up Next shelf:** the queued games' covers in queue order, in a row that scrolls sideways.
   - The first cover is larger. Its caption is the game's length when known, otherwise its title.
   - Every other cover's caption is its title.
   - A Done game queued for a replay is captioned "Replay", in any position, including first.
   - Covers carry no status badges. This replaces the "home screen" part of 027 §2.13.
   - "See all" opens the Library filtered to Up Next.
   - The shelf has no tint.
   - The empty state stays as today: "Nothing queued yet — put up to 5 games in Up Next.", with "Find a game to add".
2. **Also playing:** every Playing game except the one first in the question order (2.3), in question order.
   - Each row shows the cover, title, recorded platform and a "Log" button, as today. "Log" opens the Log sheet with that game chosen.
   - The list is hidden when there is no other Playing game.
   - It stays the same while the user taps "Not tonight". It updates only when a game's status changes, for example after "Start playing" on the panel.
3. **Counts:** one quiet line, for example "28 games · 18 want · 3 playing · 7 done".
   - Each status part opens the Library filtered to that status. The total is plain text.
   - Parts with zero are left out.
   - With exactly one game, the total reads "1 game".
   - With an empty library, there is no counts line.

This replaces two earlier rules:
- spec 027 §2.12: the Up Next card is the first and largest element on Home;
- the spec 026 criterion that, with one Playing game, Up Next is visible without scrolling at 390 × 844.

The new rule: at 390 × 844, the first Up Next cover is fully visible without scrolling.

In the phone layout, Home has no "Add game" button; adding a game stays available from search in the top bar. In the desktop layout, "Add game" stays as an outline button next to the page title.

- **Acceptance Criteria:**
  - [ ] Given 4 games in Up Next, the first with a "Main story" time of 31 hours, when the user views Home, then the first cover is larger than the others and captioned "About 18 evenings".
  - [ ] When the user views the Up Next shelf, then no cover shows a "Want", "Playing" or "Done" badge.
  - [ ] Given a Done game queued for a replay in first position, when the user views the shelf, then the first, larger cover is captioned "Replay".
  - [ ] Given one Playing game and at least one Up Next game, when the user opens Home at 390 × 844, then the first Up Next cover is fully visible without scrolling.
  - [ ] Given three Playing games, when the user views Home, then "Also playing" lists the two games not asked about first, in question order, and the list does not change when the user taps "Not tonight".
  - [ ] Given one Playing game, when the user views Home, then there is no "Also playing" section.
  - [ ] Given one Playing game and one Up Next game, when the user taps "Start playing" on the panel, then the earlier Playing game appears under "Also playing".
  - [ ] When the user taps "Log" on an "Also playing" row, then the Log sheet opens with that game already chosen.
  - [ ] Given 28 games (18 Want, 3 Playing, 7 Done), when the user views Home, then the counts line reads "28 games · 18 want · 3 playing · 7 done".
  - [ ] When the user taps "3 playing" in the counts line, then the Library opens filtered to Playing.
  - [ ] Given no Done games, when the user views the counts line, then it has no "done" part.
  - [ ] Given exactly one game in the library, when the user views Home, then the counts line begins "1 game".
  - [ ] Given 5 games in Up Next, when the user scrolls the shelf sideways in the phone layout, then the page itself does not scroll sideways.

#### 2.5 Game page: overall order

The game page is regrouped into, top to bottom:
1. the header (2.6);
2. the "Your play" card (2.7), only for a signed-in visitor who has the game in their library;
3. the About card (2.7);
4. the screenshots row (2.8);
5. the related-games row (2.8).

Removed from the game page:
- the row of jump tabs;
- the side column in the desktop layout;
- the large critic-score ring and its "Critic consensus" card;
- the "Time played / Sessions" card;
- the separate "Times to beat" and "Themes / Genres / Platforms" cards;
- the blurred screenshot behind the header.

In the desktop layout, "Your play" and About sit side by side in two columns of equal width, both as tall as the taller of the two. Without a "Your play" card, About spans the full width.

- **Acceptance Criteria:**
  - [ ] When a signed-in user opens the game page of a game in their library, then the page shows, in order, the header, "Your play", About, the screenshots row and the related-games row.
  - [ ] When any visitor opens any game page, then there is no row of section tabs, no critic-score ring and no "Time played" card.
  - [ ] Given a signed-in user with the game in their library, when they view the game page in the desktop layout, then "Your play" and About are side by side with equal widths, and their bottom edges line up.
  - [ ] Given a visitor who does not have the game in their library, when they view the game page in the desktop layout, then About spans the full content width and there is no "Your play" card.
  - [ ] When the user views the game page in the desktop layout, then there is no column to the right of the main content.

#### 2.6 Game page: the header

The header is tinted (2.2). The tint starts at the top of the page and fades into the page background over the bottom third of the header, below the actions. A header with no tint fades from the neutral card color in the same way. The header holds, in reading order:

- **Top row:** Back, and a "⋯" menu button in both layouts.
  - Back returns to the screen the user came from, or to the Library when there is none (for example, a page opened from a shared link). Today it always goes to the Library.
  - The "⋯" menu holds "Edit details…", "I own it" or "I don't own it yet", the Up Next actions, and "Remove from library". It is shown only when the game is in the library.
- **Identity:**
  - the cover;
  - a small line in normal capitalization, "{year} · {developer} · {first genre}". A missing part is left out with its separator.
  - the game's title in the title font.
- **Key facts:** a row of up to three facts, each a small label over a value. A fact whose value is unknown is left out and the others close up.
  - **Length:** "About N evenings" (2.1).
  - **Critics:** the critic score as a whole number ("87"). It is the same size as the other facts and has no ring or chart.
  - **On:** the game's platforms, in the short names the app already uses for platform badges, separated by " · " (for example "PS5 · PC · XSX"). After three platforms it adds "+N".
- **Actions,** depending on the visitor:
  - **In the library, Playing:** the status control, the primary button **Log time**, and the text button **Done with it?** (2.9).
  - **In the library, Want:** the status control and the primary button **Start playing**.
  - **In the library, Done:** the status control, which reads "Done · Finished" or "Done · Let go" when a reason was chosen, and the primary button **Play again**.
  - **Signed in, game not in the library:** one primary button **Add to library**. It is the only add action on the page.
  - **Signed out:** a "Sign in to add this game" link and no other actions.

The key facts show to every visitor, signed in or not. Today, typical play time shows only to visitors who have the game.

**Layout:**
- In the desktop layout, the cover is on the left. The identity, key facts and actions are on the right, bottom-aligned with the cover, so there is no empty area beside the title.
- In the phone layout, the cover and identity share a row, with the key facts and actions below at full width.

- **Acceptance Criteria:**
  - [ ] Given a game with length, critic score and platforms known, when any visitor opens its game page, then the header shows three facts labelled "Length", "Critics" and "On", for example "About 8 evenings", "87" and "PS5 · PC · XSX".
  - [ ] Given a game on five platforms, when the user views its header, then "On" shows three short names followed by "+2".
  - [ ] Given a game with no critic score, when any visitor opens its game page, then the facts row shows only "Length" and "On", with no gap where "Critics" would be.
  - [ ] Given a signed-out visitor, when they open a game page, then the header shows the key facts and a "Sign in to add this game" link, and no status control or "Log time".
  - [ ] Given a signed-in user without the game, when they open its game page, then the page has exactly one "Add to library" button, in the header.
  - [ ] Given a Playing game in the user's library, when they open its game page, then the header shows the status control, a plum "Log time" button and a "Done with it?" text button.
  - [ ] Given a Want game in the user's library, when they open its game page, then the header's primary button is "Start playing".
  - [ ] Given a Done game with the reason Let go, when the user opens its game page, then the status control reads "Done · Let go" and the primary button is "Play again".
  - [ ] When the user taps "⋯" on the game page of a game in their library, in either layout, then a menu opens with "Edit details…", the ownership choice, the Up Next actions and "Remove from library".
  - [ ] When the user views the header in the desktop layout, then the title, facts and actions sit to the right of the cover and end level with the cover's bottom edge.
  - [ ] Given the user opened a game page from Home, when they tap Back, then they return to Home.
  - [ ] Given a game with no known developer, when the user reads the line above the title, then it reads "{year} · {first genre}" in normal capitalization, for example "2025 · Shooter".

#### 2.7 Game page: "Your play" and About

**"Your play"** shows only to a signed-in visitor who has the game in the library. It holds the person's own record for the game:
- The title "Your play" and a **New note** button, which opens the Log sheet with this game chosen.
- One line with the session count and time played ("3 sessions · 4.5 h", "1 session · 2 h"), or "No sessions yet". Next to it are the rating stars, which can be set or changed here.
- The game-page question from spec 026: "Why do you want to play this?" for a Want game, "What stayed with you?" for a Done game, and none for a Playing game. As today, the question has a text field, and the answer is saved as a note.
- The two most recent notes, with or without time, each with its date in the body font. When there are more than two, "All notes ({n})" shows the rest in the same card.
- The History of earlier plays, collapsed and read-only, as today. It is hidden when the game has no ended plays.

**About** shows to every visitor:
- The title "About".
- The game's description, cut to four lines, with a "More" link that shows the rest.
- A short list: Developer, Released (full date), and the two typical play times in hours as supporting detail. The labels are the ones settled in 2.1, today "Main story" and "100%". Rows with unknown values are left out.
- The game's themes and genres as small tags, in one group.

- **Acceptance Criteria:**
  - [ ] Given a game in the user's library with 3 sessions totalling 4.5 hours, when they view the game page, then "Your play" reads "3 sessions · 4.5 h".
  - [ ] Given a game in the user's library with no sessions, when they view the game page, then "Your play" reads "No sessions yet", and no "0 h" appears anywhere on the page.
  - [ ] Given 5 notes on the game, when the user views "Your play", then the two newest notes appear with their dates, together with an "All notes (5)" link.
  - [ ] Given 5 notes on the game, when the user taps "All notes (5)", then all five notes appear in the card, newest first.
  - [ ] When the user taps "New note" in "Your play", then the Log sheet opens with this game already chosen.
  - [ ] Given a Want game in the library, when the user views "Your play", then it shows the "Why do you want to play this?" question with a text field.
  - [ ] Given a Playing game in the library, when the user views "Your play", then it shows no question.
  - [ ] Given a game that has never left Playing, when the user views "Your play", then no History section appears.
  - [ ] Given a description longer than four lines, when the user taps "More" in About, then the full description appears.
  - [ ] When the user views About for a game with typical play times of 14.5 and 19 hours, then the list shows both times in hours, and the header's Length fact reads "About 8 evenings".
  - [ ] When the user views About, then themes and genres appear together as one group of tags, and there is no separate Themes or Platforms card.

#### 2.8 Game page: screenshots and related games

- **Screenshots** become one row that scrolls sideways, in both layouts. Tapping a screenshot opens it large, as today. When the game has no screenshots, the row and its label are hidden.
- **Related games** become one row that scrolls sideways.
  - **Title:** "More in {series}" for the game's series. A game in several series shows only its first series; today each series gets its own tab.
  - **Covers:** all the same size, each captioned with the game's title. A related game with no cover art shows the app's standard no-cover placeholder with its name.
  - **"All {n}"** opens the full list, as today.
  - When there are no related games, the row is hidden.
- Neither row makes the page scroll sideways, and covers and screenshots keep a visible gap between them.

- **Acceptance Criteria:**
  - [ ] Given a game with 8 screenshots, when the user views the game page in the desktop layout, then the screenshots appear in a single row that scrolls sideways, not in a grid.
  - [ ] When the user taps a screenshot, then it opens large over the page.
  - [ ] Given a game with no screenshots, when the user views the game page, then there is no Screenshots label and no row.
  - [ ] Given a game in the Metal Gear series with 35 related games, when the user views the game page, then a row titled "More in Metal Gear" shows same-size covers with titles that scroll sideways, and an "All 35" link.
  - [ ] When the user scrolls either row sideways in the phone layout, then the page itself does not scroll sideways, and neighbouring covers or screenshots never touch.

#### 2.9 Game page: "Done with it?"

For a Playing game, **Done with it?** offers the two Done reasons in place, without a menu.

- Tapping it replaces the text button with two buttons, **Finished** and **Let it go**, side by side. Below them is the line "Both move it to Done. Only you see which one." and a **Not yet** text button, which puts back "Done with it?" and changes nothing.
- **Choosing a reason** marks the game Done with that reason. The existing Done dialog then opens as today (rating, "What stayed with you?", Skip and Save), with the chosen reason already selected. Closing the dialog any way leaves the game Done with the chosen reason, as Skip does.
- **No Undo message.** As for any change to Done, the Done dialog takes the place of the Undo message. The status control still changes the status back.
- **Wording:** the button reads "Let it go". The reason it sets is called "Let go" everywhere else.

- **Acceptance Criteria:**
  - [ ] Given a Playing game, when the user taps "Done with it?", then the buttons "Finished" and "Let it go" appear in its place, with the line "Both move it to Done. Only you see which one." and a "Not yet" button.
  - [ ] Given the two reasons are showing, when the user taps "Not yet", then "Done with it?" returns and the game is still Playing.
  - [ ] When the user taps "Let it go", then the game becomes Done and the Done dialog opens with "Let go" already selected.
  - [ ] Given the user chose "Finished" and then closed the Done dialog without saving, when they view the game page, then the status control reads "Done · Finished".
  - [ ] When the user views the game page of a Want or Done game, then there is no "Done with it?" button.

#### 2.10 Library cards

Library cards get the same cover treatment as Home, and show the game's length.

- **No badge on the cover.** The status appears once, in the status control below the title. This replaces the "library card" part of 027 §2.13 for the cover only; the status control keeps the 027 chip.
- **Length.** Each card shows "About N evenings" (2.1) under the title, for Want, Playing and Done games alike. A game with no length leaves that line blank, so cards side by side in the desktop grid stay aligned.
- **No tint.** Cards are not tinted (2.2).
- **Unchanged:** the title, "Up Next #n" or "Not owned" when they apply, the platform, the rating, the status control, the next-step button and the "⋯" menu.

- **Acceptance Criteria:**
  - [ ] When the user views the Library page, then no cover shows a status badge, and each card shows its status once, in the status control.
  - [ ] Given a library game with a "Main story" time of 8.5 hours, when the user views its card, then it reads "About 5 evenings" under the title.
  - [ ] Given a Done game with a "Main story" time of 34 hours, when the user views its card, then it reads "About 19 evenings".
  - [ ] Given two neighbouring cards in the desktop grid, one with a length and one without, when the user views them, then their platform lines start at the same height.
  - [ ] When the user views the Library page in Light and in Dark, then no card has a tinted background.

#### 2.11 Phone, themes and motion

Everything in this spec meets the phone baseline of spec 027 §2.6 and the readability level (2.0), at every phone width and in Light and Dark:
- no sideways page scrolling;
- tap targets at least 44 × 44 points;
- body text at least 15 points;
- nothing that works only on hover.

Thumb reach on Home: the question panel sits near the top of the screen, so its buttons are not in the bottom third that spec 027 §2.6 calls the thumb zone. The bottom bar's "Log" button stays in that zone and does the same job. This is an accepted exception to 027 §2.6's rule that a screen's primary button sits in the thumb zone.

- **Acceptance Criteria:**
  - [ ] Given each phone width (360, 390 and 430 points), when the user views Home, the game page and the Library, then the page never scrolls sideways, and no text, button or cover is cut off, apart from long names that end with "…" by design.
  - [ ] When the user measures the "Log time", "Not tonight", "Done with it?", "Finished", "Let it go" and "Not yet" buttons in the phone layout, then each tap area is at least 44 × 44 points.
  - [ ] Given the longest game name in the user's library, when the Home question asks about that game at 360 points wide, then the whole question wraps onto several lines without being cut off, and both buttons stay visible inside the panel.
  - [ ] When the user views Home in the phone layout, then the bottom bar's "Log" button is in the bottom third of the screen.

#### 2.12 Setting: how long is an evening

A person can choose how long an evening of play is for them. Every length in evenings follows that choice.

- **Where:** Settings has the item "How long is an evening for you?".
- **Choices:** 1 h, 1.5 h, 1.75 h, 2 h, 2.5 h and 3 h. It starts at 1.75 h.
- **What it changes:**
  - The choice is saved with the person's account, so it applies on every device they sign in on.
  - It changes only what that person sees.
  - Time played, which is shown in hours, is not affected.
- **Example line:** under the choices, a line shows what the current choice means, for example "A 14.5-hour game is about 8 evenings."

- **Acceptance Criteria:**
  - [ ] Given a user who has never changed the setting, when they open Settings, then "How long is an evening for you?" shows 1.75 h selected.
  - [ ] Given the setting is 1.75 h, when the user views the example line, then it reads "A 14.5-hour game is about 8 evenings."
  - [ ] Given a game whose "Main story" time is 14.5 hours, when the user changes the setting to 3 h and opens that game's page, then its length reads "About 5 evenings".
  - [ ] Given the setting is 3 h, when the user views a library card for a game whose "Main story" time is 2 hours, then it reads "One evening".
  - [ ] Given the user changed the setting to 2 h on one device, when they sign in on another device, then the setting shows 2 h there too.
  - [ ] Given the user changed the setting, when a signed-out visitor opens the same game page, then the visitor sees the length based on 1.75 h.
  - [ ] Given the user changed the setting to 3 h, when they view "Your play" for a game with 4.5 hours played, then it still reads "4.5 h".

---

## 3. Scope and Boundaries

### In-Scope

- Home in both layouts: the question panel, the simplified Up Next shelf, "Also playing" and the counts line.
- Cover tint on the Home question panel and the game page header.
- Game length in evenings on the game page header, in the Home question and shelf, and on library cards.
- The regrouped game page in both layouts, including "Done with it?" and a working "⋯" menu.
- Library cards: no cover badge, and a length line.
- A Settings choice for the length of an evening (2.12).
- Changes to earlier specs that this requires:
  - spec 026: its rule that every time shows in hours (game length moves to evenings) and its Up Next visibility criterion;
  - spec 027: §2.4 and §2.9 (the tint exception), §2.6 (thumb zone on Home), §2.12 (Up Next no longer first) and §2.13 (no badges on Up Next and library covers);
  - spec 023: the critic-score ring.

### Out-of-Scope

- Learning the evening length automatically from the person's own sessions. The length is set by the person in Settings (2.12).
- Remembering "Not tonight", or suggesting to shelve a game that is skipped often.
- Suggestions of what to play next by mood, length or ownership. The question uses only the Playing order and the Up Next queue.
- Tinting any surface other than the Home question panel and the game page header, including the shelf, library cards, the journal and profile.
- Showing game length anywhere not listed in 2.1, including the journal, profile, search and the landing page.
- Changes to the desktop sidebar. Its "Log" button stays filled plum.
- A soft limit on the number of Playing games.
- New platform or store imports.

---

## Change Log

_Dated amendments made after the spec was first written — typically by `/awos:spec` in Update Mode when a bug fix changed documented behavior. Each entry records the date, the source reference (bug id or fix description), and what behavior changed and why. Leave empty until the first amendment._
