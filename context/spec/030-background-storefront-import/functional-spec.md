# Functional Specification: Background Steam sync

- **Topic:** A person who has connected Steam presses Sync and can leave. SavePoint brings in their Steam library and finds every game in the game catalogue while they do something else, shows how far it has got, can optionally add every found game to their library, and tells them when it is done. Steam only; Xbox and PlayStation reuse the same behaviour later.
- **Status:** Draft
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

Filling the library from Steam is slow. Today a person presses "Import from Steam" and waits while the whole library comes in. Every game then sits on the import list without a cover or release information. Each game is only looked up in the game catalogue when the person adds it, one game at a time, through a dialog. A person with hundreds of Steam games has no practical way to get their library into SavePoint.

The current import also sets wrong expectations:

- a message says "We'll notify you when it's complete", and no notification ever comes;
- a "N games imported" message counts every game again on each import, not just the new ones;
- a private Steam library can produce "0 games imported successfully" instead of telling the person how to fix it;
- the "What's new" entry promises that games and time played come into the library automatically, which they don't.

This spec turns the import into a **background sync**:

- **Press Sync and leave.** The sync keeps going while the person uses the rest of SavePoint or closes it.
- **Games arrive already found.** Each game is looked up in the game catalogue during the sync, so the import list shows covers and release years, and only games without a catalogue entry need a manual match.
- **Optionally, add everything.** A person who doesn't want to curate game by game can tick one box and have every found game added to their library.
- **They're told when it's done**, with a short summary.

**Success looks like:**

- A person with a 1,000-game Steam library can press Sync, close SavePoint, come back a few minutes later and find every game on the import list with its catalogue details, except games the catalogue has no entry for.
- A person who ticks "Also add all games to my library" ends the sync with every found game in their library, without opening a single dialog.
- No sync ever ends with a misleading message. A private or empty Steam library produces instructions instead of "0 games imported".

---

## 2. Functional Requirements (The "What")

### 2.0 Definitions used in this specification

**Places and things the person already sees today**

- **Steam connection:** the link between a SavePoint account and a Steam account. The person makes it by pressing "Sign in with Steam" on the account settings page. While connected, the **Steam card** on that page reads "Steam Account Connected", shows the Steam ID, and has a "Disconnect" button and an "Import from Steam" link.
- **Import page:** the "Import from Steam" page. It lists, 25 at a time, the person's Steam games that are not in their library and not removed. This includes games they no longer own on Steam but imported earlier. It has filters (search, time played, platform, last played), a sort menu and a "Show removed games" checkbox, which also lists removed games.
- **Imported game:** one row on the import page. It shows a game picture, a name, time played ("Never played" when zero), when it was last played, and a suggested-status badge. Each row has a **+** button ("Add to library") and an **×** button ("Remove game").
- **Add game dialog:** opens from a row's **+** button. It shows time played, last played and a "Library status" choice (Want or Playing; the suggested status is pre-selected), plus an "Import" button that adds the game to the library. When SavePoint does not know which catalogue game it is, the dialog first shows a **"Select correct game"** step: a search box where the person finds and picks the right game.
- **"Connect Steam to see your games":** the prompt the import page shows today to a person without a Steam connection, with a "Connect Steam" link to account settings.
- **"What's new":** the in-app list of recent changes. Its Steam entry today reads "Connect your Steam account to import your game library automatically. Your games and time played will come into your library."

**Concepts this spec introduces or relies on**

- **Game catalogue:** the public game database SavePoint takes game details from: title, cover and release date.
- **Library:** the games the person tracks, each with a status: **Want**, **Playing** or **Done**. A Steam game is **already in the library** when its catalogue game is in the library, however it got there (through the import page, a previous sync, or the person adding it by hand).
- **Three-in-progress nudge:** when the person moves a fourth game to Playing while three are already Playing, SavePoint gently asks whether to put one aside.
- **Looked up:** the sync has checked an imported game against the game catalogue. A looked-up game ends up either **found** or **needs a match**.
- **Found game:** a looked-up game whose catalogue entry is the one the catalogue itself lists for that Steam game. SavePoint never guesses a found game from its title. A game SavePoint has already found in an earlier sync, by anyone, counts as looked up straight away.
- **Needs a match:** a looked-up game that the catalogue has no entry for, or that could not be checked because the catalogue was unavailable. Every sync looks these games up again, in case the catalogue has gained an entry or is available again.
- **Suggested status:** **Playing** if the game was played on Steam in the 7 days before the moment it is added, otherwise **Want**.
- **Removed game:** an imported game the person removed with **×**. A sync never brings it back to the import page or adds it to the library.
- **Sync:** one run of bringing in the person's Steam library. It starts when the person presses "Start sync" and ends when it **finishes** or **fails**. In between it is **running**.
- **Being in SavePoint:** having at least one SavePoint page open while signed in. **Opening SavePoint** means loading any SavePoint page while signed in: a new tab, a reload, or another device.

