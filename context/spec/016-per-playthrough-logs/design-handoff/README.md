# Handoff: Per-Playthrough Logs

## Overview
This feature turns a library entry's single "Your Record" (one playtime / one
rating / one session count) into **multiple playthroughs**. Each playthrough is a
distinct run of the game with its own platform, start/end dates, status, rating,
completion note, and free-text notes. Journal entries attach to a specific
playthrough. The game-detail page gains a **playthrough timeline**, and the
library entry's **status is derived from its playthroughs**.

It is the data primitive that unblocks **Reviews** (a review attaches to a
playthrough) and **Aggregate Game Stats** (totals roll up across playthroughs).

## About the design files
The files in `prototype/` are a **design reference built in HTML/React (Babel,
no build step)** — they show the intended look, layout, and behavior. They are
**not** production code to copy verbatim. The task is to **recreate them inside
the existing `savepoint-tanstack` app** using its established stack and
conventions:

- **TanStack Start v1** + React, file-based routes
- **FSD architecture** — `shared/ui` → `entities` → `features` → `widgets` → `routes`
- **Prisma** (data), **Better Auth**, server functions (`*.server.ts` / `*-fn`)
- **shadcn/ui** ("new-york"), **Tailwind v4**, **Lucide** icons
- All design tokens already live in `src/styles.css` — **use the token classes,
  never hardcode hex** (the prototype's inline hex are a standalone-file
  limitation).

Open `prototype/Per-Playthrough Logs.html` in a browser to interact with the
reference (drawers, timeline layouts, status wiring, empty state).

## Fidelity
**High-fidelity.** Final layout, spacing, typography, color semantics, and
interactions. Recreate pixel-faithfully using the codebase's existing primitives
(`Card`, `Button`, `Badge`, `RatingInput`, `Sheet`, `Popover`, `PlatformBadges`).
The prototype reuses the real UI-kit primitives and the real token system, so the
mapping is close to 1:1.

## What changes on the game-detail page
The bento grid on `widgets/game-detail` keeps **Screenshots, Times to beat,
About, Themes/Genres/Platforms, Related** exactly as today. Two changes:

1. **`YourRecordPanel` is replaced by `PlaythroughsPanel`** (left column, top).
   It shows an **aggregate band** (Playtime · Playthroughs · Best rating ·
   Completion) over the **playthrough timeline**.
