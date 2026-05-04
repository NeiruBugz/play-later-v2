# Functional Specification: UI Hardening — Mobile Safe-Areas, Card Interactions & Landing Page

- **Roadmap Item:** Audit-driven hardening pass (Phase 2 polish; not on the ordered backlog — slotted in after the 2026-05-03 in-browser audit on `localhost:6060` at 1440×900 desktop and 390×844 phone viewports)
- **Status:** Draft
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

A focused audit of SavePoint's signed-in surfaces uncovered two clusters of small but compounding usability problems that work against the "patient gamer" promise of an effortless, intentional library:

**Cluster A — Mobile chrome eats content.** On phone-sized screens the bottom navigation bar (Library / Journal / Profile) sits over the last ~78px of every page, and the sticky top header sits over the first ~70px when the user jumps to a section. The Library page reproduces this clearly: the bottom row of game cards and the bottom row of status filter pills are partially hidden behind the navigation bar, and tapping in that strip activates the wrong control. A user scrolling to the end of their library to find a recently-added game can see the cover art but cannot reach the action button under it.

**Cluster B — Library cards quietly hijack actions.** Each card on the Library page and the Dashboard "Up Next" carousel is rendered as one large clickable region that opens the game's detail page. The three-dot action menu, the star rating, and the primary in-card action button (Log Session / Start Playing / Replay / Add to Shelf) all sit inside that clickable region. Normal taps work, but: middle-clicking a card's primary button opens the game in a new tab instead of doing nothing; right-clicking shows the browser's link menu ("Open Link in New Tab", "Copy Link Address") referencing the game URL; on touch devices, dragging across the rating stars to set a rating can be interpreted as a "drag this link" gesture and shows the link drag preview instead of moving the rating. The three-dot button itself is also too small to comfortably tap on a phone, and the "Change Status" submenu doesn't show which status the game is currently in, forcing users to remember.

**Cluster C — Public landing page rough edges.** The signed-out marketing page (the URL a first-time visitor lands on) has a parallel set of small problems uncovered in the same audit pass:

- **Broken keyboard shortcut.** Every page in SavePoint has a hidden "Skip to main content" link that becomes visible to keyboard users when they press Tab. On the public landing page this link does nothing — pressing Enter on it does not move focus to the main content, so a keyboard-only visitor must tab through the entire navigation again to reach the page body.
- **Screen reader hears the brand name twice.** Both the top-of-page header and the footer render the SavePoint logo right next to the word "SavePoint". A screen reader announces the logo (as "SavePoint Logo") and then the wordmark, producing "SavePoint Logo, SavePoint" — confusing and noisy.
- **Slow first impression on phones and slow networks.** The landing page currently downloads a large set of decorative typefaces upfront, including ones that are only used by alternate visual themes a signed-in user can pick. A first-time visitor on a phone or a slow connection sees a blank or unstyled hero area for longer than necessary before the welcome headline appears.
- **Shared previews of the marketing page show the wrong information.** When the team or contributors share a link to a preview deployment of the site (e.g. for review), the rich link preview that appears in chat tools and social cards always points at the production URL and uses the production image. The destination of the share is correct, but the preview misleads readers into thinking they are looking at production.
- **Search engines receive an inaccurate map of the site.** The public list of "what to crawl / what to skip" that we publish for search engines lists routes that no longer exist (`/library`, `/profile`) and omits routes that do exist under the signed-in area. The visible-to-search-engines list of public pages also does not include the public profile pages a logged-in user can choose to share.

**Why fix this now.** All three clusters punish the exact behaviour SavePoint encourages — quick logging, frequent rating updates, fast browsing, and a confidence-inspiring first impression — and the fixes are mechanical rather than design-rich. Shipping them as a single hardening pass clears a class of bug reports without blocking ongoing feature work, and prepares the cards for the upcoming Game Detail Redesign and Per-Playthrough Logs work, which will introduce more in-card controls.

**Success measure.** Manual QA on a phone-sized viewport finds zero locations where bottom navigation or sticky header obscures content, zero card-action paths where pointer interactions (left-click, middle-click, right-click, touch drag) produce unexpected navigation, and the public landing page has no broken keyboard shortcuts, no duplicated screen-reader announcements of the brand name, and shows the welcome headline within the first 2.5 seconds on a representative slow phone connection.

---

## 2. Functional Requirements (The "What")

### 2.1. Mobile bottom-navigation clearance

- **As a** user on a phone, **I want to** see and reach the last items at the bottom of any list, **so that** I can tap the bottom row of cards, the last filter pill, or the last journal entry without fighting the navigation bar.
  - **Acceptance Criteria:**
    - [ ] Open the Library page on a phone-sized screen. Scroll to the very bottom. The last row of game cards is fully visible, with comfortable space between the bottom of the cards and the top of the bottom navigation bar.
    - [ ] On the Library page, every status filter pill ("Up Next", "Playing", "On the shelf", "Played", "Wishlisted", "Replay") is fully visible and tappable; tapping the lowest-positioned pill activates that filter and not a navigation bar tab.
    - [ ] Repeat the bottom-scroll check on the Journal, Profile, Settings, and Dashboard pages — none of them clip their last item behind the navigation bar.
    - [ ] On the game detail page on a phone, the last action available below the journal section is fully tappable above the navigation bar.

