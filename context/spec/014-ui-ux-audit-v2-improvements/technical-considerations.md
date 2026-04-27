# Technical Specification: UI/UX Audit V2 — Round 2 Improvements

- **Functional Specification:** [`context/spec/014-ui-ux-audit-v2-improvements/functional-spec.md`](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Nail Badiullin

---

## 1. High-Level Technical Approach

This spec is a **presentation-layer + global-shell** rework. No schema changes, no new server actions outside what is already established by spec 011 (rating writes), spec 012 (library mutations + quick-add), and spec 008 (follow). The bulk of the work is in the FSD `widgets/` and `features/` layers plus the protected-route layout, with a documented type-scale rollout across every touched page.

**Strategy on a page:**

- **Global shell.** Replace the desktop top-bar `widgets/header` with a new `widgets/sidebar` left-rail widget built on the shadcn **Sidebar** block. Replace the 6-tab `widgets/header/ui/mobile-nav.tsx` with a 4-tab `widgets/mobile-nav` plus a new `widgets/mobile-topbar`. `app/(protected)/layout.tsx` switches to a rail+main grid on `md+` and a topbar+main+bottomnav stack on mobile.
- **Search single-anchor.** Remove the inline search affordance from the top bar (desktop) and the bottom nav (mobile). Both rail and mobile topbar surface a single search-icon button that opens the existing `features/command-palette`. The `+ Add Game` standalone button is removed; "Add game to library" lives inside the palette as a quick-action group.
- **Command palette hardening.** `features/command-palette` already exists and powers ⌘K + the `Add Game` button today. We harden the global keybind, formalize the result groups (Games / Navigation / Quick actions), wire the dashboard "Add Game" CTA to the same provider, and confirm the palette is reachable from every authenticated route on every breakpoint.
- **Page reworks.** Game detail (`app/games/[slug]/page.tsx` + `features/game-detail/ui/`) collapses banner + sticky sidebar into one hero lockup. Library status changes from a modal-backed card to an inline segmented control. Journal entry detail and journal list are restructured. Profile header switches to banner+overlap; profile sub-tabs to a segmented control. Auth page is a minimal editorial layout. Settings is restructured to `/settings/[section]` with its own layout that nests under the global rail.
- **Type scale.** Existing CSS utilities (`heading-xl`, `body-md`, `caption`, etc. in `shared/globals.css`) are kept. We add **semantic aliases** (`text-display`, `text-h1`, `text-h2`, `text-h3`, `text-body`, `text-caption`) that map onto the existing tokens, refactor every page touched by this spec onto the semantic names, and document role rules. Old utility names remain available as deprecation surface for non-touched pages.
- **Behavior preserved.** Star-rating writes (spec 011), quick-add server action with smart defaults (spec 012 §2.11), follow / unfollow (spec 008), and the library hero `/` shortcut (spec 012 §2.6) are all reused unchanged.

**Sequencing intent (carried into `/awos:tasks`):** type-scale aliases first → global shell (rail + mobile topbar + 4-tab nav + palette hardening) → page reworks (game detail, journal, profile, settings, auth) → chip + sub-tabs polish. The shell is foundational; the page reworks build on the rail's grid and the new aliases.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1 Architecture Changes

**No backend layer changes.** No new services, use-cases, repositories, or API routes. All mutations reuse existing server actions. The four-layer architecture (App Router → Service → Repository, plus optional Use-Case / Handler) is unchanged.

**FSD layer changes:**

| Change | Layer | Notes |
|---|---|---|
| New widget `widgets/sidebar` | widgets | Desktop left rail. Built on shadcn Sidebar block. |
| New widget `widgets/mobile-topbar` | widgets | Mobile top app bar with search-icon + brand. |
| Mobile nav moved to `widgets/mobile-nav` | widgets | Extract from `widgets/header/ui/mobile-nav.tsx` to its own widget; reduce to 4 tabs. |
| `widgets/header` retained for unauth | widgets | Login screen and any unauth route still use the existing simple header (without the nav links / Add Game button). Auth route group keeps its own layout. |
| Settings route restructure | app | New `app/(protected)/settings/` route group with `layout.tsx` (settings rail) + `[section]/page.tsx`. Old `app/(protected)/profile/settings/` is removed and its page is migrated. |

**Cross-feature import additions** (added to `features/CLAUDE.md` registry):

| Feature | New Authorized Consumer |
|---|---|
| `command-palette` | `widgets/sidebar/`, `widgets/mobile-topbar/` (already authorized for `widgets/header`, layouts) |
| `social` | already authorized for `app/(protected)/dashboard/page.tsx`; no new entry needed for follow on profile (spec 008 already wires it inside `features/profile/`). |

### 2.2 Data Model / Database Changes

**None.** Zero schema migrations. The spec is presentation-layer only. Verified data touchpoints:

| Field / Source | Used By | Existing? |
|---|---|---|
| `LibraryItem.status` | 2.4 inline segmented write | yes |
| `LibraryItem.rating` | 2.4 inline stars | yes (spec 011) |
| `JournalEntry.title` (nullable) | 2.5 fallback to first body line / `<game> — <date>` | yes (rendered fallback only; persisted column unchanged) |
| `JournalEntry.gameId`, `mood`, `tags`, `body`, `createdAt`, `duration` | 2.5, 2.6, 2.11 | yes |
| `User.banner` (or equivalent) | 2.7 banner+overlap | **verify in implementation**; if absent, fall back to a deterministic gradient or solid color derived from the user's avatar palette. No new column added by this spec; if a banner column is desired, it is a follow-up. |
| `User.email` visibility | 2.7 (never on public profile) | filter at the public-profile boundary; the field is already excluded from public DTOs in spec 008 — verify and tighten if needed. |
| IGDB game records | 2.13 quick-add platform default | yes (spec 012 §2.11) |

### 2.3 API Contracts

**No new endpoints, no new server actions.** The palette quick-add result reuses `features/command-palette/hooks/use-quick-add-from-palette.ts` (already wired to spec 012's quick-add server action). The inline status segmented control reuses the existing status mutation in `features/manage-library-entry/`. The inline rating reuses `features/game-detail/ui/library-rating-control.tsx` (spec 011).

### 2.4 Component Breakdown

#### Global shell (2.1, 2.2, 2.13)

| Path | Responsibility |
|---|---|
| `widgets/sidebar/ui/sidebar.tsx` | Desktop left rail. Built on shadcn `Sidebar` (newly installed). Renders brand, primary nav (Library / Journal / Timeline / Profile / Settings), search-icon button, user menu slot. Collapses to icon-only at narrow widths via shadcn's built-in collapse. |
| `widgets/sidebar/ui/sidebar-search-trigger.tsx` | Search-icon button that calls `useCommandPaletteContext().open()`. |
| `widgets/sidebar/ui/sidebar-user-menu.tsx` | Avatar + dropdown with Settings link and Logout action. Logout uses existing auth signout server action. |
| `widgets/sidebar/index.ts` | Public API barrel. |
| `widgets/mobile-topbar/ui/mobile-topbar.tsx` | Mobile top app bar: brand mark + single search-icon button that opens the palette. Sticky-top within `<main>`. |
| `widgets/mobile-topbar/index.ts` | Public API barrel. |
| `widgets/mobile-nav/ui/mobile-nav.tsx` | 4 tabs only: Library, Journal, Timeline, Profile. Search and Dashboard tabs removed. |
| `widgets/mobile-nav/index.ts` | Public API barrel. Replaces `widgets/header/ui/mobile-nav.tsx` import path. |
| `widgets/header/ui/header.tsx` | Reduced scope: unauth-only header for marketing / login screens. Authenticated navigation moves entirely to `widgets/sidebar`. |
| `app/(protected)/layout.tsx` | Switches to a CSS grid layout: `md+` = `[sidebar][main]`, mobile = `[topbar][main][bottom-nav]`. `<Toaster>`, `<JournalFab>`, `<WhatsNewModal>`, `<CommandPaletteProvider>` orchestration preserved. |
| `app/games/layout.tsx` | Mirrors the `(protected)` layout (currently uses the same header + palette). Must be kept in sync — extract a shared `AuthenticatedShell` component if duplication grows. |

**Removed:**

- `widgets/header/ui/mobile-nav.tsx` (migrated to `widgets/mobile-nav`).
- The `+ Add Game` button on `widgets/header/ui/header.tsx` (its function moves into the palette quick-actions group).
- The 5 nav links from `widgets/header/ui/header.tsx` (move to the rail).

#### Game detail (2.3, 2.4)

| Path | Responsibility |
|---|---|
| `features/game-detail/ui/game-detail-hero.tsx` (new) | Unified hero lockup: cover + title (h1 = display) + inline segmented status + inline rating stars. Replaces the banner + sidebar layout. Mobile variant: shrunken banner gradient with cover overlap. |
| `features/game-detail/ui/library-status-segmented.tsx` (new) | Segmented control of statuses; horizontal scroll with snap points + fading edge on narrow viewports. Optimistic write via existing status mutation. |
| `features/game-detail/ui/library-status-display.tsx` | Modified or removed: the standalone "Library Status" sidebar/card is deleted. Remaining bits (notes / secondary actions) move behind a `⋯` menu. |
| `features/manage-library-entry/ui/manage-library-entry-modal.tsx` | Retained for notes / custom shelves only — no longer the path for status or rating changes. Entry point becomes the `⋯` menu, not a peer button. |
| `app/games/[slug]/page.tsx` | Page composition: `<GameDetailHero>` → description → metadata → journal entries section. Banner becomes a thin decorative gradient in the hero, not a structural element. |

**Status segmented control fallback (2.4):** if usability testing rejects horizontal scroll, swap `library-status-segmented.tsx` for a dropdown-pill component (shadcn `DropdownMenu` over a `Button` styled as a status pill) without page-level changes. This is a single-file swap because the hero composes the control by name.

#### Journal (2.5, 2.6, 2.11)

| Path | Responsibility |
|---|---|
| `features/journal/ui/journal-entry-detail.tsx` | Refactored to editorial header: h1 = entry title (with fallback), mood eyebrow above, metadata line below (game / duration / date). Body becomes the dominant block. Edit remains primary; Delete moves into a `⋯` overflow menu wrapping the existing `delete-entry-dialog.tsx` confirmation. |
| `features/journal/lib/derive-entry-title.ts` (new) | Pure function: `(entry: JournalEntry, game: Game) => string`. Returns persisted title if non-empty, else first non-empty line of body truncated, else `"<game.title> — <date>"`. Render-only. |
| `features/journal/ui/journal-timeline.tsx` | Refactored to group entries by `gameId`. Group key = game; group sort = most-recent-entry desc; in-group sort = `createdAt` desc. Group header shows cover, title, count. Empty state preserved. |
| `features/journal/ui/journal-entry-card.tsx` | Mood becomes an eyebrow (small uppercase, color-tinted) above the entry title. Tags render as outlined chips below the body; leading `#` stripped at render. |
| `shared/components/ui/chip.tsx` (new, optional) | Outlined chip primitive shared by tags and any future filter chips. If overkill, inline as a styled `<span>` and skip the primitive. |

#### Profile (2.7, 2.8)

| Path | Responsibility |
|---|---|
| `features/profile/ui/profile-header.tsx` (new or rework existing) | Banner + avatar overlap layout. Single inline metadata row (handle + counts). One primary action button: Edit Profile (owner) or Follow / Unfollow (visitor; reuse `features/social` follow control). Logout removed. Email never rendered. |
| `features/profile/ui/profile-tab-nav.tsx` | Switch from underline tabs to segmented control. Public-API surface (props, active routing) preserved so `app/u/[username]/(tabs)/layout.tsx` doesn't change. |
| `shared/components/ui/segmented-control.tsx` (new) | Segmented control primitive (used by 2.4 and 2.8). Built on shadcn `tabs` semantics (radix primitives) with a styled background + active pill. Supports horizontal scroll mode for 2.4. |

**Email visibility:** verify the public-profile DTO in `data-access-layer/services/profile-service.ts` (or equivalent) excludes `email`. If exclusion is currently controlled by the visibility toggle from spec 008, harden so email is never serialized into the public DTO regardless of toggle.

#### Auth (2.9)

| Path | Responsibility |
|---|---|
| `features/auth/ui/auth-page-view.tsx` | Refactored to a minimal editorial layout. Removes "Manage your gaming experiences". Type carries the brand. Google OAuth + email/password controls retained (no behavior change). Renders correctly at 360px and 1440px. |
| `app/login/page.tsx` | Composition unchanged in structure; consumes the refactored `AuthPageView`. |

#### Settings (2.10)

| Path | Responsibility |
|---|---|
| `app/(protected)/settings/layout.tsx` (new) | Owns the settings rail (nested visually inside the global rail; on mobile renders as a sectioned list). |
| `app/(protected)/settings/[section]/page.tsx` (new) | Section content. Initial sections: `profile`, `account`. Adding a section is a one-page addition. |
| `app/(protected)/settings/page.tsx` (new) | Redirects to `/settings/profile` (or to the most recently visited section via cookie / search-param; redirect target documented at implementation time). |
| `app/(protected)/profile/settings/page.tsx` | Removed. Existing form (avatar, username, save) moves into `app/(protected)/settings/profile/page.tsx` unchanged. |
| `features/profile/ui/settings-rail.tsx` (new) | Rail items component used by the settings layout. Renders inside the global rail's main column on desktop; renders as a sectioned list on mobile. Reserves a "Danger zone" slot at the bottom (no destructive actions implemented this spec). |

**Logout** is exposed via the user menu in `widgets/sidebar` and via a settings link in the Account section; both call the existing signout flow.

#### Type scale (2.12)

| Path | Responsibility |
|---|---|
| `shared/globals.css` | Add semantic aliases (`.text-display`, `.text-h1`, `.text-h2`, `.text-h3`, `.text-body`, `.text-caption`) that compose the existing CSS variables. Existing utilities (`heading-xl`, `body-md`, etc.) remain to avoid breaking untouched pages. |
| `shared/lib/typescale/typescale.md` (new doc) | Role rules per stop, mapping table from semantic name to existing token, and an examples section. |
| `eslint.config.mjs` | New rule (or extend existing custom plugin): warn on `text-[NNpx]` literals and on the legacy `heading-*`/`body-*` utilities **only inside files touched by this spec** (scoped via overrides). Promote to error in a follow-up after migration is complete. |

**Mapping table (canonical):**

| Semantic | Existing token | Role |
|---|---|---|
| `text-display` | `display-lg` | Hero surfaces. ≤ once per page. Optional. |
| `text-h1` | `heading-xl` | Page subject. Exactly one per page. |
| `text-h2` | `heading-lg` | Section headings. |
| `text-h3` | `heading-md` | Sub-section headings. |
| `text-body` | `body-md` | Default reading text. |
| `text-caption` | `caption` | Labels, eyebrows, metadata, timestamps. |

#### Command palette (2.13)

| Path | Responsibility |
|---|---|
| `features/command-palette/ui/desktop-command-palette.tsx` | Formalize three result groups: **Games** (existing IGDB search), **Navigation** (Library / Journal / Timeline / Profile / Settings / Dashboard), **Quick actions** (Add game to library, plus contextual: New journal entry / Log session when reachable). |
| `features/command-palette/ui/mobile-command-palette.tsx` | Same group structure on the mobile variant. |
| `features/command-palette/hooks/use-command-palette.ts` | Confirm global ⌘K binding is mounted at provider level; ensure no other surface rebinds ⌘K. Add a single global keybind reservation (documented). |
| `features/command-palette/server-actions/get-recent-games.ts` | No change. |
| `features/command-palette/CLAUDE.md` | Update notes to reflect that the palette is now the single search/quick-add surface across breakpoints. |

The palette's existing FSD authorizations (`widgets/header/`, `app/(protected)/layout.tsx`, `app/games/layout.tsx`) extend to `widgets/sidebar/` and `widgets/mobile-topbar/`; update `features/CLAUDE.md` accordingly.

### 2.5 Logic / Algorithm

- **Auto-derived journal entry title** (2.5): pure utility `derive-entry-title.ts`. Render-only — never written to `JournalEntry.title`. Truncation: ~80 chars at the nearest word boundary; fallback chain: persisted title → first non-empty body line → `"<game.title> — <YYYY-MM-DD>"`.
- **Journal grouping** (2.6): client-side group by `gameId` after fetching the timeline (existing query). For very large timelines, switch to a query-level grouping in a follow-up; this spec ships the client-side grouping because the existing query already paginates.
- **Segmented status fallback signal** (2.4): a single feature flag (env or constant) `LIBRARY_STATUS_INLINE_VARIANT = "segmented" | "dropdown-pill"`, defaulting to `segmented`. The hero composes the control by flag value. Switching is a one-line change post-implementation.
- **Type scale enforcement scope**: ESLint rule scoped to file globs corresponding to pages touched by this spec; expansion to whole codebase is out-of-scope (tracked as a follow-up).

---

## 3. Impact and Risk Analysis

### System Dependencies

- **Depends on:** spec 008 (follow control), spec 011 (rating control + 1–10 scale), spec 012 (quick-add server action with smart defaults; library hero `/` shortcut; library card behavior).
- **Affects:** every authenticated page (rail wraps them). The `(protected)` and `games` route groups both depend on the layout shell — both must be migrated together to avoid a split shell.
- **Cross-layer touchpoints:** none in `lambdas-py/` or `infra/`. Pure `savepoint-app/`.

### Potential Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Theme variants (`y2k:`, `jewel:`) collide with the new shell. The current `Header` carries a lot of theme-specific styling. | High | Audit `widgets/header/ui/header.tsx` theme classes when extracting; ensure `widgets/sidebar` exposes equivalent theme hooks. Re-test all themes (`/themes/jewel`, `/themes/y2k`) on every shell page. |
| Segmented status with horizontal scroll feels rough. | Medium | The fallback (dropdown pill) is documented at spec time and switchable by `LIBRARY_STATUS_INLINE_VARIANT`. Run the segmented variant past a manual usability check before locking. |
| Layout regressions on the `app/games/` route group (uses its own `layout.tsx`). | Medium | Extract a shared `AuthenticatedShell` component used by both `(protected)/layout.tsx` and `games/layout.tsx`, OR migrate both layouts in the same task. |
| ESLint type-scale rule false-positives on legitimate `text-[NNpx]` usages (e.g., dynamic Tailwind values from cover-art components). | Low | Allow inline-disable comments and document the escape hatch in `typescale.md`. Scope rule to `app/`, `features/`, `widgets/` only. |
| Dashboard's "Add Game" CTA becomes invisible when we remove the rail-level `+ Add Game` button. | Medium | Keep the dashboard hero's "Add Game" CTA wired to `useCommandPaletteContext().open()` — the surface remains, but globally the entry is ⌘K + search-icon. |
| Banner image asset missing on profile (no `User.banner` column). | Medium | Render a deterministic gradient derived from the avatar's dominant color (or a neutral default). No schema change in this spec. Add `User.banner` as a follow-up if customization is desired. |
| Settings restructure breaks deep links (`/profile/settings`). | Medium | Add a Next.js `redirect()` from `/profile/settings` → `/settings/profile`. Keep for at least one release cycle. |
| Email leakage on public profile. | Low (already protected) | Tighten the public-profile DTO so `email` is never included regardless of visibility toggle; add a server-side test that asserts public profile responses do not contain `email`. |
| Theme tokens not aligned with new semantic aliases. | Low | The aliases compose existing CSS variables — themes that overrode the variables continue to work. Verified in 2.12 mapping table. |
| Command palette `⌘K` collision with browser or extension shortcuts. | Low | Existing palette already binds ⌘K; collision history is acceptable. Document fallback to `Ctrl K` and a slash-icon click. |

---

## 4. Testing Strategy

**Unit (Vitest, `*.test.tsx` co-located):**

- `derive-entry-title.ts` — fallback chain, truncation boundaries, empty body, missing game.
- `widgets/sidebar` — active-link semantics, `aria-current`, collapse behavior, search trigger calls `open()`.
- `widgets/mobile-nav` — 4 tabs render, no Search tab, tab semantics preserved.
- `library-status-segmented.tsx` — selecting a segment dispatches the correct status mutation; horizontal-scroll affordance shows snap edges; fallback variant renders when flag flipped.
- `profile-tab-nav.tsx` — segmented variant preserves keyboard navigation and `aria-current`.
- `command-palette` — three result groups visible under a query; navigation result navigates; quick-action "Add game" calls existing quick-add path.
- Type-scale ESLint rule — assert it warns on `text-[14px]` and on legacy `heading-md` inside touched globs; assert it does not warn on the new `text-h3`.

**Component (RTL):**

- Game detail page renders one `<h1>` (the title), no second `<h1>` from a sidebar widget.
- Journal entry detail renders `<h1>` (auto-derived when title absent), Delete is not adjacent to Edit, clicking Delete opens a confirmation.
- Profile header renders Edit (owner) XOR Follow (visitor); Logout is not present; email is not rendered.
- Auth page does not contain the string "Manage your gaming experiences".

**Integration / server:**

- Public profile DTO does not include `email` regardless of visibility toggle. (New test in `features/profile/` or `features/social/` integration suite.)
- `/profile/settings` redirects to `/settings/profile`.
- Quick-add via palette writes a `LibraryItem` with `status = UP_NEXT`, `acquisitionType = DIGITAL`, `platformId = <auto>` (re-uses spec 012 §2.11 tests; assert palette path triggers same code).

**E2E (Playwright):**

- Desktop: navigate to every primary route via the rail; press ⌘K; add a game from the palette; observe undo toast; hit Esc to close palette; verify focus restored.
- Mobile (≤ 640px viewport): bottom nav has 4 tabs; top app bar has search icon; tapping search icon opens palette; quick-add succeeds; bottom nav not regressed.
- Game detail: change status via segmented control on desktop and mobile; rate via stars; no modal opens.
- Journal: create entry without a title; detail page shows auto-derived title; deleting requires confirmation.
- Settings: navigate to `/settings`, switch sections via the settings rail, save profile changes, verify Logout works from Account.
- Themes: smoke-test each shell page under `y2k` and `jewel` themes — no broken layouts, palette and rail render correctly.

**Regression coverage:** every page touched gets a snapshot at the type-scale level — assert no `text-[NNpx]` literals or legacy utility names remain in modified files (lint check) and that the page's `<h1>` count is exactly 1.

**Out-of-scope for this testing plan:** broad codebase migration of `heading-*` / `body-*` utilities outside touched pages (tracked separately).
