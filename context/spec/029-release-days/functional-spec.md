# Functional Specification: Release days

- **Topic:** Show when upcoming games in a person's library come out. Library cards and the game page show the release date as precisely as it is actually known. Home gets a quiet "Coming soon" section, and a new "Upcoming releases" page lists every game with an exact date ahead. Dates stay current when a release is announced or moved.
- **Status:** Draft
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

A person who adds games that aren't out yet has no overview of what is coming. Today:

- library cards and Home show no release date at all;
- the game page shows a date labelled "Released" even when it is months away;
- a game's date is copied once, when it first enters SavePoint, and never updated, so a delayed game keeps its old date;
- a vague date such as "2027" is kept as if it were an exact day, so it can show as "31 Dec 2027".

This spec gives the person a calm, accurate view of their own upcoming games. It follows the product's principle "pause before buying": release dates are plain information. There are no countdowns, no "N days left", no store links and no alerts outside the app.

- **Dates are honest.** A date is shown only as precisely as it is known: "14 Mar 2027", "Mar 2027", "Q2 2027", "2027" or "Date TBA".
- **Dates stay current.** When the person opens Home or the library, SavePoint checks for changed dates, so an announced or delayed date shows up without anyone editing it.
- **Coming soon on Home** shows what comes out today and in the next 30 days. This is the part that matters most if only one piece ships first.
- **Upcoming releases** lists every game in the library with an exact release date ahead.

**Success looks like:**
- A person can see every upcoming, exactly dated game in their library on one page, in date order.
- On the day a game with an exact date comes out, a person who opens Home sees it marked "Out today" in Coming soon, or, when more than three games come out that day, finds it under "See all upcoming".
- No game with only a month, quarter or year date is ever shown as if it had an exact day.

---

## 2. Functional Requirements (The "What")

### 2.0 Definitions used in this specification

**Games and dates**

- **Library:** the games a person has added to SavePoint. Each has a status, **Want** (not started), **Playing** or **Done**, and may carry a **"Not owned"** tag, which the person sets for games they don't own yet.
- **Game catalogue:** the public game database SavePoint takes game details from, including release dates.
- **Release date:** the date the game catalogue gives as the game's first release, on any platform and in any region, together with how precisely the catalogue knows it. A release date is a calendar day with no time of day: "14 March" means 14 March wherever the person is.
- **Precision:** how exactly a release date is known: **exact day**, **month**, **quarter**, **year**, or **TBA** (the catalogue says the date is to be announced). A game can also have **no date** at all, with no TBA mark.
- **Exact date:** a release date with exact-day precision.
- **Today:** the current calendar date on the person's own device, in their own timezone.
- **Upcoming game:** a game in the person's library that is not out yet, whatever its status and whether or not it is owned. A game with an exact date is upcoming when that date is today or later. A game with a month, quarter or year date is upcoming until that whole period has ended: "Mar 2027" until the end of 31 March 2027, "Q2 2027" until the end of 30 June 2027, "2027" until the end of 31 December 2027. A TBA game is always upcoming.
- **Released game:** a game with a date that is not upcoming by the rule above.
- **Date label:** the short text that shows a release date at its precision (2.1).

**Screens**

- **Library views:** the Library page shows games either as a **grid** of cover tiles or as a **list** of cards. In this spec, "library card" means either form, and every criterion about library cards applies to both views.
- **Length line:** the line on a library card that tells how long a game is, for example "About 8 evenings".
- **Home:** the first screen after sign-in. From top to bottom it shows the **"Continue?" panel**, which asks whether to continue or start a game; the **Up Next shelf**, the covers of the person's queue of up to 5 games to play next; **"Also playing"**, the other games in progress, or the message "Nothing playing right now" when none are; and the **counts line**, a short line counting the person's games by status.
- **Cover tint:** a soft background color taken from a game's cover art. On Home only the "Continue?" panel has one.
- **Phone layout:** any window narrower than 768 points, designed at 390 × 844 points. **Desktop layout:** 768 points and wider.

