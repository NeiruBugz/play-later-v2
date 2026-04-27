# SavePoint — Audit V2 Handoff (for Claude Code)

> **About this bundle.** The files here are **design references** — HTML prototypes that show the intended look and behavior of pinned decisions from the *SavePoint UI/UX Audit, vol. II*. Your job is to **recreate these designs in the existing SavePoint codebase**, using its current stack (Next.js / React / Tailwind / shadcn-ui) and conventions. Don't copy the HTML wholesale — adapt to the app's component primitives.

> **Fidelity:** Mid-to-high. Layout, hierarchy, and interaction patterns are final. Exact pixel sizes, colors, and copy in the mockups are illustrative — match the existing SavePoint design tokens (Tailwind theme, shadcn variables) rather than the literal `oklch()` values used in the prototypes.

---

## Pinned decisions to implement (12)

| # | Area | Decision |
|---|------|----------|
| 1 | Desktop nav | **Left rail** — replace top-bar nav with a persistent vertical rail (logo, Library / Journal / Timeline / Dashboard, avatar at bottom). |
| 1b | Global search | **Command center (⌘K)** — Raycast-style palette as the single search/quick-action surface. Replaces the dashboard "Add Game" button and the separate search route. |
| 2 | Mobile nav | **4 tabs** — Library / Journal / Timeline / Profile. Search promoted to a top-bar icon. |
| 3 | Game detail | **Unified hero lockup** — cover + title + status + rating in one block. Mobile: shrunken banner gradient with cover overlapping it. No sticky sidebar. |
| 4 | Library status | **Segmented status control** with horizontal scroll on narrow viewports (supports 6+ statuses). Inline rating stars. No two-step modal. |
| 5 | Journal entry detail | **Editorial header** — entry title is the focus, game/mood/duration as a metadata line, destructive actions tucked into a `⋯` menu. |
| 6 | Journal list | **Group by game** — collapsible per-game sections with entry list nested inside. Heatmap parked for future Stats view. |
| 7 | Profile header | **Banner + overlap** — short colored banner, avatar overlaps it, name + handle + inline stats. Logout removed (lives in Settings). Email never on public profile. |
| 8 | Profile sub-tabs | **Segmented control** — distinct from page-level underline tabs. |
| 9 | Auth page | **Minimal editorial** — quiet layout, type carries the brand. No marketing tagline. |
| 10 | Settings | **Left rail** within the page — sections: Profile, Privacy, Connected accounts, Notifications, Danger zone. |
| 11 | Mood/tag chips | **Mood as eyebrow** above the entry title; tags as outlined chips below body. |
| 12 | Typography | **6-stop type scale** — display / h1 / h2 / h3 / body / caption. Document role for each, refactor existing pages onto it. |

---

## Implementation notes per decision

### 1 + 1b — Desktop left rail + ⌘K command center
- The rail replaces the current top-bar nav. Width ~56px collapsed, optional 220px expanded variant.
- Items: logo at top, then Library / Journal / Timeline / Dashboard, avatar at bottom for user menu.
- Each item is icon + tooltip (collapsed) or icon + label (expanded). Active state uses primary tint background.
- ⌘K palette: opens over everything, focuses input, supports
  - **Search games** (calls existing IGDB search) — primary use
  - **Navigate** to top-level routes
  - **Quick actions** — "Add game", "Log session", "New journal entry"
- Suggested lib: `cmdk` (already a shadcn primitive). Bind global hotkey `⌘K` / `Ctrl+K`. Move the dashboard "Add Game" button to be a thin shortcut into the palette.

### 2 — Mobile bottom nav (4 tabs)
- Tabs: Library, Journal, Timeline, Profile.
- Top bar gains: page title (left), search icon button (right) that opens the same ⌘K palette in a mobile-appropriate sheet.

### 3 — Game detail hero
- Replace banner-gradient + sticky sidebar layout with a single hero block:
  - Banner gradient short (≈110–130px tall, decorative only).
  - Cover (size ≈120×160) overlaps the banner bottom edge, sitting against the left margin.
  - To the right of the cover: small caption row (year · developer), then `<h1>` title, then a row of [status pill] [rating stars] [playtime].
- Tabs row below the hero: Overview / Journal (count) / Playtime / Related.
- **Mobile variant:** banner ≈110px, cover overlaps from below at margin, title + status stack vertically, two primary buttons in a 1:1 grid (Log session / Write entry).

### 4 — Segmented status control
- Use shadcn `ToggleGroup` (single) with statuses laid out horizontally.
- On viewports narrower than the row, set the container to `overflow-x: auto`, hide scrollbar, snap-x. All statuses remain visible by scroll.
- Active state: filled with `bg-primary text-primary-foreground`.
- Below the row: rating stars (interactive), then a row with "Log session" primary button.

