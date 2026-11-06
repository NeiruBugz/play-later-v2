# Functional Specification: Design reset

- **Topic:** Reset the app's look to a clean, consistent foundation built on the stock component kit, then give the product its own visual identity — new accent, title font, cover treatment, Up Next card, status chip, name and logo.
- **Status:** Draft
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

The app is built from shadcn/ui, a popular open set of interface building blocks (buttons, text fields, dialogs, menus, cards) that projects copy in and then style. Over several redesigns these blocks were reshaped by hand and a second, private set of sizes, spacings, text styles and shadows grew on top of the kit's own. Leftovers of earlier, retired looks stayed behind. As a result:

- The same kind of element looks different from screen to screen: game covers have seven different corner and shadow treatments, the status chip has about eight designs, page titles come in seven styles, section labels in four.
- Some intended styling never shows up: page titles that should use the title font appear in the body font, hover feedback on buttons and cards never appears, buttons at the bottom of dialogs touch each other on desktop, text fields have unusually wide inner padding, toasts stay light in Dark mode.
- Every new building block added later arrives looking "foreign" and needs manual adjustment.
- The overall look — dark surfaces, a teal-cyan accent, monospaced `// SECTION` labels in capitals, a geometric title font — is a style AI design tools commonly produce. A tracker with the same name ("SavePoint" by Two Average Gamers) looks almost identical and is built around what this product deliberately rejects: yearly recaps, counters, a community feed.

This change happens in two phases, after spec 026 (mindful core simplification) has shipped. Spec 026 reduces a game's status to three — **Want**, **Playing**, **Done** (a game that was dropped is **Done** with the outcome "Let go") — and adds **Up Next**, an ordered queue of games the user plans to play next, shown on the home screen. The screens listed in 2.0 are the ones that exist after spec 026.

Both phases are **phone first**: every screen is designed and approved at phone width first, then scaled up to desktop. The phone is where the app is used most — between sessions, on the couch, right after playing — so a comfortable phone experience comes before desktop polish. Spec 025 already gave the app its phone layout (bottom navigation, bottom sheets, two covers per row in the library) and spec 026 fixes what is broken on phones; this specification makes the phone look and feel comfortable in the hand.