### 2.1 Starting a sync

- **2.1.1** On the import page, a person with a connected Steam account sees a **Sync** button in place of today's "Import from Steam" button. Pressing it opens a short confirmation:
  - **Title:** "Sync your Steam library"
  - **Text:** "We'll bring in your Steam games and look each one up. You can leave this page — we'll let you know when it's done."
  - **Checkbox:** "Also add all games to my library", unticked by default.
  - **Buttons:** "Start sync" and "Cancel".
  - **Acceptance Criteria:**
    - [ ] When the person presses Sync on the import page, then they see the "Sync your Steam library" confirmation with the "Also add all games to my library" box unticked.
    - [ ] When the person presses "Start sync", then the confirmation closes and the import page shows that a sync is running (see 2.2).
    - [ ] When the person presses "Cancel" in the confirmation, then no sync starts and the import page is unchanged.

- **2.1.2** Each SavePoint person can have only one sync running at a time. While one is running, the Sync button reads "Syncing…" and cannot be pressed, and the progress (2.2) appears directly below it. This holds after leaving and returning, after reloading, and on another device. If two tabs both press "Start sync", only one sync starts; the other tab sees "A sync is already running" and then shows that sync's progress.
  - **Acceptance Criteria:**
    - [ ] Given a sync is running, when the person opens the import page in a new tab or on another device, then the Sync button reads "Syncing…", cannot be pressed, and has the sync's progress below it.
    - [ ] Given a sync is running, when the person leaves the import page and comes back, then they see the same running sync's progress.
    - [ ] Given two tabs show the confirmation, when the person presses "Start sync" in the first and then in the second, then the second tab shows "A sync is already running" and only one sync's progress appears.
    - [ ] Given a sync has just finished or failed, when the person looks at the import page, then the Sync button can be pressed again.

- **2.1.3** A person without a Steam connection cannot start a sync. If they have never imported, the import page shows "Connect Steam to see your games", as today. If they have imported games from earlier, the page keeps listing them. In place of the Sync button, they see "Connect Steam to sync" with a link to account settings.
  - **Acceptance Criteria:**
    - [ ] Given the person has no Steam connection and no imported games, when they open the import page, then they see "Connect Steam to see your games" and no Sync button.
    - [ ] Given the person disconnected Steam after an earlier sync, when they open the import page, then they see their imported games and "Connect Steam to sync" in place of the Sync button.

- **2.1.4** There is no limit on how often a person can sync beyond one sync at a time, and no limit on library size.
  - **Acceptance Criteria:**
    - [ ] Given a sync has just finished, when the person presses Sync and then "Start sync", then a new sync starts.
    - [ ] Given a Steam library of 5,000 games, when the sync finishes, then every one of them is either on the import page, removed, or already in the library.

### 2.2 Seeing a sync's progress

- **2.2.1** While a sync is running, the import page and the Steam card on the account settings page show what it is doing, in two stages:
  - "Fetching your Steam library…" until SavePoint has the list of games the person owns on Steam;
  - then "Looking up your games — 340 of 1,200".

  The second number counts every game in the Steam library that is neither removed nor already in the library. The first number counts how many of those have been looked up so far; games SavePoint already knows count immediately. The page updates on its own, without a reload.
  - **Acceptance Criteria:**
    - [ ] Given a sync has just started, when the person looks at the import page, then they see "Fetching your Steam library…".
    - [ ] Given the sync is looking up games, when the person keeps the import page open without reloading, then the first number in "Looking up your games — X of Y" increases until it equals the second.
    - [ ] Given a sync is running, when the person opens the account settings page, then the Steam card shows the same stage and numbers as the import page.