### 5 — Journal entry editorial header
- Layout:
  - Top row: small cover (50×66) + 2-line metadata block (game · time-ago, then title) + `⋯` menu on the right.
  - Below: mood eyebrow (small dot + UPPERCASE label), then entry body in a comfortable reading width.
  - Footer separator + small meta row: duration, tags as outlined chips.
- `⋯` menu items: Edit, Delete (with confirm dialog).

### 6 — Journal list grouped by game
- For each game in the user's journaled set, render:
  - Collapsible header row: cover thumbnail + game title + meta ("4 entries · 12h logged") + "Log" button.
  - Indent the entries beneath under a vertical divider line.
- Empty per-game group hides itself; user can switch the grouping via a chip set at top: "All / By game / This month".

### 7 — Profile header with banner
- Banner: 64–96px tall colored gradient (allow user upload later).
- Avatar (56px) overlaps the banner, anchored bottom-left of the banner with negative margin.
- Right side of avatar: name (h1), handle (caption).
- Below: stats row — `142 followers · 87 following · 326 games`.
- Right edge: Edit button (only for owner) or Follow button (for others).
- **Remove Logout from this header.** Move to Settings.
- **Remove email from public profile.** Settings only.

### 8 — Profile sub-tabs as segmented
- Use shadcn `Tabs` with the `secondary` variant or a `ToggleGroup` with single selection.
- This visually distinguishes from the page-level underline tabs (which remain for top-level routes if any).

### 9 — Auth (minimal editorial)
- Centered single-column.
- Logo (40×40) → headline `Welcome back.` (h1, tight letter-spacing) → subline `Sign in to your library.` → primary `Continue with Google` (filled, foreground/background reversed) → divider "or" → email/password collapsed link.
- No marketing copy. No promo art.

### 10 — Settings shell
- Page layout: left rail (≈110–140px wide on desktop) listing sections; main panel renders the active section.
- Sections: Profile · Privacy · Connected accounts · Notifications · Danger zone (red label).
- On mobile: sections become a navigable list, tap to drill in.
- Each section renders its own form with shadcn `Card` blocks.

### 11 — Mood/tag chips
- Mood: rendered as an eyebrow above the entry title — a small colored dot + UPPERCASE label in primary color (e.g., `text-primary text-xs font-semibold tracking-wider`).
- Tags: outlined chips below body content. Strip the `#` prefix; use shape (the chip border) to signal interactivity.
- Tags are filter-clickable — tapping a tag filters the journal list to entries with that tag.

### 12 — Type scale
Define in Tailwind config (or as CSS variables) and document role:

| Role | Size | Weight | Tracking | Use |
|---|---|---|---|---|
| display | 32px / 2rem | 700 | -0.025em | Hero/auth headlines, game title in detail hero |
| h1 | 22px | 700 | -0.015em | Page title (one per page) |
| h2 | 16px | 600 | -0.01em | Section header |
| h3 | 13px | 600 | normal | Card title, list item title |
| body | 12px | 400 | normal | Paragraph, descriptions |
| caption | 10px | 500 | normal | Metadata, timestamps |
| eyebrow | 9px | 600 | 0.06em uppercase | Mood label, section eyebrow |

Refactor existing pages onto this. The current 22 / 18 / 16 mix on Library / Profile / Settings collapses to one `h1` size everywhere.

---

## Files in this bundle
- `UI-UX-Audit-V2.html` — full audit doc with all findings + variation canvases.
- `audit-v2/` — JSX prototypes for each finding's variations (look for components flagged "📌 Picked" in the audit).
- `design-canvas.jsx` — canvas wrapper used by the audit.

Open `UI-UX-Audit-V2.html` in a browser to browse the pinned decisions visually. The "Pinned decisions" section at the top jumps to each finding.

---

## Out of scope for this handoff
- Color palette / brand refresh (audit didn't recommend changes).
- Empty states (already strong; no findings).
- Any backend / API work — all decisions are client-side UI.
- The heatmap calendar (parked, not pinned).

## Acceptance criteria (high-level)
- Desktop renders with a persistent left rail; the old top-bar nav is gone.
- ⌘K opens a global palette; "Add Game" anywhere routes through it.
- Mobile bottom nav has exactly 4 items; search lives in the top bar.
- Game detail page has no "Library Status" titled card; status is a segmented control inline.
- Journal entry detail has no "Game" / "Entry" section headings; destructive action requires confirmation.
- Settings page has 5 sections in a left rail; logout lives here.
- Profile public page does not render the user's email.
- One `h1` size used consistently across Library / Profile / Settings / Journal pages.