- **Phase 1 — Clean foundation.** Every screen is rebuilt on the stock kit in its soft, rounded, roomy style (the kit's ready-made style named "Maia"), keeping today's colors and today's fonts. Everything that is silently broken is fixed, the leftovers of retired looks are removed, the terminal-style labels disappear, and the phone baseline in 2.6 is met. Phase 1 is released to users on its own.
- **Phase 2 — Own identity.** A new accent color, a new title font, three signature elements (one cover treatment, the Up Next card, one status chip), a new product name and a new logo. The look expresses the product's principles: calm, few things at once, covers first, warm surfaces.

**Success looks like:**
- A user holding a phone in one hand can read every screen, reach the main action with their thumb, and type into any field without the keyboard hiding it.
- A user moving between the home screen, library, game page, journal, profile and settings sees one consistent visual language in Light and in Dark.
- Someone who knows the same-named competitor would not mistake this app for it.
- A building block added later from the stock kit looks at home without manual adjustment.

---

## 2. Functional Requirements (The "What")

### 2.0 Definitions used in this specification

- **Screens covered** ("every screen"): landing page; sign-in; profile setup; home screen (also called the dashboard); library; game page; journal list, a single journal entry, and the compose/edit entry page; own and public profile, including followers and following lists; settings; search (the quick search opened with ⌘K / Ctrl+K and the search results page); the dialogs and bottom sheets "Add game", "Log session", "Remove from library" and the library filters sheet; and each screen's empty, loading, error and "page not found" states.
- **Phone width:** a window 390 × 844 points — the size every screen is designed and reviewed at. **Phone widths:** phone width plus a small phone, 360 × 780 points, and a large phone, 430 × 932 points. **Desktop width:** a window 1440 × 900 points. **Above the fold:** visible at that size without scrolling.
- **Bottom sheet:** a panel that slides up from the bottom edge of a phone screen and covers part of it, used on phones instead of a dialog in the middle of the screen.
- **Thumb zone:** the bottom third of a phone screen, the part a thumb reaches when the phone is held in one hand.
- **Today's palette:** Light — warm cream surfaces, dark warm text, teal accent; Dark — warm charcoal surfaces, soft off-white text, a lighter teal accent; in both, one color per status (Want, Playing, Done), red for destructive actions and errors, green, amber and blue for success, warning and information messages, and greys derived from the surface color.
- **Today's fonts:** Space Grotesk for titles, Geist for body text, Geist Mono for numbers where alignment matters.
- **Primary button:** the filled button in the accent color that performs a screen's or dialog's main action. A screen or dialog has at most one.
- **Interactive card:** a card that opens something when clicked or tapped — library game cards, Up Next items, home-screen game tiles, journal entries in the list.
- **Section label:** a short label that names a group of content inside a page (for example "This month" in the journal). It is not a page title, a card title or the label of a form field.
- **Retired looks:** themes removed earlier — Paper, Boxart, Terminal Green, Cartridge, Aurora, Jewel and Y2K — and the original project template the app was started from.

### Phase 1 — Clean foundation

#### 2.1 One consistent set of building blocks

Buttons, text fields, text areas, dropdowns, menus, tabs, dialogs, bottom sheets, tooltips, toasts and cards look and behave the same on every screen, in the stock kit's "Maia" style, using today's palette and today's fonts.

- **Acceptance Criteria:**
  - [ ] When the user visits every screen listed in 2.0, then every primary button of the same size (small, regular or large) has the same height, corner roundness and text style.
  - [ ] When the user opens any two dialogs in the app (for example "Add game" and "Remove from library"), then their corner roundness, inner spacing and button layout match.
  - [ ] When the user opens a dialog at desktop width that has two buttons at the bottom, then the buttons have a visible gap between them.
  - [ ] When the user clicks into any text field, then the typed text starts the same short distance from the left edge in every text field in the app, no wider than the gap between the text and the field's top edge.
  - [ ] When the user compares cards on the home screen, game page and journal, then they share the same corner roundness and inner spacing.
  - [ ] When the user switches between Light and Dark on any screen, then shapes, spacing, sizes and fonts stay the same and only colors change.

#### 2.2 Intended styling actually shows

The following styling, intended today but silently failing, works after phase 1. The list is complete for this specification.

- **Acceptance Criteria:**
  - [ ] When the user views any page title on the screens listed in 2.0, then it uses today's title font (Space Grotesk), the same on every page, including the person's name on a profile (today shown in a serif font).
  - [ ] When the user hovers over a button, an interactive card or a menu item at desktop width, then it visibly changes (a background or shadow change), and every element of the same kind changes the same way.
  - [ ] When the user receives a toast message in Dark mode, then the toast uses the dark surface, not a light one.
  - [ ] When the user opens a dialog with two bottom buttons at desktop width, or clicks into a text field, then the gap and padding described in 2.1 apply.

#### 2.3 Terminal-style labels removed

Section labels written as `// SECTION` in a monospaced capital style are replaced by plain labels in the body font, in sentence case.

- **Acceptance Criteria:**
  - [ ] When the user browses every screen listed in 2.0, then no label starts with "//" and no section label is written in a monospaced font.
  - [ ] When the user views a section label (for example the journal's monthly summary), then it reads in sentence case, such as "This month", not "THIS MONTH".
  - [ ] When the user compares section labels across the home screen, game page, journal and settings, then they all use the same size, weight and color.

#### 2.4 Leftovers of retired looks removed

Colors, pages and decorations that belong to the retired looks are removed: the decorative pink, violet, orange and green gradients and glowing blobs on the landing page, the serif font on the profile name, and the template "About" page.

- **Acceptance Criteria:**
  - [ ] When the user browses every screen listed in 2.0, then every color in the interface comes from today's palette (2.0); game covers, screenshots and user avatars are excluded.
  - [ ] When the user opens the address `/about`, then they see the app's standard "page not found" screen.

#### 2.5 Landing page on the shared foundation

The landing page uses the same building blocks and palette as the rest of the app and follows the visitor's theme choice instead of always being dark.

- **Acceptance Criteria:**
  - [ ] When a signed-out visitor opens the landing page, then it uses the same buttons, fonts and palette as the signed-in app.
  - [ ] Given the visitor has not chosen a theme and their device is set to light appearance, when they open the landing page, then it is shown in Light; given the device is set to dark appearance, when they open it, then it is shown in Dark.
  - [ ] Given the visitor previously chose Light or Dark in the app on this browser, when they open the landing page, then it is shown in that choice regardless of the device setting.

#### 2.6 Phone first

The app is comfortable to use on a phone held in one hand. This covers how screens look and where controls sit on a phone; which screens exist, what they show and how the user moves between them stay as spec 026 leaves them.

- **Acceptance Criteria:**
  - [ ] Given each of the phone widths (360, 390 and 430 points), when the user visits every screen listed in 2.0, then the page never scrolls sideways and no text, button or cover is cut off or overlaps another, apart from long names that end with "…" by design.
  - [ ] When the user taps anything that can be tapped on any screen at phone width, then its tappable area is at least 44 × 44 points.
  - [ ] When the user reads any screen at phone width, then no text is smaller than 12 points, and body text is at least 15 points.
  - [ ] When the user opens "Add game", "Log session", "Remove from library", the library filters or the status picker at phone width, then it opens as a bottom sheet, not as a dialog in the middle of the screen, and can be closed with a visible close button or by tapping outside it.
  - [ ] When the user opens a bottom sheet or a form (sign-in, profile setup, the compose/edit entry page, settings) at phone width, then its primary button is in the thumb zone, and stays there while the user scrolls the form.
  - [ ] Given the on-screen keyboard is open at phone width, when the user taps any text field, then the field and its form's primary button stay visible above the keyboard, and the page does not zoom in.
  - [ ] Given a phone with a screen notch and a home indicator (for example an iPhone 15), when the user opens any screen in the browser or from a home-screen icon, then no text, button or navigation item sits under the notch, the status bar or the home indicator.
  - [ ] When the user looks for any action or information that appears on hover at desktop width (for example a tooltip, a card's menu or a cover's details), then it can be reached by tapping at phone width.

#### 2.7 Readability kept through the reset

The reset must not make anything harder to read.

- **Acceptance Criteria:**
  - [ ] When any text is checked in Light and in Dark — body text, labels, button text, placeholder text, secondary (muted) text, toast text and text shown over covers — then it meets the standard accessibility contrast level for text (WCAG AA: 4.5:1, or 3:1 for large text); text on disabled controls is exempt.
  - [ ] When the user moves through a screen with the keyboard, then the focused element always shows a clearly visible outline in both modes, with at least 3:1 contrast against its surroundings.

#### 2.8 Phase acceptance review

Each phase visibly changes the look, so each is accepted by the product owner through a side-by-side visual review before release. The phone is reviewed first; desktop follows once the phone is approved.

- **Acceptance Criteria:**
  - [ ] When a phase is ready for review, then the product owner receives before and after images of the landing page, sign-in, home screen, library, game page, journal list, profile, settings and the "Add game" bottom sheet, each in Light and in Dark, at phone width; the "before" images are taken after spec 026 has shipped (phase 1) or after phase 1 has shipped (phase 2).
  - [ ] When the product owner has approved every phone pair, then they receive the same set of before and after images at desktop width; desktop images are not shown before the phone pairs are approved.
  - [ ] When the product owner compares a before/after pair, then no content, button or piece of information present before is missing after, apart from the items removed in 2.3 and 2.4.
  - [ ] When the product owner has reviewed every pair, then the phase is released only if they approve it; any rejected pair is reworked and shown again.

### Phase 2 — Own identity

Every phase 2 element — accent, title font, cover treatment, Up Next card, status chip, name and logo — is designed and chosen at phone width first, then scaled up to desktop.

#### 2.9 New accent color

The teal accent is replaced by a new single brand color, chosen by the product owner from 2–3 visual options. It suits the warm cream and warm charcoal surfaces and lies outside the teal/cyan family (hues between green-blue and blue, roughly 170°–220° on the color wheel). If the product owner rejects every option, a new set of options is prepared.

- **Acceptance Criteria:**
  - [ ] When the product owner reviews the accent options, then each option is shown on the same set of screens (home screen, library, game page) in Light and in Dark, at phone width first and at desktop width once a phone favourite is picked.
  - [ ] Given the new accent is applied, when the user looks at any screen, then the accent appears only on the primary button, the selected or active item, the Playing status, the keyboard focus outline and text links.
  - [ ] Given the new accent is applied, when the accent is used as a button background or as text, then it meets the contrast level in 2.7 in both modes.

#### 2.10 New title font

The title font is replaced, chosen by the product owner from 2–3 visual options. The body font (Geist) stays unchanged.

- **Acceptance Criteria:**
  - [ ] When the product owner reviews the font options, then each option is shown on the same page titles and game names in Light and in Dark, at phone width first and at desktop width once a phone favourite is picked.
  - [ ] Given the new title font is applied, when the user views page titles (including the person's name on a profile), dialog titles, the game's name at the top of the game page, the landing page headline and the product name in the header, then they use the new font; all other text, including game names on cards and lists, uses the body font.

#### 2.11 Signature: one cover treatment

Game covers look the same everywhere; covers bring the color to the screen and the interface around them stays calm.

- **Acceptance Criteria:**
  - [ ] When the user views covers on the home screen, Up Next queue, library, search results, "Add game" bottom sheet or dialog, profile and game page, then every cover has the same proportions (2:3, portrait), the same corner roundness, the same shadow and the same border (or lack of one).
  - [ ] When the user hovers over a cover that opens a game at desktop width, then it shows the same hover feedback everywhere.
  - [ ] When a game has no cover art, then the user sees the same placeholder everywhere, showing the game's name on up to three lines, with a longer name cut off with "…".

#### 2.12 Signature: the Up Next card

The Up Next queue on the home screen becomes the product's recognizable object — the first thing a user sees and associates with the app. It is a "shelf": the covers of the queued games in a row, in queue order, with the first one — the game to play next — larger and emphasized.

- **Acceptance Criteria:**
  - [ ] When the user opens the home screen with games in Up Next, then the Up Next card is the first element in reading order above the fold and the largest one, at both phone width and desktop width.
  - [ ] When the user looks at the Up Next card with three or more games queued, then the covers appear in queue order, left to right, and the first cover is visibly larger than the others.
  - [ ] Given phone width and more games queued than fit across the screen, when the user looks at the Up Next card, then the first cover and part of the next one are visible, and the rest are reached by scrolling the shelf sideways, without the page itself scrolling sideways.
  - [ ] When the user opens the home screen with an empty Up Next, then the card keeps the same outline and position and shows a button that opens the quick search to find a game to add.
  - [ ] When the product owner compares the Up Next card with the same-named competitor's home, library, profile and game pages during the phase 2 review (2.8), then they find nothing in its layout or styling that copies them.

#### 2.13 Signature: one status chip

One status chip design is used everywhere a game's status appears. It has four labels and three colors: Want, Playing, Done, and "Let go" for a game that was dropped, shown in the Done color — dropping a game is as normal an ending as finishing it.

- **Acceptance Criteria:**
  - [ ] When the user sees a game's status on a library card, the game page, the home screen, search results and a profile's library, then the chip has the same shape, size, wording and capitalization in all of them.
  - [ ] When the user compares the chips for Want, Playing and Done, then they differ by color and label only, and Playing uses the accent color.
  - [ ] When the user sees a game that was marked Done with the outcome "Let go", then its chip reads "Let go" in the same color as a Done chip.
  - [ ] When the user views a chip in Light and in Dark, then its text meets the contrast level in 2.7.

#### 2.14 New product name and logo

The product gets a new name, a new logo and a new web address, replacing "SavePoint", the Save Glow mark and the current address. The product owner chooses the name inside phase 2, in the same design round as the accent and title font; the logo is designed last, for the chosen name.

- **Acceptance Criteria:**
  - [ ] When the user looks at the app header (sidebar and phone top bar), landing page, sign-in page, browser tab title and browser tab icon, then they see only the new name and the new logo.
  - [ ] When the user reads any text in the app, including page text, page titles in the browser and legal text, then the old name "SavePoint" does not appear.
  - [ ] When someone pastes a link to the landing page or to a game page into a messaging app that shows link previews (for example Telegram or Slack), then the preview shows the new name and the new logo.
  - [ ] When the user views the logo in Light and in Dark, then it is clearly visible on both surfaces.
  - [ ] When the user adds the app to a phone home screen from the browser's "Add to Home Screen" option, then the icon and name shown are the new ones.
  - [ ] When anyone opens an old link to any page on the current address, then they land on the same page at the new address.
  - [ ] Given the user was signed in on the current address, when they first open the new address, then they sign in at most once more and their library and settings are unchanged.

#### 2.15 Light, Dark and System stay

The theme options remain Light, Dark and System throughout both phases; a user's existing choice is kept on the same address. The choice is remembered per browser and per address, so on the first visit to the new address (2.14) it starts at System once.

- **Acceptance Criteria:**
  - [ ] When the user opens the theme menu (in the sidebar, the phone top bar or settings) after either phase, then they see exactly Light, Dark and System.
  - [ ] Given the user had chosen Light, Dark or System before the change, when they open the app on the same address after either phase, then it opens in that same choice.
  - [ ] Given the user opens the new address for the first time, when the app loads, then it follows the device setting (System), and any choice they make there is kept from then on.

---

## 3. Scope and Boundaries

### In-Scope

- The look of every screen listed in 2.0, in Light and Dark.
- Phase 1: the stock kit's "Maia" style with today's palette and fonts; fixing the silently broken styling in 2.2; removing terminal-style labels, retired-look leftovers, off-palette colors and the template "About" page; landing page follows the theme. Released on its own.
- Phase 2: new accent, new title font, the three signature elements, new product name, logo and web address (with old links redirected), browser tab icon, home-screen icon and link preview.
- Phone first (2.6): both phases designed and approved at phone width before desktop; phone widths 360, 390 and 430 points; bottom sheets instead of dialogs, primary buttons in the thumb zone, fields visible above the keyboard, nothing under the notch or home indicator, no hover-only actions, minimum text and tap sizes.
- Readability and keyboard focus baselines in 2.7; an owner review per phase, phone first (2.8).

### Out-of-Scope

- What any screen does, what information it shows, and how the user moves between screens, including the phone navigation bar — owned by spec 026, which ships first.
- Phone gestures (swiping a card to change status, swiping a sheet down to close it, long-press menus).
- An app-like installed mode beyond the home-screen icon and name in 2.14 (no address bar, splash screen, offline use).
- A separate tablet layout: widths between phone and desktop scale between the two.
- New features, including suggestions of what to play next by mood or length.
- A third theme or a user-selectable accent color.
- Emails: the app sends none today.
- Unifying covers and status chips in phase 1 beyond what the stock kit changes on its own; their unification is phase 2 (2.11, 2.13).
- Starting phase 1 before spec 026 has shipped.

---

## Change Log

- 2026-11-04 — product owner, /awos:spec session — Added phone first: new 2.6 (phone widths 360/390/430, bottom sheets, thumb zone, keyboard, safe areas, no hover-only actions, text and tap sizes), phone-first review order in 2.8, phone-first option reviews in 2.9–2.10, Up Next shelf on a phone in 2.12; gestures, installed-app mode and tablet layout out of scope. Sections from 2.6 on renumbered. Reason: the phone is the main place the app is used, so the reset designs for it first and scales up.
- 2026-11-05 — product owner, /awos:tech session — 2.14: one re-sign-in on the new address confirmed (clarification marker removed). 2.15: the theme choice is kept on the same address and starts at System once on the new address (browser storage is per address; no hand-off built). Platform badges become neutral, so 2.4's "every color from today's palette" applies to them without an exception.
- 2026-11-06 — product owner, /awos:implement session (Slice 16) — Phase 2 choices: accent Plum, hue 340 (`oklch(0.48 0.13 340)` Light, `oklch(0.72 0.11 340)` Dark; AA in both modes) for 2.9; title font Zilla Slab (500/700, `display=swap`; Geist stays for body) for 2.10; product name "Continue?" for 2.14, written with the question mark in the logo, header, tab title and landing, and without it in running text and in the web address (chosen later). Reason: "Continue?" follows PlayLater → SavePoint (save, then continue) and no game tracker uses it; the bare word "Continue" is a known AI code assistant in another category.
