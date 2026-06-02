# Functional Specification: Unified Design System (Light + Dark)

- **Roadmap Item:** Design System v2 — consolidate the app's visual identity into one cohesive system expressed as two modes (Light + Dark)
- **Status:** Completed
- **Author:** Nail Badiullin

---

## 1. Overview and Rationale (The "Why")

Today the app offers several visual themes (Light, Dark, Cartridge, Aurora, plus System) that were each designed as a separate "world." They diverge on core traits — different primary colors, a serif heading font in one mode and a sans in another, different corner roundness, and different shadow treatments — so the product can feel like several different apps rather than one.

This change unifies everything into **one identity expressed as two surfaces**: a warm cream **Light** mode ("cozy curation desk") and a warm charcoal **Dark** mode ("dim reading room"). The two are true light/dark inversions of the *same* system — same brand color, same fonts, same corner style, same shadows — so the only thing that changes between them is the surface tone. A new logo (the "Save Glow" mark) replaces the old memory-card logo and ties into the refreshed look.

**Desired outcome:** the app looks and feels like a single, cohesive, cozy product on every screen, in both light and dark, reinforcing the "a library, not a backlog" identity.

**Success looks like:** a user moving between the dashboard, library, game detail, and journal sees one consistent visual language; switching between Light and Dark feels like the same room with the lights changed, not a different app.

---

## 2. Functional Requirements (The "What")

### 2.1 Consistent visual restyle across the whole app

Every screen (landing, dashboard, library, game detail, journal, settings, profile) adopts the unified look: warm cream surfaces in Light, warm charcoal surfaces in Dark, with a single sage-green brand color used sparingly for the main call-to-action, the current/active state, and the "Playing" status.

- **Acceptance Criteria:**
  - [x] Given I am signed in, when I visit the dashboard, library, game detail, and journal, then all four use the same color family, fonts, corner style, and shadows.
  - [x] Given I am in Light mode, when I look at any screen, then surfaces are a warm cream and text is a dark warm ink.
  - [x] Given I am in Dark mode, when I look at any screen, then surfaces are a warm charcoal and text is a soft off-white.
  - [x] Given any screen, when I look for the brand green, then it appears only on the primary button, the active/selected item, and the "Playing" status — not spread across the page.

### 2.2 Theme options reduced to Light / Dark / System

The theme menu in the sidebar offers exactly three choices: **Light**, **Dark**, and **System** (follow the device's setting). The Cartridge and Aurora themes are removed, along with the two hidden themes that were never reachable.

- **Acceptance Criteria:**
  - [x] Given I open the theme menu in the sidebar, when I read the options, then I see only Light, Dark, and System.
  - [x] Given I pick Light, when the page updates, then the app shows the warm cream mode.
  - [x] Given I pick Dark, when the page updates, then the app shows the warm charcoal mode.
  - [x] Given I pick System, when my device is set to dark, then the app shows Dark; when my device is set to light, then the app shows Light.

### 2.3 Migration for users on a removed theme

A user who had previously selected Cartridge or Aurora is moved to **System** the next time they open the app, so the app follows their device's light/dark setting.

- **Acceptance Criteria:**
  - [x] Given I previously had Cartridge or Aurora selected, when I next open the app, then the app follows my device's light/dark setting and the theme menu shows System as selected.
  - [x] Given the migration has happened, when I open the theme menu, then no removed theme (Cartridge/Aurora) appears as my selection.

### 2.4 Refreshed typography

Headings and titles render in a geometric sans-serif typeface (replacing the previous serif heading font). Body and interface text remain a clean sans-serif; small uppercase metadata labels (e.g. `TEAM CHERRY · 2017`, status badges) keep their wide-spaced uppercase treatment.

- **Acceptance Criteria:**
  - [x] Given any screen with a heading or page title, when I read it, then it appears in a geometric sans typeface (not a serif).
  - [x] Given a status badge or metadata label, when I read it, then it is uppercase with wide letter-spacing.

### 2.5 New "Save Glow" logo

The new Save Glow mark replaces the old memory-card logo everywhere it appears — the sidebar, the marketing landing page, and the browser tab icon. The mark is sage-green to match the brand color.

- **Acceptance Criteria:**
  - [x] Given I am in the app, when I look at the sidebar, then I see the new Save Glow mark (not the old memory-card icon).
  - [x] Given I visit the landing page, when I look at the header, then the logo is the new Save Glow mark.
  - [x] Given the app is open in a browser tab, when I look at the tab, then the tab icon is the new mark.

### 2.6 Consistent journey-status colors

The five journey statuses keep one consistent, meaningful color each in both Light and Dark (only their lightness shifts between modes): **Wishlist** blue, **Shelf** neutral, **Up Next** amber, **Playing** green (the brand accent), **Played** green.

- **Acceptance Criteria:**
  - [x] Given a game with a status, when I view its status badge in Light and again in Dark, then the color reads as the same color in both modes.
  - [x] Given the library, when I scan status badges, then each status is visually distinguishable by its color.

### 2.7 Consistent corners and rounded cover art

Buttons, cards, and inputs use crisp, lightly-rounded corners; fully-round (pill) shapes are reserved for circular elements only (avatars, status dots, progress bars). Game cover images have gently rounded corners consistently wherever they appear (library grid, dashboard, game detail).

- **Acceptance Criteria:**
  - [x] Given any button or card, when I look at its corners, then they are slightly rounded (crisp), not fully pill-shaped.
  - [x] Given an avatar, status dot, or progress bar, when I look at it, then it is fully round.
  - [x] Given a game cover anywhere it appears, when I look at its corners, then they are gently rounded, and the rounding looks the same on every screen.

### 2.8 Platform colors stay brand-constant

Platform indicators keep their real brand colors in both modes: PlayStation blue, Xbox green, Nintendo red, PC dark.

- **Acceptance Criteria:**
  - [x] Given a game tagged with a platform, when I view its platform indicator in Light and Dark, then it uses that platform's brand color in both.

---

## 3. Scope and Boundaries

### In-Scope

- A consistent visual restyle of all existing screens into the unified Light + Dark system.
- Reducing the theme menu to Light / Dark / System and removing the Cartridge, Aurora, and the two hidden themes.
- Moving users who were on a removed theme to System.
- The refreshed heading typeface and consistent uppercase-metadata treatment.
- Replacing the logo with the new Save Glow mark in the sidebar, landing page, and browser tab icon.
- Consistent journey-status colors and brand-constant platform colors across both modes.
- Crisp corners on controls/cards and consistent gently-rounded game covers.

### Out-of-Scope

- **A user-facing accent picker.** Sage is baked in as the single brand color; users cannot switch the accent. (The other accents — indigo, clay, plum — exist in the design but are not exposed.)
- **A dedicated "Appearance" settings page.** The theme control stays in the sidebar where it is today.
- **Any change to what features do or how they behave** — this is a look-and-feel change only. No new screens, data, or capabilities.
- **The social-share preview image** (the picture shown when an app link is shared) — it still shows the old logo and should be regenerated as a separate follow-up.
- **All other roadmap items** (Per-Playthrough Logs, Reviews, Public Reflections, Game Detail Redesign, Aggregate Game Stats, Bento Dashboard Reflow, and every other Phase 2–5 item) — addressed in their own specifications.