### 2.1 Date labels show a date only as precisely as it is known

Wherever this spec shows a release date, it uses one of these forms:

| Precision | Label | Example |
|---|---|---|
| Exact day, this year | day and short month | 14 Mar |
| Exact day, another year | day, short month, year | 14 Mar 2027 |
| Month | short month and year | Mar 2027 |
| Quarter | quarter and year | Q2 2027 |
| Year | year | 2027 |
| TBA | the words "Date TBA" | Date TBA |

A game with no date has no label.

- **Acceptance Criteria:**
  - [ ] Given an upcoming game whose release is known only as the year 2027, when the person views its library card or game page, then they see "2027" and never a specific day such as "31 Dec 2027".
  - [ ] Given an upcoming game whose release is known only as the second quarter of 2027, when the person views its library card, then they see "Q2 2027".
  - [ ] Given an upcoming game whose release is known only as March 2027, when the person views its library card, then they see "Mar 2027".
  - [ ] Given a game the catalogue marks as TBA, when the person views its library card, then they see "Date TBA".
  - [ ] Given a game with no date, when the person views its library card, then no release date text appears on it.
  - [ ] Given today is before 14 March and a game has an exact date on 14 March of the current year, when the person views its library card, then the label reads "14 Mar".
  - [ ] Given a game with an exact date on 14 March of a later year, when the person views its library card, then the label reads "14 Mar" followed by that year, for example "14 Mar 2027".
  - [ ] Given a person whose device is set to a timezone west of London, for example New York, and a game with an exact date of 14 March, when they view its library card, then the label reads "14 Mar" and not "13 Mar".

### 2.2 Library cards show the date for upcoming games

Library cards of upcoming games show a line "Out" followed by the date label, for example "Out 14 Mar", "Out Q2 2027", or just "Date TBA" for a TBA game. This applies to every upcoming game, whatever its status and ownership. Released games and games with no date show no release date line.

- The release date line, and the "Moved from …" line (2.7), must not break alignment between cards in the same row. In each row, every card's cover, title and length line start at the same height, whether or not the card has these extra lines.
- **Acceptance Criteria:**
  - [ ] Given today is before 14 March and a Want game has an exact date of 14 March of the current year, when the person opens the library, then its card shows "Out 14 Mar".
  - [ ] Given an owned Playing game with a date of the second quarter of next year, when the person opens the library, then its card shows "Out Q2" followed by that year.
  - [ ] Given a game that came out last year, when the person opens the library, then its card shows no release date line.
  - [ ] Given a grid row where one tile has a release date line and a "Moved from …" line and its neighbours have neither, when the person views the row, then the covers, titles and length lines of all tiles in that row start at the same heights.
  - [ ] Given a game with an exact date of yesterday, when the person opens the library today, then its card shows no release date line.

### 2.3 The game page says "Releases" for future dates

The game page shows a release line using the 2.1 labels, but always with the year:
- for an upcoming game, "Releases" followed by the label: "Releases 14 Mar 2027", "Releases Mar 2027", "Releases Q2 2027", "Releases 2027";
- for a TBA game, "Release date TBA";
- for a released game, "Released" followed by the label: "Released 2 Jun 2020", or "Released 2020" for a game known only by year;
- for a game with no date, no release line.

This applies to signed-in people and signed-out visitors alike.

- **Acceptance Criteria:**
  - [ ] Given a game with an exact release date in the future, when anyone opens its game page, then they see "Releases" followed by that date with its year, and never "Released".
  - [ ] Given an upcoming game known only as 2027, when anyone opens its game page, then they see "Releases 2027".
  - [ ] Given a TBA game, when anyone opens its game page, then they see "Release date TBA".
  - [ ] Given a game released on 2 June 2020, when anyone opens its game page, then they see "Released 2 Jun 2020".
  - [ ] Given a game known only as released in 2020, when anyone opens its game page, then they see "Released 2020".
  - [ ] Given a game with no date, when anyone opens its game page, then no release line appears.

