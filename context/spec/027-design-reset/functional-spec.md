# Functional Specification: Design reset

- **Topic:** Reset the app's look to a clean, consistent foundation built on the stock component kit, then give the product its own visual identity — new accent, title font, cover treatment, Up Next card, status chip, name and logo.
- **Status:** Draft
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

The app is built from a popular open set of interface building blocks (buttons, text fields, dialogs, menus, cards). Over several redesigns these blocks were reshaped by hand and a second, private set of sizes, spacings, text styles and shadows grew on top of the kit's own. Leftovers of earlier, retired looks stayed behind. As a result:

- The same kind of element looks different from screen to screen: game covers have seven different corner and shadow treatments, the status chip has about eight designs, page titles come in seven styles, section labels in four.
- Some intended styling never shows up: page titles that should use the title font appear in the body font, hover feedback on buttons and cards never appears, buttons at the bottom of dialogs touch each other on desktop, text fields have unusually wide inner padding.
- Every new building block added later arrives looking "foreign" and needs manual adjustment.
- The overall look — dark surfaces, a teal-cyan accent, monospaced `// SECTION` labels in capitals, a geometric title font — is a style AI design tools commonly produce. A tracker with the same name ("SavePoint" by Two Average Gamers) looks almost identical and is built around what this product deliberately rejects: yearly recaps, counters, a community feed.

This change happens in two phases, after spec 026 (mindful core simplification) has shipped:

- **Phase 1 — Clean foundation.** Every screen is rebuilt on the stock kit in its soft, rounded, roomy style, keeping today's colors. Everything that is silently broken is fixed, the leftovers of retired looks are removed, and the terminal-style labels disappear.
- **Phase 2 — Own identity.** A new accent color, a new title font, three signature elements (one cover treatment, the Up Next card, one status chip), a new product name and a new logo. The look expresses the product's principles: calm, few things at once, covers first, warm surfaces.

**Success looks like:**
- A user moving between the dashboard, library, game page, journal, profile and settings sees one consistent visual language in Light and in Dark.
- Someone who knows the same-named competitor would not mistake this app for it.
- A building block added later from the stock kit looks at home without manual adjustment.

---

## 2. Functional Requirements (The "What")

### Phase 1 — Clean foundation

#### 2.1 One consistent set of building blocks

Buttons, text fields, text areas, dropdowns, menus, tabs, dialogs, bottom sheets, tooltips, toasts and cards look and behave the same on every screen, in the stock kit's soft, rounded, roomy style, using today's colors (warm cream Light, warm charcoal Dark, current teal accent).

- **Acceptance Criteria:**
  - [ ] When the user visits the dashboard, library, game page, journal, profile, settings and search, then every primary button has the same height, corner roundness and text style on all of them.
  - [ ] When the user opens any two dialogs in the app (for example "Add game" and "Remove from library"), then their corner roundness, inner spacing and button layout match.
  - [ ] When the user opens a dialog on a desktop-width screen that has two buttons at the bottom, then the buttons have a visible gap between them.
  - [ ] When the user clicks into any text field, then the typed text starts the same short distance from the left edge in every text field in the app, no wider than the gap between the text and the field's top edge.
  - [ ] When the user compares cards on the dashboard, game page and journal, then they share the same corner roundness and inner spacing.
  - [ ] When the user switches between Light and Dark on any screen, then only the surface and text tones change; the shapes, spacing and fonts stay the same.

#### 2.2 Intended styling actually shows

Everything the current design intends but that silently fails today works after phase 1.

- **Acceptance Criteria:**
  - [ ] When the user views any page title (dashboard, library, game page, journal, profile, settings, search), then it uses the title font, the same one on every page.
  - [ ] When the user hovers over a button, an interactive card or a menu item on desktop, then it shows visible hover feedback, and the feedback is the same kind for the same kind of element.
  - [ ] When the user receives a toast message in Dark mode, then the toast uses the dark surface, not a light one.

#### 2.3 Terminal-style labels removed