- **2.2.2** Games appear on the import page as soon as Steam's list has arrived. A game not yet looked up looks as it does today: Steam picture and Steam name, no label. A game appears as found or as "Needs a match" once looked up, while the sync is still running. The person can add or remove games without waiting for the sync to finish. The first sync after this feature also looks up games imported before it existed.
  - **Acceptance Criteria:**
    - [ ] Given a sync is looking up games, when the person reloads the import page, then looked-up games show as found or "Needs a match" and the rest show their Steam picture and name.
    - [ ] Given a sync is running, when the person adds a found game to their library from the import page, then it is added and does not reappear on the import page when the sync finishes.
    - [ ] Given games imported before this feature, when the person's first sync finishes, then those games show as found or "Needs a match".

- **2.2.3** For a 1,000-game Steam library whose games SavePoint has never seen, with nobody else syncing, it takes no more than 5 minutes from pressing "Start sync" to the "Steam sync finished" message.
  - **Acceptance Criteria:**
    - [ ] Given a test account with a 1,000-game Steam library new to SavePoint and no other syncs running, when the person presses "Start sync", then "Steam sync finished" appears within 5 minutes.

- **2.2.4** After a sync ends, the progress disappears from the import page and the Steam card. After a failure, the import page shows the failure reason above the list until the next sync starts (2.6.3).
  - **Acceptance Criteria:**
    - [ ] Given a sync has finished, when the person opens the account settings page, then the Steam card shows no progress and looks as it did before the sync.

### 2.3 What a sync does to the import page

- **2.3.1** New Steam games appear on the import page. Games already on it get their Steam name, picture, time played and last-played date refreshed. Removed games stay removed, and games already in the library don't come back to the import page. Games no longer in the Steam library stay on the import page.
  - **Acceptance Criteria:**
    - [ ] Given the person bought a new game on Steam since their last sync, when the sync finishes, then that game is on the import page.
    - [ ] Given the person played a game on the import page since their last sync, when the sync finishes, then its time played shows the new total.
    - [ ] Given the person removed a game from the import page, when a sync finishes, then that game appears only when "Show removed games" is ticked.

- **2.3.2** A found game shows its catalogue cover, catalogue title and release year, together with its time played and last-played date. If the catalogue has no cover, it shows the Steam picture. If the catalogue has no release date, the year is left out. When the person adds a found game, the Add game dialog skips the "Select correct game" step.
  - **Acceptance Criteria:**
    - [ ] Given a sync has finished, when the person looks at a found game on the import page, then they see its catalogue cover, catalogue title and release year.
    - [ ] Given a found game, when the person presses its **+** button, then the Add game dialog shows the "Library status" choice straight away, with no "Select correct game" step.

- **2.3.3** A game that needs a match shows its Steam picture and Steam name, labelled **"Needs a match"**. Pressing **+** opens the Add game dialog at the "Select correct game" step. The next sync looks it up again, and if the catalogue now has its entry, it becomes a found game.
  - **Acceptance Criteria:**
    - [ ] Given a game showed "Needs a match" because the catalogue was unavailable, when the person syncs again with the catalogue available, then that game shows as found.
    - [ ] Given the catalogue has no entry for one of the person's Steam games, when the sync finishes, then that game shows "Needs a match".
    - [ ] Given a game that needs a match, when the person presses its **+** button, then they see "Select correct game" with a search box.

- **2.3.4** A warning appears above the list only when at least one game on the current page needs a match. It reads "Some games need a match — Press + on a game marked 'Needs a match' to pick the right game." This replaces today's "Some games need a manual match — Click "Search" on a row to find the right entry.", which points at a button that doesn't exist.
  - **Acceptance Criteria:**
    - [ ] Given no game on the import page needs a match, when the person opens the page, then no "Some games need a match" warning is shown.
    - [ ] Given at least one game on the page needs a match, when the person opens the import page, then they see "Some games need a match — Press + on a game marked 'Needs a match' to pick the right game."

### 2.4 Adding all games to the library