### 2.4 Coming soon on Home

Home gets a new section titled **Coming soon**. It lists the person's upcoming games with an exact date from today through 30 days after today, both days included.

- **Place:** below "Also playing" (or below "Nothing playing right now") and above the counts line. It has no cover tint.
- **Order:** nearest date first. Games on the same date are ordered by title, A to Z.
- **Each entry** shows the game's cover, its title and when it comes out: **"Out today"** for today, **"Tomorrow"** for tomorrow, and otherwise the short weekday and the date, "Fri 14 Mar", with the year added when the date falls in the next calendar year ("Fri 2 Jan 2027"). There are no countdowns such as "in 3 days".
- **Size:** at most 3 entries. Below them, a link **"See all upcoming"** opens Upcoming releases (2.5). The link is shown whenever the section is shown. Games out today count toward the 3.
- Tapping an entry opens that game's page.
- When no upcoming game has an exact date in the window, the section is not shown, with no empty message.
- Games whose date is only a month, quarter or year, or TBA, never appear here, and no "Moved from …" line appears here.
- **Acceptance Criteria:**
  - [ ] Given a game in the library with an exact release date of today, when the person opens Home, then Coming soon shows it with "Out today", listed first.
  - [ ] Given a game with an exact release date of tomorrow, when the person opens Home, then Coming soon shows it with "Tomorrow".
  - [ ] Given a game with an exact release date 9 days from today, when the person opens Home, then Coming soon shows it with its short weekday and date, for example "Fri 14 Mar", and no "days left" wording.
  - [ ] Given a game with an exact release date exactly 30 days from today, when the person opens Home, then it appears in Coming soon.
  - [ ] Given a game with an exact release date 31 days from today and nothing nearer, when the person opens Home, then no Coming soon section is shown.
  - [ ] Given today is 28 December and a game has an exact date of 2 January, when the person opens Home, then its entry shows the weekday, "2 Jan" and the new year.
  - [ ] Given an upcoming game known only as "Mar 2027", when the person opens Home during March 2027, then it does not appear in Coming soon.
  - [ ] Given five games with exact dates in the next 30 days, two of them on the same day, when the person opens Home, then Coming soon shows the three nearest, with same-day games in title order, followed by the link "See all upcoming".
  - [ ] When the person taps "See all upcoming", then the Upcoming releases page opens.
  - [ ] When the person taps a Coming soon entry, then that game's page opens.
  - [ ] Given a game with an exact date of yesterday, when the person opens Home today, then it does not appear in Coming soon.
  - [ ] Given a Done game and a Not owned Want game, both with exact dates in the next 30 days, when the person opens Home, then both appear in Coming soon.
  - [ ] Given a phone at 390 × 844 with one game Playing, three games in Up Next and three Coming soon entries, when the person opens Home, then the first Up Next cover is fully visible without scrolling, and Coming soon appears below "Also playing".
  - [ ] Given Home with a Coming soon section, when the person looks at the page, then only the "Continue?" panel has a cover tint.

### 2.5 Upcoming releases page

A new page titled **Upcoming releases** lists every upcoming game in the person's library that has an exact date, from today onward, in date order. Games on the same date are ordered by title, A to Z.

