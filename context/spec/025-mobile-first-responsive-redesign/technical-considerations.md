<!--
HOW to build spec 025 at an architectural level. Structures & contracts, file
paths & responsibilities — not copy-paste implementation. Reads against
functional-spec.md (same folder) and context/product/architecture.md.
-->

# Technical Specification: Mobile-First Responsive Redesign

- **Functional Specification:** [`./functional-spec.md`](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Nail Badiullin

---

## 1. High-Level Technical Approach

This is a **presentation-layer redesign** of the authenticated app shell and 8 core surfaces in `savepoint-tanstack`. It introduces **no database, schema, or new server-function work** — all data already exists and flows through today's loaders and `createServerFn`s unchanged. The work lands in `app/` (global styles, root wiring), `routes/` (root search schema + the global sheet host), `widgets/` (the bulk: nav, dashboard, library, game detail, journal, profile, settings), `features/*/ui/` (filter, add-game, compose), and `shared/` (one lifted hook, token additions).

The plan sequences as **three foundations first, then per-surface restyling**:

1. **Foundations** (unblock everything): lift a shared `useMediaQuery` to `shared/lib`; add a **root-level global-action mechanism** (a typed URL search param + a single globally-mounted sheet host) so "Log a session" and "Add a game" become reachable — and deep-linkable — from anywhere; **unify the responsive boundary on `md` (768px)** across nav and filters; wire the orphaned PWA manifest.
2. **Per-surface redesign**: each surface is rebuilt mobile-first and widened additively to desktop, **reusing existing primitives** (`Sheet`, `Dialog`, `Popover`, `Card`, `Button`, `SegmentedControl`, `GameCover`, `CriticScoreRing`, `LibraryStatusSwitcher`, status badges/strips). The bundled prototypes in [`./design-reference/`](./design-reference/) are the visual oracle (Mobile Audit + mobile & desktop hi-fi).

**Responsive strategy:** CSS-first (Tailwind v4 responsive utilities for columns, spacing, visibility) with JS branching via the shared `useMediaQuery` **only where the two layouts are structurally different DOM** — the sheet-vs-modal flows and game-detail's mobile sticky action bar vs desktop sticky rail. This matches the app's existing norm (the command palette already branches Sheet↔Dialog at 768px).

**Affected systems:** front-end only. No auth, DAL, Prisma, IGDB, S3, or infra changes.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.0 Architecture Changes — the one new primitive

Everything else is restyling; the single genuinely-new construct is a **global, route-aware way to open the Log / Add sheets**. Today modal state is page-local `useState` and the only cross-component trigger is the `openCommandPalette()` custom event. We add:

**Root search-param contract** (`src/routes/__root.tsx` → `validateSearch`, Zod):

| Param | Type | Purpose |
|---|---|---|
| `action` | `"log-session" \| "add-game"` (optional) | which global sheet is open |
| `game` | `string` (optional, slug) | pre-target for `log-session` when context implies a game |

- A new **`GlobalActionHost`** widget is mounted once in `__root.tsx`, beside `CommandPalette` / `WhatsNewModal` (root mount point is already established, gated on `user`). It reads `useSearch({ from: "__root__" })` and renders the appropriate flow when `action` is set — as a **bottom `Sheet`** on mobile, a **centered `Dialog`/modal** on desktop (JS-branched via the shared hook, mirroring the command palette).
- **Triggers** (bottom-nav center Log button, desktop sidebar Log CTA, dashboard hero, game-detail action bar/rail, dashboard "continue" rows) are plain `navigate({ search: (p) => ({ ...p, action, game }) })` calls — no event bus, no prop-drilling. Closing clears the params.
- **Deep-linkable:** `/?action=log-session` works as an entry URL, which also lets the PWA manifest expose a "Log a session" app shortcut later.
- **Reuse, don't fork:** the existing in-page triggers keep working by having both the page and the host render the **same extracted sheet-content component**. We split the current `LogSessionDrawer` (already `Sheet`-based) and `AddGameModal` into a reusable content component + a thin host wrapper, so there is one source of truth for each flow.

> **Foot-gun guard:** the sheets submit via existing feature server fns. Those must be imported from **non-`.server.ts`** files (the `createServerFn` RPC bridge); the current flows already do this — preserve it when extracting content.

### 2.1 Foundations

| ID | Change | Files |
|---|---|---|
| F1 | **Lift `useMediaQuery`** to a shared, SSR-safe hook; introduce a `useIsDesktop()` = `min-width: 768px` convention so `md` is the single JS source of truth mirroring the CSS `md`. Replace the two local copies. | new `src/shared/lib/use-media-query/`; update `features/command-palette/hooks/use-media-query.ts` consumers and `widgets/game-detail/ui/library-status-switcher/use-media-query.ts` |
| F2 | **Global action host** (see 2.0). | `src/routes/__root.tsx` (search schema + mount); new `src/widgets/global-action-host/`; extract content from `features/compose-journal-entry/ui/log-session-drawer/` and `features/add-game/ui/add-game-modal/` |
| F3 | **Unify breakpoint on `md`.** Normalize the library filter chrome from `xl`→`md` so nav and filters switch together; remove the 768–1279px broken middle state. | `features/filter-library/ui/mobile-filter-bar/`, `features/filter-library/ui/library-filters/` |
| F4 | **Token / styles additions.** Add a safe-area-aware bottom-nav spacing utility and any new spacing/elevation tokens; replace arbitrary Tailwind values flagged by the widgets rule (`pt-[140px]`, `md:grid-cols-[1.35fr_1fr]`, arbitrary library grid) with token/standard classes. | `src/styles.css`; the widgets that use arbitrary values |
| F5 | **PWA install wiring** (scoped: manifest only). Link `manifest.json` in `__root.tsx` `head()`; add a `theme-color` meta; correct `public/manifest.json` `theme_color`/`background_color` from the retired cream `#f6f1e7` to the current design-system light token. **No service worker / offline** (out of scope per functional spec). | `src/routes/__root.tsx`, `public/manifest.json` |

### 2.2 Component Breakdown — by surface

Each surface is restyled in place (existing widget folders, own-folder + barrel convention) unless a **new** sub-component is noted.

**Global navigation** (`widgets/app-bottom-nav`, `app-mobile-topbar`, `app-sidebar`, `app-shell`)
- Bottom nav → **5 slots**: Home (`/dashboard`), Library (`/library`), **Log** (center raised button → `?action=log-session`), Journal (`/journal`), Profile. Active tab = **filled/accented icon + label + `aria-current`** (not color-only). All tap targets ≥44px. New: a `nav-log-button` sub-component for the raised center action.
- Mobile top bar → bump icon buttons 36→44px; wire the search icon to **`openCommandPalette()`** (today it page-navigates); keep it route-agnostic.
- Sidebar → add **Home/Dashboard** link (parity with bottom nav); ensure the **"Log a session" CTA** sits pinned under the brand (→ `?action=log-session`); keep the status legend; collapse/expand toggle is an **optional enhancement** (mark low-priority).
- App shell → bottom-nav safe-area padding via the F4 utility.

**Dashboard** (`widgets/dashboard-page` + sub-components)
- Mobile: greeting eyebrow → **"Jump back in" hero card** (most-in-progress game; Log button → `?action=log-session&game=<slug>`) → **compact status strip** (reuse `entities/library-item/ui/library-status-strip`) → **horizontal swipe carousels** for Playing / Up next / Recently played. Convert `dashboard-game-section` to a `scroll-snap` rail on mobile, grid on desktop (CSS).
- Desktop: hero + "Continue" rail side-by-side; library-breakdown + last-reflection cards; multi-column rails.

**Library** (`widgets/library-page`, `features/filter-library`, `features/add-game`)
- Default **2-up cover grid** on phones (tokenized columns, not arbitrary values); widens to ~5/7-up on desktop.
- **Sticky status lens**: promote status out of the filter sheet into an always-present sticky **segmented row** (reuse `SegmentedControl`) with per-status counts; one tap re-filters (drives the existing `status` search param). Secondary filters (platform/rating/sort) stay in the **Filters sheet** (mobile) / inline panel (desktop) with an active-count badge.
- **Grid/list view toggle** (new local UI state); list = metadata rows.
- Add-game: FAB stays on Library **and** Add becomes globally reachable via `?action=add-game`.

**Game detail** (`widgets/game-detail` + sub-components)
- Mobile: slim translucent top bar with **Back** + **More** (no breadcrumb); **stacked hero** (cover, critic ring, then title); status switcher row; **sticky jump spine** (anchor row, reuse `SegmentedControl` semantics); single-column panels (existing Playthroughs / About / Themes-Tags / Journal / Screenshots / Related unchanged in content); **sticky bottom action bar** (status pill + Log) above the tab bar.
- Desktop: two-column content + **sticky right rail** (status switcher, Log CTA, `CriticScoreRing`, "Your time" summary).
- New sub-components: `game-detail-action-bar` (mobile sticky), `game-detail-jump-spine`, `game-detail-detail-rail` (desktop). Reuse `LibraryStatusSwitcher` (its local `useMediaQuery` now imports the shared hook). Replace `pt-[140px]` / `md:grid-cols-[1.35fr_1fr]`.

**Journal** (`widgets/journal-timeline*`, `features/compose-journal-entry`)
- Convert `ComposeJournalEntryDialog` to render as a **bottom `Sheet` on mobile, centered `Dialog` on desktop** (JS-branch via shared hook), keyboard-aware (text area as hero, "playtime alone is enough" guidance). Timeline content stays; desktop pairs it with a stats rail.

**Profile & Settings** (`widgets/profile-overview`, `widgets/settings-rail`, settings routes)
- Profile: **compact header** (avatar + name + one stat row + **full-width primary action**) above a **sticky tab strip** (reuse `SegmentedControl`); content starts higher. Replace arbitrary avatar/banner sizes.
- Settings: mobile **iOS-style grouped list** of full-height rows (inline toggles / drill-in) that pushes into the existing `settings/profile` & `settings/account` routes; desktop keeps the two-column `md:grid` layout. New: a `settings-list` mobile sub-component (the existing `settings-rail` remains the desktop nav).

### 2.3 Cross-cutting
- **Active indicator** not color-only (icon fill + `aria-current`).
- **Touch targets** ≥44px across chrome.
- **Reduced motion**: gate `Sheet`/`Dialog`/carousel entrance animations behind `prefers-reduced-motion` (Tailwind `motion-reduce:` / token).
- **Theme**: every restyled surface must read correct in Light / Dark / System (spec 022 tokens); no hardcoded hex — use `--status-*`, `--primary`, surface tokens. Default theme unchanged.

---

## 3. Impact and Risk Analysis

**System Dependencies**
- Reuses **spec 022** design tokens (Light/Dark) and **spec 016** per-playthrough panels + run-aware journal — both consumed, neither changed.
- No dependency on the community layer (Reviews/Aggregate Stats), Bento Reflow, or discovery items — all explicitly out of scope.

**Potential Risks & Mitigations**
- **Regressing existing in-page triggers** when extracting Log/Add content for the global host → keep **one source-of-truth content component** rendered by both the page and the host; cover with component tests (RED first).
- **Root search-schema growth** → keep it minimal (`action`, `game`), both optional; document on the root route. Avoid piling unrelated UI state onto the root schema.
- **SSR hydration mismatch** from `useMediaQuery` (server has no viewport) → SSR-safe hook with a stable first paint; CSS-first default; JS-branch only the few structural cases; never gate first-paint-critical content on the hook.
- **`md` at 768px crowding the desktop library** (sidebar + filter panel + grid in tablet portrait) → the **status lens is always present** at every width; the inline secondary-filter panel only appears where there's room (min-width grid cells; panel can stay a sheet until `lg` if 768px proves cramped — a CSS-only tuning, not an architecture change).
- **`.server.ts` boundary / foot-gun #8** when wiring sheet submits globally → import server fns from non-`.server.ts` files (unchanged from today).
- **Widgets-rule arbitrary-value lint** → F4 replaces flagged `[...]` values; new code uses tokens/standard utilities.
- **Scope creep** → the redesign restyles existing surfaces only; no new features/data/screens (settings detail screens already exist as routes).

---

## 4. Testing Strategy

Follows the app's conventions (Vitest two-project; component tests in jsdom + RTL with the module-level `elements`/`actions` vocabulary, given/when/then nesting, strings-over-regex; **tests assert user-observable behavior, not call-envelope shape**).

- **Component tests (unit, jsdom)** — the core of this work:
  - Bottom nav renders **5 slots incl. Home and a Log action**; the Log button issues a navigation carrying `action=log-session` (router stubbed); active tab exposes a non-color indicator + `aria-current`.
  - Library shows a **2-up grid** at mobile width, a **sticky status lens** that re-filters in one interaction, and a working grid/list toggle.
  - Game detail renders the **sticky bottom action bar** with a working Log trigger and a **jump spine**; desktop branch renders the sticky rail (mock `useMediaQuery`).
  - Compose opens as a **Sheet at mobile / Dialog at desktop** (mock the shared hook).
  - Settings renders a **grouped list** on mobile; Profile renders the **compact header + full-width primary action**.
  - `GlobalActionHost` opens the right flow from the search param and clears it on close (router stub) — the one new primitive gets direct coverage.
- **Coverage gate** (`src/{entities,features}` ≥85% statements): most changes live in `widgets/` (ungated), but the **`filter-library`, `add-game`, `compose-journal-entry`** feature changes are gated — keep them at/above threshold; author tests RED-first per the TDD policy.
- **No new server functions** → no new integration tests; existing flow integration tests must stay green after the content-extraction refactor.
- **Manual/visual verification** against the `design-reference/` prototypes across **Light / Dark / System** and **phone / desktop** widths; reduced-motion verified. E2E remains deferred per the architecture doc.