- **2.4.1** If the person ticked "Also add all games to my library", each found game is added to the library with its suggested status as soon as it is looked up. This skips games that are already in the library and removed games. Added games leave the import page. The three-in-progress nudge is not shown during these additions, so a library with many recently played games can end up with more than three games in Playing; the person accepted this. Later manual changes to Playing still show the nudge.
  - **Acceptance Criteria:**
    - [ ] Given the box was ticked, when the sync finishes, then every found game is in the library and no longer on the import page.
    - [ ] Given the box was ticked and a game was played on Steam in the 7 days before the sync, when the sync finishes, then that game is in the library as Playing.
    - [ ] Given the box was ticked and a game was last played more than 7 days before the sync or never, when the sync finishes, then that game is in the library as Want.

- **2.4.2** Adding all games never changes a game already in the library and never adds a removed game. Games that need a match are not added and stay on the import page. If a ticked sync fails or gets stuck partway, the games already added stay in the library.
  - **Acceptance Criteria:**
    - [ ] Given a game is in the library as Done, when a ticked sync finishes, then that game is still Done.
    - [ ] Given the box was ticked, when the sync finishes, then games that need a match are on the import page, marked "Needs a match", and not in the library.
    - [ ] Given the box was ticked and the person had removed a game, when the sync finishes, then that game is not in the library.
    - [ ] Given the box was ticked and the sync failed partway, when the person opens the library, then the games added before the failure are there.

- **2.4.3** If the box was not ticked, the sync adds nothing to the library.
  - **Acceptance Criteria:**
    - [ ] Given the box was not ticked, when the sync finishes, then the library contains exactly the same games as before the sync.

### 2.5 Being told the sync is done

- **2.5.1** When a sync finishes while the person is in SavePoint, then within 1 minute a message appears on whichever page they are on: **"Steam sync finished"**, with a summary and a "Review games" action that opens the import page. Each part of the summary counts these games:
  - **"N new games"**: games that were neither on the import page nor in the library before the sync.
  - **"N already on your list"**: games that were on the import page before the sync and got refreshed.
  - **"N added to your library"**: games added by "Also add all games to my library". Only shown when the box was ticked; these games are also counted in the first two parts.
  - **"N need a match"**: games on the import page that need a match after the sync.

  Parts are joined with " · ". A part that would be 0 is left out, and a count of 1 uses the singular ("1 new game"). The message stays until the person closes it or presses "Review games". It appears in every open SavePoint tab, and closing it in one tab closes it in all of them.
  - **Acceptance Criteria:**
    - [ ] Given the person has the library page open in one tab and watches the import page in another, when the import page's progress shows the sync is done, then within 1 minute the library tab shows "Steam sync finished" with a summary and a "Review games" action.
    - [ ] Given a sync found 1 new game and no game needs a match, when the finish message appears, then it reads "1 new game" and says nothing about matches.
    - [ ] Given a sync of a library with no new games, when the finish message appears, then it has no "new games" part, rather than repeating the library's full size as new.
    - [ ] When the person presses "Review games", then the import page opens and the message closes.

- **2.5.2** If the sync finishes while the person is not in SavePoint, they see the same message the next time they open SavePoint. Each sync's message is shown only once: seeing it live counts. If several sync results are waiting, only the most recent one is shown. There is no email, phone or browser notification.
  - **Acceptance Criteria:**
    - [ ] Given the person closed every SavePoint tab before their sync finished, when they next open SavePoint, then they see the "Steam sync finished" message.
    - [ ] Given the person has closed the finish message, when they open SavePoint again on any device, then it is not shown again.

### 2.6 When a sync fails

- **2.6.1** If Steam returns no games, the sync fails with a message explaining Steam's privacy settings instead of reporting a success:

  > "We couldn't see any games on your Steam account. If you own games, open Steam → Privacy Settings, set 'Game details' to Public, and untick 'Always keep my total playtime private'. Steam can take a few minutes to apply the change — then sync again."

  Steam returns no games when the library's game details are private, or when the account owns no games. If Steam returns games without time played, the sync succeeds and those games show "Never played", with Want as their suggested status.
  - **Acceptance Criteria:**
    - [ ] Given the Steam account's "Game details" privacy setting is not Public, when the person starts a sync, then the sync fails with the privacy message above, never "0 games imported".
    - [ ] Given a sync failed this way, when the person looks at the import page, then its games are unchanged and Sync can be pressed again.