- **Layout:** entries are grouped under month headings ("March 2027"). Each entry shows the short weekday and day ("Fri 14"), or **"Out today"** in its place for today. It also shows the game's cover and title, its status (Want, Playing or Done), and the "Not owned" tag when it applies.
- The list ends with the last game that has an exact date. There is no fixed time limit.
- Games whose date is only a month, quarter or year, or TBA, are not listed. Once the game catalogue announces an exact date for such a game, it appears in the list.
- Tapping an entry opens that game's page.
- **Ways in:** "See all upcoming" on Home, and a text link "Upcoming releases" at the top of the Library page, next to the page title. The Library link is always shown, so the page can be reached even when Coming soon is hidden.
- Only signed-in people can open it, and each person sees only their own library.
- When nothing qualifies, the page shows: "No upcoming releases with a set date. Games appear here once their release day is announced."
- **Acceptance Criteria:**
  - [ ] Given three games with exact dates in March, April and the following January, when the person opens Upcoming releases, then they see the games in date order under the headings for those months.
  - [ ] Given a game known only as "Q2 2027", when the person opens Upcoming releases, then it is not listed.
  - [ ] Given a game that was known only as "2027" and whose exact date of 14 March 2027 has been announced in the catalogue for more than a week, when the person opens the library and then Upcoming releases, then it is listed under March 2027.
  - [ ] Given two games with an exact date of today, when the person opens Upcoming releases, then both are at the top of the list in title order, each reading "Out today" instead of a weekday and day.
  - [ ] Given a game with an exact date of yesterday, when the person opens Upcoming releases today, then it is not listed.
  - [ ] Given a person with no upcoming games with an exact date, when they open Upcoming releases, then they see "No upcoming releases with a set date. Games appear here once their release day is announced."
  - [ ] Given a person with no upcoming games at all, when they open the Library page, then the "Upcoming releases" link is still shown next to the page title.
  - [ ] When the person taps "Upcoming releases" on the Library page, then the Upcoming releases page opens.
  - [ ] Given a signed-out visitor, when they try to open Upcoming releases, then they are sent to the sign-in page and see no games.
  - [ ] When the person taps an entry, then that game's page opens.
  - [ ] Given a phone at 390 × 844, when the person opens Upcoming releases, then the page does not scroll sideways and every entry can be tapped with a target at least 44 points tall.

### 2.6 Dates stay current

When the person opens Home or the Library page, SavePoint checks the game catalogue for newer release dates for the upcoming games and games with no date in their library.

- **How often:** a game is checked when one of these pages opens and its last check, by anyone, is older than one day for a game with an exact date within 14 days after today, or older than one week for any other game being checked. So, as long as the person opens Home or the library, a change in the catalogue shows up within about a day for games coming out soon and within about a week otherwise. Checks are shared: when one person's visit updates a game, everyone who has that game sees the new date.
- **Released games** are not checked again; their date stays as it was when they came out.
- **Where corrections show:** a corrected date shows everywhere the date appears: library cards, the game page, Coming soon and Upcoming releases. The game page itself does not start a check.
- **Speed:** Home and the Library page show their content without waiting for the game catalogue. A correction found during a visit shows the next time the person opens a page that shows the date; the page already open is not updated.
- **When the catalogue fails:** when the game catalogue is slow or unavailable, pages show the last known dates and no error message. The game is checked again on a later visit.
- **Acceptance Criteria:**
  - [ ] Given a game with an exact date within the next 14 days whose date in the catalogue moved more than a day ago, when the person opens the library and then opens it again, then its card, its game page and Upcoming releases show the new date.
  - [ ] Given a game known only as "2027" whose exact date was announced in the catalogue more than a week ago, when the person opens the library and then opens it again, then its card shows the exact date.
  - [ ] Given the game catalogue is unavailable, when the person opens Home, then Home shows its content with the last known dates and no error message.
  - [ ] Given a game released last month whose catalogue date later changes, when the person opens the library, then its card still shows no release date line and its game page still shows its original "Released" date.

### 2.7 A quiet "Moved" line when an exact date changes

When a game's exact release date changes, its library card and its Upcoming releases entry show a small line **"Moved from"** followed by the old date as a 2.1 label ("Moved from 14 Mar", or "Moved from 14 Mar 2027" when the old date was in another year). The line shows for 14 days after the change first appears in SavePoint, then disappears.