2. **The header `LibraryStatusSwitcher` becomes run-derived** (see
   [Status derivation](#status-derivation-locked-rule)). When the entry has
   playthroughs it renders as a read-only status pill + "Follows your
   playthroughs"; the manual status menu only appears pre-play (no runs yet).

The page also gains a **full-width Journal feed** at the bottom — a chronological
mirror of the entries that are nested under each run in the timeline.

> Detailed component breakdown with props → **`COMPONENTS.md`**
> Prisma schema, server functions, migration notes → **`DATA_MODEL.md`**

## Screens / views

### 1. Game detail — populated
- **Layout:** unchanged page scaffold. Hero (200px cover + title + eyebrow +
  status), then `ScreenshotsPanel` full width, then the 2-col bento
  `grid-template-columns: 1.5fr 1fr` (the live app uses `1.35fr 1fr`; keep the
  live value). Left column: `PlaythroughsPanel`, `AboutPanel`. Right column:
  `TimesToBeatPanel`, `ThemesTagsPanel`, `RelatedPanel`. **Below the grid,
  full-width:** `JournalFeed`.
- **PlaythroughsPanel** (`Card variant="flat"`, `p-xl`, `gap-md`):
  - Header row: `// PLAYTHROUGHS` mono label + count badge · right-aligned
    **New playthrough** button (`Button size="sm"`, `Plus` icon).
  - **Aggregate band** (flex wrap, `gap: 16px 40px`, bottom border): four
    `AggStat` blocks — overline label over value:
    - `Playtime` → `{totalHours}h` (Space Grotesk, 1.5rem, 700)
    - `Playthroughs` → count (Space Grotesk, 1.5rem, 700)
    - `Best rating` → `RatingInput` read-only (5 stars, half precision)
    - `Completion` → status-played-tinted badge with `Trophy` icon (only if any
      run has a completion string; prefer "Platinum" if present)
  - **Timeline** — spine layout (the committed default). See COMPONENTS.md.

### 2. Playthrough timeline — spine (committed layout)
Vertical list, **newest run first**. Each run = one `<li>` on a 2-col grid
`[30px 1fr]`:
- **Marker column:** the **Save-Glow diamond** (`RunMarker`) centered, with a
  2px vertical connector line behind it running to the next node. Diamond stroke
  + inner fill colored by run status (`--status-playing` / `--status-played` /
  `--status-shelf`). It is the brand logo mark reused as a "save point."
- **Content column** (`gap: 14`):
  - **RunHeader:** left = run label (overline, see framing below); right =
    `RatingStars` (read-only, 14px) + `RunStatusBadge`.
  - **RunMeta** (flex wrap, muted, `body-sm`): `PlatformPill` · `CalendarDays`
    start → end (or "in progress") · `Clock` `{hours}h` · `Trophy` completion.
  - **Notes** (`body-md`, `--foreground-body`, max-width ~600).
  - **NestedJournal** (left-border indented): `// JOURNAL · N` + inline **Log
    session** button, then each entry: small accent dot · `OVERLINE DATE · {h}H`
    · italic body.
  - **Edit** ghost button.
- **Add node** at the end: dashed circle + dashed "Start a new playthrough" row →
  opens the add drawer.

> The prototype also contains **cards** and **compact** timeline layouts (toggled
> via Tweaks). The team chose **spine**; the others can be ignored for
> implementation, but the code shows alternates if ever wanted.

### 3. Run framing (copy)
The run label has three modes; **"journey" is the chosen default**:
- `journey` → first run = "First playthrough", later runs = "Replay"
- `numbered` → "Playthrough 1", "Playthrough 2"
- `neutral` → "Run 01", "Run 02" (mono)
Implement `journey`; the others are optional.

### 4. Add / edit playthrough — right drawer (`Sheet side="right"`, ~460px)
Header: `// NEW PLAYTHROUGH` / `// EDIT PLAYTHROUGH` mono eyebrow + title.
Body fields (top to bottom):
- Preview chip: `RunMarker` + computed label + game title.
- **Type** (add only): segmented `First playthrough | Replay` (auto-defaults to
  Replay if a first playthrough already exists).
- **Platform:** segmented `PS5 | PS4 | PC | Xbox | Switch`.
- **Status:** segmented `Playing | Finished | Abandoned` (with icons).
- **Started / Finished:** two `<input type="date">`. Finished is disabled +
  "Still playing" hint when status = Playing.
- **Playtime** (number, hours) + **Completion** (text, "e.g. Platinum, 100%,
  Story").
- **Rating:** `RatingInput` (interactive half-star).
- **Notes:** textarea.
Footer: `Cancel` (ghost) · `Add playthrough` / `Save changes`.

### 5. Log session — right drawer (`Sheet side="right"`)
Header: `// LOG SESSION` / "Log a session". Body:
- **Attach to playthrough:** a radio list of the entry's runs (marker + label +
  platform/date), preselected to the run whose "Log session" was clicked.
- **Date** (`type=date`, defaults today) + **Playtime** (number, step 0.5).
- **Thoughts:** textarea, with "Optional — playtime alone is a perfectly good
  entry." This is the existing journal composer **extended with a
  `playthroughId`**.
Footer: `Cancel` · `Add entry`.

### 6. Empty state (no playthroughs)
`PlaythroughsPanel` renders a dashed card: faded Save-Glow mark, "No playthroughs
yet", encouraging copy ("Every run you start shows up here — dates, platform, and
how it went. Reflections can come later."), and a **Log your first playthrough**
button. In this state the header status pill is **interactive** (manual
Wishlist/Shelf/Up Next) and the bottom Journal feed is hidden.

## Status derivation (locked rule)
Library status is a **pure function of the entry's playthroughs**:

```
deriveStatus(playthroughs, manualPrePlayStatus):
  if playthroughs is empty        → manualPrePlayStatus   // WISHLIST | SHELF | UP_NEXT
  if any run.status == PLAYING     → PLAYING
  if any run.status == FINISHED    → PLAYED
  else (only ABANDONED runs)       → PLAYED               // experienced it

hasBeenPlayed = any run.status in (FINISHED, ABANDONED)
```
- When runs exist, the status is **not** manually editable — the header pill is a
  read-only badge with a "Follows your playthroughs" caption. The manual status
  menu (`LibraryStatusSwitcher` dropdown) is only shown when there are **no**
  runs.
- `hasBeenPlayed` drives the **Up Next → "Replay"** label in the status menu
  (matches the brand's existing `getUpNextLabel(hasBeenPlayed)`).
- Adding a Playing run flips the header to **Playing**; marking the last active
  run Finished rolls it up to **Played**. No background job needed — derive on
  read (or persist `status` on every playthrough write; see DATA_MODEL.md).

> **Open product decisions to confirm with design before building:**
> 1. Abandoned-only entries currently roll up to **Played** — confirm vs. leaving
>    on Shelf.
> 2. Whether a manual override should ever "stick" over the derived value
>    (current decision: **no**, always run-derived once runs exist).

## Interactions & behavior
- **Drawers:** slide in from the right (`transform: translateX(28px) → 0`,
  `--duration-slow` / `--ease-out-expo`), dark scrim, Esc + scrim-click close.
  Use the codebase `Sheet`.
- **RatingInput:** hover previews; click left/right half of a star sets 1–10
  (stored 1–10, shown as 0–5 with half precision). Reuse `shared/ui/rating-input`.
- **Add playthrough** → append run, recompute status, close. **Log session** →
  prepend entry to the chosen run, add its hours to that run's playtime, close.
- **Compact layout** (if ever used) expands one run at a time.
- Respect `prefers-reduced-motion` (entrance animations only; gate them).

## Design tokens (all already in `src/styles.css`)
Use token classes / CSS vars — do not hardcode. Key ones this feature leans on:
- **Run status colors:** `--status-playing` (= accent), `--status-played`
  (green), `--status-shelf` (neutral, used for Abandoned). Tinted backgrounds via
  `color-mix(in oklch, var(--status-*) 15%, transparent)`.
- **Type:** Space Grotesk display (`.text-h1`, `.heading-sm`, `.heading-xs`),
  Geist body (`.body-md/.body-sm/.body-xs`), Geist Mono terminal labels
  (`.terminal-label`, `.overline`).
- **Radii:** crisp 3px (`--radius-card`, `--radius-btn`); `--radius-cover` for
  art; pills (`9999px`) only for circles/dots/markers.
- **Shadows:** `--shadow-1..4` (aliased `--shadow-paper*`). Drawer = `--shadow-4`.
- **Platform brand colors:** PlayStation `#0070d1`, Xbox `#107c10`, Nintendo
  `#e60012`, PC `#1b2838` (these are intentionally brand-constant, not tokens).
- **Save-Glow marker:** `assets/logo-mark.svg` (currentColor) — already in the
  design system; tint per run status.

## Assets
- **Save-Glow logo mark** — already in repo (`assets/logo-mark.svg`); reused as
  the timeline node, tinted by run status.
- **Lucide icons used:** `Plus, Pencil, Check, X, ChevronDown, CalendarDays,
  Clock, Trophy, Gamepad2, CheckCircle, Archive, Star, Bookmark, BookMarked,
  GitBranch, Image`.
- **Screenshots** in the prototype are gradient placeholders — the real page
  already loads IGDB screenshots; leave that panel as-is.

## Files in this bundle
- `prototype/Per-Playthrough Logs.html` — entry point; open in a browser.
- `prototype/playthroughs.jsx` — data model, `RunMarker`, `RunStatusBadge`,
  `RatingInput`, `NestedJournal`, the three `Timeline` layouts, `PlaythroughsEmpty`,
  status helpers (`deriveStatus`, `hasBeenPlayed`, `upNextLabel`).
- `prototype/drawers.jsx` — `Drawer` shell, `AddEditPlaythroughForm`,
  `LogSessionForm`, form primitives (`Field`, `Segmented`, inputs).
- `prototype/panels.jsx` — `StatusPill`, `ScreenshotsPanel`, `TimesToBeatPanel`,
  `AboutPanel`, `ThemesTagsPanel`, `JournalFeed`, `RelatedGames`.
- `prototype/app.jsx` — page composition, status wiring, state, drawers.
- `prototype/lib/` — design-system CSS + UI-kit primitives (reference only; the
  real app already has these as shadcn components + `styles.css`).
- `COMPONENTS.md` — component-by-component breakdown with props + FSD target paths.
- `DATA_MODEL.md` — Prisma schema, server functions, status-sync notes.