Section labels written as `// SECTION` in a monospaced capital style are replaced by plain labels in the regular font, in sentence case.

- **Acceptance Criteria:**
  - [ ] When the user browses every screen of the app, including the landing page, then no label starts with "//" and no section label is written in a monospaced font.
  - [ ] When the user views a section label (for example the journal's monthly summary), then it reads in sentence case, such as "This month", not "THIS MONTH".
  - [ ] When the user compares section labels across the dashboard, game page, journal and settings, then they all use the same size, weight and color.

#### 2.4 Leftovers of retired looks removed

Colors, pages and decorations that belong to retired themes or to the original project template are removed.

- **Acceptance Criteria:**
  - [ ] When the user browses every screen of the app, then no color outside the app's palette appears in the interface itself (pink, violet, orange, bright green or similar decorative gradients); game covers and screenshots are excluded.
  - [ ] When the user visits the address of the leftover "About" page from the original project template, then they see the app's standard "page not found" screen.
  - [ ] When the user views a profile page, then the person's name is shown in the same title font as other page titles, not in a serif font.

#### 2.5 Landing page on the shared foundation

The landing page uses the same building blocks and palette as the rest of the app and follows the user's theme choice.

- **Acceptance Criteria:**
  - [ ] When a signed-out visitor opens the landing page, then it uses the same buttons, fonts and palette as the signed-in app.
  - [ ] Given the visitor's device is set to light appearance, when they open the landing page, then it is shown in Light; given the device is set to dark appearance, when they open it, then it is shown in Dark.

#### 2.6 Readability and reach kept through the reset

The reset must not make anything harder to read or to tap.

- **Acceptance Criteria:**
  - [ ] When body text, labels and button text are checked in Light and in Dark, then each meets the standard accessibility contrast level for text (WCAG AA: 4.5:1, or 3:1 for large text).
  - [ ] When the user moves through a screen with the keyboard, then the focused element always shows a clearly visible outline in both modes, with at least 3:1 contrast against its surroundings.
  - [ ] When the user uses the app on a phone, then every button, menu trigger and navigation item in the bottom bar, top bar, library cards and Up Next queue is at least 44 × 44 points to tap.

#### 2.7 Before/after review

Phase 1 visibly changes the look (softer corners, more space), so it is accepted by a side-by-side visual review.

- **Acceptance Criteria:**
  - [ ] When phase 1 is ready for review, then the reviewer receives before and after images of the landing page, sign-in, dashboard, library, game page, journal, profile, settings and the "Add game" dialog, each in Light and in Dark, on a phone-width and a desktop-width screen.
  - [ ] When the reviewer compares a before/after pair, then no content, button or piece of information present before is missing after, apart from the removed items listed in 2.3 and 2.4.

### Phase 2 — Own identity

#### 2.8 New accent color

The teal accent is replaced by a new single brand color, chosen by the product owner from 2–3 visual options. It suits the warm cream and warm charcoal surfaces and is clearly outside the teal/cyan family.

- **Acceptance Criteria:**
  - [ ] When the product owner reviews the accent options, then each option is shown on the same set of screens (dashboard, library, game page) in Light and in Dark.
  - [ ] Given the new accent is applied, when the user looks at any screen, then the accent appears only on the main action, the selected or active item, and the Playing status — not spread across the page.
  - [ ] Given the new accent is applied, when the accent is used as a button background or as text, then it meets the contrast level in 2.6 in both modes.

#### 2.9 New title font

The title font is replaced, chosen by the product owner from 2–3 visual options; body text keeps one readable font.

- **Acceptance Criteria:**
  - [ ] When the product owner reviews the font options, then each option is shown on the same page titles and game names in Light and in Dark.
  - [ ] Given the new title font is applied, when the user views page titles and game names on the game page, then they use the new font; all other text uses the body font.

#### 2.10 Signature: one cover treatment

Game covers look the same everywhere and carry most of the color on screen; the interface around them stays calm.

- **Acceptance Criteria:**
  - [ ] When the user views covers on the dashboard, Up Next queue, library, search results, "Add game" dialog, profile and game page, then every cover has the same proportions, corner roundness and edge treatment.
  - [ ] When the user hovers over a cover that opens a game on desktop, then it shows the same hover feedback everywhere.
  - [ ] When a game has no cover art, then the user sees the same placeholder everywhere, with the game's name on it.

#### 2.11 Signature: the Up Next card

The Up Next queue on the home screen becomes the product's recognizable object — the first thing a user sees and associates with the app. [NEEDS CLARIFICATION: assumed form is a "shelf" of the queued games' covers in queue order with the first one emphasized; confirm, or describe the form you have in mind.]