- The line appears only when the old date was exact. A month, quarter or year date that becomes exact is an announcement, not a move, so it shows no line.
- When an exact date changes to a vaguer one or to TBA (for example from "14 Mar" to "2027"), the library card shows "Moved from 14 Mar" under "Out 2027" or "Date TBA", and the game leaves Upcoming releases.
- When the new date is already in the past (the game came out early), the game counts as released and no line is shown.
- When the date moves again within the 14 days, the line shows the most recent old date, and the 14 days start again.
- The line is plain text with no warning color and no "Delayed" badge. It does not appear on Home or on the game page.
- **Acceptance Criteria:**
  - [ ] Given a game whose exact date changed from 14 March to 3 June of the current year, when the person opens the library, then its card shows "Out 3 Jun" and the line "Moved from 14 Mar".
  - [ ] Given a game whose card first showed "Moved from 14 Mar" 15 days ago, when the person opens the library, then the line is gone.
  - [ ] Given a game whose date changed from "2027" to the exact date 14 March 2027, when the person opens the library, then its card shows "Out 14 Mar 2027" and no "Moved" line.
  - [ ] Given a game whose exact date changed from 14 March to "2027", when the person opens the library, then its card shows "Out 2027" and "Moved from 14 Mar", and the game is not in Upcoming releases.
  - [ ] Given a game whose exact date changed from 14 March to 3 June, when the person opens Upcoming releases, then the entry under June shows "Moved from 14 Mar".
  - [ ] Given a game whose exact date changed from 14 March to 3 June, when the person opens Home or the game page, then no "Moved" line appears there.

### 2.8 "Continue?" doesn't offer to start a game that isn't out yet

When Home's "Continue?" panel would offer to start the first game in the person's Up Next queue, it skips upcoming games and offers the first game in the queue that is released or has no date. When every game in the queue is upcoming, the panel goes straight to its existing resting message ("Nothing tonight is fine too."), as it does after the person has said "Not tonight" to everything. The Up Next queue itself and its order do not change; upcoming games stay on the shelf.

- **Acceptance Criteria:**
  - [ ] Given nothing is Playing and Up Next holds an upcoming game first and a released game second, when the person opens Home, then the "Continue?" panel offers to start the released game.
  - [ ] Given nothing is Playing and every game in Up Next is upcoming, when the person opens Home, then the "Continue?" panel shows "Nothing tonight is fine too." and no offer to start a game.
  - [ ] Given nothing is Playing and Up Next holds a TBA game first, when the person opens Home, then the "Continue?" panel does not offer to start that game.
  - [ ] Given Up Next holds an upcoming game first, when the person opens Home, then the Up Next shelf still shows that game first.
  - [ ] Given the first game in Up Next had an exact date of yesterday, when the person opens Home today, then the "Continue?" panel can offer to start it.

---

## 3. Scope and Boundaries

### In-Scope

- Date labels at their real precision on library cards (grid and list) and the game page.
- The game page's "Releases" wording for future dates.
- Coming soon on Home.
- The Upcoming releases page and its two ways in.
- Keeping release dates current when the person opens Home or the library.
- The "Moved from …" line.
- "Continue?" skipping games that aren't out yet (2.8).

### Out-of-Scope

- Notifications outside the app: email, push or any other alert. The person sees release information only when they open SavePoint.
- Separate release dates per platform or region. The catalogue's first release anywhere is used.
- Discovering upcoming games that aren't in the person's library.
- Store links, prices or any other buying prompt.
- Countdowns or "N days left" wording anywhere.
- A line on Coming soon counting how many owned games are already waiting to be played. The owner rejected it as too pushy.
- Release dates in search results, the add-game dialog and quick search. They keep showing the year only.
- Stopping a person from marking a game that isn't out yet as Playing or Done. Only the "Continue?" offer changes (2.8).
- Industry events such as showcases and conferences.

---

## Change Log

- [YYYY-MM-DD] — [source reference] — [what behavior changed and why]