### 2.2. Mobile sticky-header clearance

- **As a** user on a phone, **I want to** land on the section I asked for when I tap an in-page jump link, **so that** I'm not greeted by content half-hidden behind the top header.
  - **Acceptance Criteria:**
    - [ ] On a game detail page, open the three-dot menu on any library card (from a referrer page) and select "View Journal Entries". The Journal heading lands fully visible below the sticky top header — not partially hidden behind it.
    - [ ] Scrolling to the very bottom of any long page on a phone leaves the last item fully visible (not partially hidden behind the top header) once scrolling settles.

### 2.3. Library card — pointer-event correctness

The Library card pattern is shared by the Library page (`/library`), the Dashboard "Up Next" carousel, and any other surface that lists games with the same wrapping-link pattern (e.g. profile library tab, search results). Every requirement below applies to every such surface.

- **As a** user, **I want** the action controls inside a card to behave like buttons, not like links, **so that** my mouse and touch gestures do what they look like they should.
  - **Acceptance Criteria — left-click (primary tap):**
    - [ ] Clicking anywhere on the cover art, title, status badge, or platform metadata of a card opens the game detail page.
    - [ ] Clicking the three-dot action button opens the action menu; the URL does not change.
    - [ ] Clicking a star in the rating control changes the rating value; the URL does not change; no game detail page is loaded.
    - [ ] Clicking the primary action button at the bottom of a card (Log Session / Start Playing / Replay / Add to Shelf) opens its corresponding dialog; the URL does not change.
  - **Acceptance Criteria — middle-click (mouse-wheel click):**
    - [ ] Middle-clicking the cover art / title / metadata of a card opens the game detail page in a new tab.
    - [ ] Middle-clicking the three-dot action button does not open any new tab and does nothing visible.
    - [ ] Middle-clicking a star in the rating control does not open any new tab and does not change the rating.
    - [ ] Middle-clicking the primary action button does not open any new tab.
  - **Acceptance Criteria — right-click (context menu):**
    - [ ] Right-clicking the cover art / title / metadata of a card shows the browser's standard link context menu referencing the game's URL.
    - [ ] Right-clicking the three-dot button, a rating star, or the primary action button does not show "Open Link in New Tab" or "Copy Link Address" referencing the game's URL.
  - **Acceptance Criteria — touch drag (rating stars):**
    - [ ] On a phone with touch, pressing on the leftmost rating star and dragging horizontally across the row updates the rating value smoothly as the finger moves; the browser does not show a "drag link" preview at any point.
    - [ ] On a phone, tapping a single star sets the rating to that value.
  - **Acceptance Criteria — keyboard:**
    - [ ] Tabbing through a card visits the card's link target, the three-dot button, the rating control, and the primary action button as separate stops.
    - [ ] Pressing Enter on the rating control while focused activates it for arrow-key adjustment; arrow keys change the value; Enter does not navigate to the game page.

### 2.4. Tap target — three-dot action button

- **As a** user on a phone, **I want** the three-dot action button on each card to be easy to tap with my thumb, **so that** I don't open the game by accident.
  - **Acceptance Criteria:**
    - [ ] On a phone-sized screen, the three-dot action button on every card has a tappable area at least 44 by 44 device-independent pixels.
    - [ ] The button has at least 8 device-independent pixels of clearance from the edge of the card.
    - [ ] The same minimum applies to other in-card buttons that share the same compact style (e.g. quick-add button on search result cards).

### 2.5. Landing page — keyboard "Skip to main content" works

- **As a** keyboard-only visitor on the public landing page, **I want** the "Skip to main content" shortcut to actually move me to the main content area, **so that** I don't have to tab through the entire top navigation every time I want to read the page.
  - **Acceptance Criteria:**
    - [ ] Open the public landing page (the URL a signed-out visitor lands on) in a fresh browser. Press Tab once. A "Skip to main content" link becomes visible at the top-left.
    - [ ] Press Enter while that link is focused. Focus moves to the start of the main content (the "For Patient Gamers" badge / welcome headline area), and the next Tab visits a control inside the main content — not the next item in the top navigation.
    - [ ] A screen reader announces the destination as the page's main content region when focus arrives there.

### 2.6. Landing page — screen reader does not say the brand name twice

- **As a** screen reader user visiting the public landing page, **I want** the brand name announced once per location, **so that** I don't hear "SavePoint Logo, SavePoint" in the header and again in the footer.
  - **Acceptance Criteria:**
    - [ ] In the top navigation, a screen reader announces the SavePoint brand once when traversing the logo+wordmark cluster, not twice.
    - [ ] In the footer, a screen reader announces the SavePoint brand once when traversing the logo+wordmark cluster, not twice.
    - [ ] The visual appearance of the logo and wordmark is unchanged for sighted users.

### 2.7. Landing page — fast first impression on phones