- **Acceptance Criteria:**
  - [ ] When the user opens the home screen with games in Up Next, then the Up Next card is the most prominent element above the fold on both phone and desktop.
  - [ ] When the user opens the home screen with an empty Up Next, then the card keeps its recognizable shape and invites the user to add a game to the queue.
  - [ ] When the user compares the Up Next card with the same-named competitor's screens, then nothing in its layout or styling copies them. [NEEDS CLARIFICATION: who performs this comparison — assumed the product owner, during the phase 2 review.]

#### 2.12 Signature: one status chip

One status chip design is used everywhere a game's status appears, for Want, Playing and Done (including a game that was let go, worded as spec 026 defines).

- **Acceptance Criteria:**
  - [ ] When the user sees a game's status on a library card, the game page, the dashboard, search results and the phone's bottom bar, then the chip has the same shape, size, wording and capitalization in all of them.
  - [ ] When the user compares chips for Want, Playing and Done, then they differ by color and label only, and Playing uses the accent color.
  - [ ] When the user views a chip in Light and in Dark, then its text meets the contrast level in 2.6.

#### 2.13 New product name and logo

The product gets a new name and a new logo, replacing "SavePoint" and the Save Glow mark. [NEEDS CLARIFICATION: the new name itself is chosen by the product owner; this spec assumes the choice is made before phase 2 starts.]

- **Acceptance Criteria:**
  - [ ] When the user looks at the app header (sidebar and phone top bar), landing page, sign-in page, browser tab title and browser tab icon, then they see only the new name and the new logo.
  - [ ] When someone shares a link to the app, then the share preview shows the new name and new logo.
  - [ ] When the user receives an email from the app, then it uses the new name. [NEEDS CLARIFICATION: assumed emails are in scope; confirm, or exclude them.]
  - [ ] When the user views the logo in Light and in Dark, then it is clearly visible on both surfaces.
  - [ ] When the user installs the app to a phone home screen, then the icon and name shown are the new ones.

#### 2.14 Light, Dark and System stay

The theme options remain Light, Dark and System throughout both phases; a user's existing choice is kept.

- **Acceptance Criteria:**
  - [ ] When the user opens the theme menu after either phase, then they see exactly Light, Dark and System.
  - [ ] Given the user had chosen Dark before the change, when they open the app after either phase, then it opens in Dark.

---

## 3. Scope and Boundaries

### In-Scope

- Every screen's look in Light and Dark: landing, sign-in, dashboard, library, game page, journal, profile, settings, search, dialogs and bottom sheets.
- Phase 1: the stock kit's soft, rounded style with today's colors; fixing silently broken styling; removing terminal-style labels, retired-theme leftovers, off-palette colors and the template "About" page; landing page follows the theme.
- Phase 2: new accent, new title font, the three signature elements, new product name and logo, favicon, home-screen icon and share preview.
- Readability, keyboard focus and tap-size baselines in 2.6.

### Out-of-Scope

- What any screen does, what information it shows, and how the user moves between screens — owned by spec 026 (mindful core simplification), which ships first.
- New features, including "what to play next" suggestions by mood or length (think-aloud takeaway T6).
- A third theme or a user-selectable accent color.
- Changing the web address of the app. [NEEDS CLARIFICATION: assumed the address stays the same after the rename; confirm.]
- Starting phase 1 before spec 026 has shipped.

---

## Change Log

- [YYYY-MM-DD] — [source reference] — [what behavior changed and why]