- **2.6.2** If Steam is unavailable or refuses because of too many requests, the sync fails with today's messages: "Steam is temporarily unavailable. Please try again later." or "Too many requests to Steam. Please wait a moment and try again." In a test environment, testers simulate these Steam answers.
  - **Acceptance Criteria:**
    - [ ] Given Steam is unavailable, when the person starts a sync, then it fails with "Steam is temporarily unavailable. Please try again later." and the import page is unchanged.
    - [ ] Given Steam refuses because of too many requests, when the person starts a sync, then it fails with "Too many requests to Steam. Please wait a moment and try again." and the import page is unchanged.

- **2.6.3** A failure is reported like a finish (2.5): a message titled **"Steam sync failed"** with the reason. It appears within 1 minute if the person is in SavePoint, or once the next time they open SavePoint. The import page also shows the reason above the list until the next sync starts.
  - **Acceptance Criteria:**
    - [ ] Given a sync failed while the person had no SavePoint tab open, when they next open SavePoint, then they see "Steam sync failed" with the reason.
    - [ ] Given the last sync failed, when the person opens the import page, then they see the failure reason above the list.

- **2.6.4** A running sync that shows no change in stage or numbers for 30 minutes counts as stuck. It fails with the reason "Steam sync stopped unexpectedly. Please sync again.", which is reported as in 2.6.3, and Sync becomes available. In a test environment, testers simulate a stuck sync.
  - **Acceptance Criteria:**
    - [ ] Given a sync has shown no change for 30 minutes, when the person opens the import page, then they see "Steam sync stopped unexpectedly. Please sync again." and Sync can be pressed.

- **2.6.5** If the person disconnects Steam while a sync is running, the sync still finishes. Its games stay on the import page (shown as in 2.1.3), "Also add all games" still applies, and the finish message still appears.
  - **Acceptance Criteria:**
    - [ ] Given a sync is running, when the person disconnects Steam, then the sync still ends with "Steam sync finished" and its games are listed on the import page under "Connect Steam to sync".

### 2.7 Honest import wording elsewhere

- **2.7.1** The "What's new" Steam entry is replaced with: "Connect Steam and sync your library — SavePoint looks up every game for you, and can add them all to your library in one go."
  - **Acceptance Criteria:**
    - [ ] When the person opens "What's new", then the Steam entry reads "Connect Steam and sync your library — SavePoint looks up every game for you, and can add them all to your library in one go."

- **2.7.2** The import no longer shows the old "Steam import started — This may take a few minutes. We'll notify you when it's complete." or "N game(s) imported successfully." messages. The sync's start (2.1) and finish (2.5) messages replace them.
  - **Acceptance Criteria:**
    - [ ] When the person starts a sync, then they do not see "We'll notify you when it's complete."

---

## 3. Scope and Boundaries

### In-Scope

- A sync for Steam, started by pressing Sync on the import page.
- The sync keeps going after the person leaves the page or closes SavePoint.
- Every Steam game is looked up in the game catalogue during the sync, including games imported before this feature.
- Progress on the import page and the Steam card.
- One sync at a time per person, which also blocks starts from other tabs and devices.
- An optional "Also add all games to my library" that uses the suggested status.
- Finish and failure messages while in SavePoint, and once on the next visit.
- The privacy-settings message for a Steam library with no visible games.
- The stuck-sync limit.
- Corrected import wording: the "What's new" entry, the start and finish messages, and the "needs a match" warning.

### Out-of-Scope

- **Xbox and PlayStation.** They will reuse this behaviour in later specs.
- **Automatic or scheduled syncs** (e.g. daily). Every sync is started by the person.
- **Cancelling a running sync.**
- **A daily or hourly limit on syncs.**
- **A "last synced" date** on the import page or the Steam card.
- **A "finished with gaps" summary** or a retry inside the same sync for games that could not be looked up. Such games show as "Needs a match" (2.3.3) and are checked again on the next sync.
- **Changing a found game's match.** Found games come from the catalogue's own Steam listing.
- **Seeing games already added to the library** on the import page.
- **Changing "Restore"** on removed games. It still opens the Add game dialog.
- **Removing games from the import page or library** when they leave the Steam library.
- **Copying Steam time played into library entries**, and **choosing the library platform** for imported games.
- **Email, phone or browser notifications.**
- **Adding a hand-picked selection** of imported games in one go.

---

## Change Log

_No amendments yet._
