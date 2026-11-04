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

- **Phase 1 — Clean foundation.** Every screen is rebuilt on the stock kit in its soft, rounded, roomy style (the kit's ready-made style named "Maia"), keeping today's colors and today's fonts. Everything that is silently broken is fixed, the leftovers of retired looks are removed, and the terminal-style labels disappear. Phase 1 is released to users on its own.
- **Phase 2 — Own identity.** A new accent color, a new title font, three signature elements (one cover treatment, the Up Next card, one status chip), a new product name and a new logo. The look expresses the product's principles: calm, few things at once, covers first, warm surfaces.

**Success looks like:**
- A user moving between the home screen, library, game page, journal, profile and settings sees one consistent visual language in Light and in Dark.
- Someone who knows the same-named competitor would not mistake this app for it.
- A building block added later from the stock kit looks at home without manual adjustment.

---

## 2. Functional Requirements (The "What")

### 2.0 Definitions used in this specification

- **Screens covered** ("every screen"): landing page; sign-in; profile setup; home screen (also called the dashboard); library; game page; journal list, a single journal entry, and the compose/edit entry page; own and public profile, including followers and following lists; settings; search (the quick search opened with ⌘K / Ctrl+K and the search results page); the dialogs and bottom sheets "Add game", "Log session", "Remove from library" and the library filters sheet; and each screen's empty, loading, error and "page not found" states.
- **Phone width:** a window 390 × 844 points. **Desktop width:** a window 1440 × 900 points. **Above the fold:** visible at that size without scrolling.
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

#### 2.6 Readability and reach kept through the reset

The reset must not make anything harder to read or to tap.

- **Acceptance Criteria:**
  - [ ] When any text is checked in Light and in Dark — body text, labels, button text, placeholder text, secondary (muted) text, toast text and text shown over covers — then it meets the standard accessibility contrast level for text (WCAG AA: 4.5:1, or 3:1 for large text); text on disabled controls is exempt.
  - [ ] When the user moves through a screen with the keyboard, then the focused element always shows a clearly visible outline in both modes, with at least 3:1 contrast against its surroundings.
  - [ ] When the user uses the app at phone width, then every button, menu trigger and navigation item in the bottom bar, top bar, library cards and Up Next queue can be tapped within an area of at least 44 × 44 points.

#### 2.7 Phase acceptance review

Each phase visibly changes the look, so each is accepted by the product owner through a side-by-side visual review before release.

- **Acceptance Criteria:**
  - [ ] When a phase is ready for review, then the product owner receives before and after images of the landing page, sign-in, home screen, library, game page, journal list, profile, settings and the "Add game" dialog, each in Light and in Dark, at phone width and desktop width; the "before" images are taken after spec 026 has shipped (phase 1) or after phase 1 has shipped (phase 2).
  - [ ] When the product owner compares a before/after pair, then no content, button or piece of information present before is missing after, apart from the items removed in 2.3 and 2.4.
  - [ ] When the product owner has reviewed every pair, then the phase is released only if they approve it; any rejected pair is reworked and shown again.

### Phase 2 — Own identity

#### 2.8 New accent color

The teal accent is replaced by a new single brand color, chosen by the product owner from 2–3 visual options. It suits the warm cream and warm charcoal surfaces and lies outside the teal/cyan family (hues between green-blue and blue, roughly 170°–220° on the color wheel). If the product owner rejects every option, a new set of options is prepared.

- **Acceptance Criteria:**
  - [ ] When the product owner reviews the accent options, then each option is shown on the same set of screens (home screen, library, game page) in Light and in Dark.
  - [ ] Given the new accent is applied, when the user looks at any screen, then the accent appears only on the primary button, the selected or active item, the Playing status, the keyboard focus outline and text links.
  - [ ] Given the new accent is applied, when the accent is used as a button background or as text, then it meets the contrast level in 2.6 in both modes.

#### 2.9 New title font

The title font is replaced, chosen by the product owner from 2–3 visual options. [NEEDS CLARIFICATION: assumed the body font (Geist) stays unchanged in phase 2; confirm, or include it in the font review.]

- **Acceptance Criteria:**
  - [ ] When the product owner reviews the font options, then each option is shown on the same page titles and game names in Light and in Dark.
  - [ ] Given the new title font is applied, when the user views page titles (including the person's name on a profile), dialog titles, the game's name at the top of the game page, the landing page headline and the product name in the header, then they use the new font; all other text, including game names on cards and lists, uses the body font.

#### 2.10 Signature: one cover treatment

Game covers look the same everywhere; covers bring the color to the screen and the interface around them stays calm.

- **Acceptance Criteria:**
  - [ ] When the user views covers on the home screen, Up Next queue, library, search results, "Add game" dialog, profile and game page, then every cover has the same proportions (2:3, portrait), the same corner roundness, the same shadow and the same border (or lack of one).
  - [ ] When the user hovers over a cover that opens a game at desktop width, then it shows the same hover feedback everywhere.
  - [ ] When a game has no cover art, then the user sees the same placeholder everywhere, showing the game's name on up to three lines, with a longer name cut off with "…".

#### 2.11 Signature: the Up Next card

The Up Next queue on the home screen becomes the product's recognizable object — the first thing a user sees and associates with the app. [NEEDS CLARIFICATION: assumed form is a "shelf" of the queued games' covers in queue order with the first one larger and emphasized; confirm, or describe the form you have in mind.]

- **Acceptance Criteria:**
  - [ ] When the user opens the home screen with games in Up Next, then the Up Next card is the first element in reading order above the fold and the largest one, at both phone width and desktop width.
  - [ ] When the user opens the home screen with an empty Up Next, then the card keeps the same outline and position and shows a button that opens the quick search to find a game to add.
  - [ ] When the product owner compares the Up Next card with the same-named competitor's home, library, profile and game pages during the phase 2 review (2.7), then they find nothing in its layout or styling that copies them.

#### 2.12 Signature: one status chip

One status chip design is used everywhere a game's status appears. [NEEDS CLARIFICATION: assumed four labels with three colors — Want, Playing, Done, and "Let go" in the Done color; confirm, or give "Let go" its own color or show it as plain "Done".]

- **Acceptance Criteria:**
  - [ ] When the user sees a game's status on a library card, the game page, the home screen, search results and a profile's library, then the chip has the same shape, size, wording and capitalization in all of them.
  - [ ] When the user compares the chips for Want, Playing and Done, then they differ by color and label only, and Playing uses the accent color.
  - [ ] When the user views a chip in Light and in Dark, then its text meets the contrast level in 2.6.

#### 2.13 New product name and logo

The product gets a new name and a new logo, replacing "SavePoint" and the Save Glow mark. [NEEDS CLARIFICATION: the new name itself is chosen by the product owner; assumed it is chosen before phase 2 starts.]

- **Acceptance Criteria:**
  - [ ] When the user looks at the app header (sidebar and phone top bar), landing page, sign-in page, browser tab title and browser tab icon, then they see only the new name and the new logo.
  - [ ] When the user reads any text in the app, including page text, page titles in the browser and legal text, then the old name "SavePoint" does not appear.
  - [ ] When someone pastes a link to the landing page or to a game page into a messaging app that shows link previews (for example Telegram or Slack), then the preview shows the new name and the new logo.
  - [ ] When the user views the logo in Light and in Dark, then it is clearly visible on both surfaces.
  - [ ] When the user adds the app to a phone home screen from the browser's "Add to Home Screen" option, then the icon and name shown are the new ones.

#### 2.14 Light, Dark and System stay

The theme options remain Light, Dark and System throughout both phases; a user's existing choice is kept.

- **Acceptance Criteria:**
  - [ ] When the user opens the theme menu (in the sidebar, the phone top bar or settings) after either phase, then they see exactly Light, Dark and System.
  - [ ] Given the user had chosen Light, Dark or System before the change, when they open the app after either phase, then it opens in that same choice.

---

## 3. Scope and Boundaries

### In-Scope

- The look of every screen listed in 2.0, in Light and Dark.
- Phase 1: the stock kit's "Maia" style with today's palette and fonts; fixing the silently broken styling in 2.2; removing terminal-style labels, retired-look leftovers, off-palette colors and the template "About" page; landing page follows the theme. Released on its own.
- Phase 2: new accent, new title font, the three signature elements, new product name and logo, browser tab icon, home-screen icon and link preview.
- Readability, keyboard focus and tap-size baselines in 2.6; an owner review per phase (2.7).

### Out-of-Scope

- What any screen does, what information it shows, and how the user moves between screens — owned by spec 026, which ships first.
- New features, including suggestions of what to play next by mood or length.
- A third theme or a user-selectable accent color.
- Emails: the app sends none today.
- Unifying covers and status chips in phase 1 beyond what the stock kit changes on its own; their unification is phase 2 (2.10, 2.12).
- Changing the web address of the app. [NEEDS CLARIFICATION: assumed the address stays the same after the rename; confirm.]
- Starting phase 1 before spec 026 has shipped.

---

## Change Log

- [YYYY-MM-DD] — [source reference] — [what behavior changed and why]