- **As a** first-time visitor on a phone or slow connection, **I want** to see the welcome headline quickly, **so that** I trust the site is real and choose to keep scrolling.
  - **Acceptance Criteria:**
    - [ ] On a representative slow phone connection (Lighthouse "Slow 4G" mobile profile or equivalent), the welcome headline ("Your Personal Gaming Library & Journal") is visible within 2.5 seconds of navigation start.
    - [ ] No alternate-theme decorative typefaces (the ones a signed-in user only sees after picking the "Cartridge" or "Aurora" themes) are downloaded as part of the initial landing-page load for a signed-out visitor.
    - [ ] The headline does not visibly re-flow or change typeface after it first appears.

### 2.8. Shared preview links show preview information

- **As a** team member sharing a preview deployment link in chat or a pull request, **I want** the rich link preview to reflect the preview deployment, **so that** reviewers know they are reviewing pre-production work.
  - **Acceptance Criteria:**
    - [ ] Paste a preview-deployment URL of the landing page into a chat tool that renders rich link previews (e.g. Slack, Discord, GitHub PR description). The preview's headline, description, and image are present.
    - [ ] Clicking the rich preview opens the preview deployment URL — not the production URL.
    - [ ] The same paste-test on the production URL still shows the production headline, description, and image and links to production.
    - [ ] Preview deployments use the same headline, description, and image as production; only the link target differs between the production and preview rich previews.

### 2.9. Search engines see an accurate site map

- **As a** product owner, **I want** the public list of pages we publish for search engines to be accurate, **so that** indexable pages get indexed and private pages stay private.
  - **Acceptance Criteria:**
    - [ ] The "do not crawl" list published for search engines covers every signed-in section of the app (Dashboard, Journal, Profile / Settings, Library, Collections, and any other route only reachable after sign-in) and contains no entries for routes that no longer exist.
    - [ ] The published list of public pages includes the landing page, the public game search page, and the sign-in page. Public user profile pages under `/u/<username>` are intentionally excluded from this hardening pass; their indexing policy is deferred to a separate spec.
    - [ ] When the search engine list is fetched on a preview deployment, the URLs inside it point to that preview deployment, not to production.

### 2.10. "Change Status" submenu — current selection visible

- **As a** user managing a game's status from the action menu, **I want** the submenu to show me which status this game is currently in, **so that** I don't have to remember and don't accidentally re-select the same status.
  - **Acceptance Criteria:**
    - [ ] Open the three-dot menu on any card and select "Change Status". The status that the game is currently in is visually distinguished from the other options (e.g., a checkmark, a filled marker, or equivalent).
    - [ ] A screen reader announces the currently selected status as "selected" or "checked" when navigating the submenu options.
    - [ ] If the user re-selects the currently active status, the menu closes without showing an error and without producing a no-op confirmation toast.

---

## 3. Scope and Boundaries

### In-Scope

- Bottom-navigation clearance fix on all phone-sized signed-in pages (Dashboard, Library, Journal, Profile, Settings, game detail).
- Sticky-header clearance fix for in-page jumps and end-of-page scroll on phone-sized pages.
- Restructuring the Library card pattern so that action controls (three-dot menu, rating, primary action button) are no longer governed by the card's wrapping link, applied wherever this pattern occurs (Library page, Dashboard "Up Next" carousel, profile library tab, search results, and any other surface using the same card).
- Increasing the three-dot button tap area to at least 44×44 on phone viewports, with comfortable edge clearance.
- Adding a visible-and-announced current-status indicator in the "Change Status" submenu.
- Touch-drag-to-rate behaviour on the rating control.
- Repairing the "Skip to main content" keyboard shortcut on the public landing page so it lands on the main content region.
- De-duplicating the screen-reader announcement of the SavePoint brand in the landing page header and footer.
- Reducing the typeface payload of the landing page so first-time visitors on slow phones see the welcome headline within 2.5 seconds, and removing alternate-theme decorative typefaces from the initial signed-out load.
- Making rich link previews of preview deployments reflect the preview destination instead of always pointing at production.
- Correcting the public list of pages exposed to search engines so it accurately reflects what should and should not be indexed.

### Out-of-Scope

- Any visual redesign of the cards beyond what is required to reach the tap-target minimum and to separate the link-clickable area from the action controls.
- Changes to non-card surfaces for tap-target sizing (e.g. inline links in body copy).
- Game Detail Redesign, Per-Playthrough Logs, Reviews, Bento Dashboard Reflow, and every other ordered-backlog item in Phase 2 — these are separate roadmap items.
- Steam / PSN / Xbox import surfaces (Phase 3).
- Dark/light theme variants, font sizing, and accessibility scope beyond what is specified above.
- Visual redesign of the landing page hero, sections, or footer beyond what is required to satisfy the keyboard, screen-reader, and speed acceptance criteria.
- Adding a Web App Manifest, installable PWA behaviour, or offline support.
- Indexing or sitemap inclusion of public user profile pages (the `/u/<username>` surface) — to be decided in a separate spec; this hardening pass only ensures the published list is internally consistent and does not point at routes that do not exist.
