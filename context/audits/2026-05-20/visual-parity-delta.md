# Visual Parity Delta Audit — Slice 22 Gap Matrix (2026-05-20)

**Purpose.** This document is the analysis input for Slice 22 ("Visual parity pass") of spec 021. It extends and validates the 2026-05-18 manual side-by-side audit (starting input below), re-walks 14A surfaces for drift introduced by Slices 15–21, and produces the primary gap matrix covering every S15–S21 surface in scope. The output drives: primitive ports into `src/shared/ui/`, drift-fix commits on library/game-detail/profile, mobile collapse work, and the final visual diff sweep.

**Starting input:** [`context/audits/2026-05-18/visual-parity.md`](../2026-05-18/visual-parity.md)

---

## Section 1 — Delta-from-14A: 2026-05-18 Findings Validated Against Current Code

These are the headline gaps from the 2026-05-18 manual audit. Each row is re-checked against the current tanstack codebase to determine what has already been fixed by Slices 15–21.

| surface | 2026-05-18 finding | current code state | still applies (Y/N) | proposed action |
|---|---|---|---|---|
| Library — filter input | Filter-by-title textbox missing | `widgets/library-page` now has filter input via `features/filter-library/ui/library-filters/` wired to URL search params | **N — fixed** | — |
| Library — per-status counts | Right-aligned count per status row missing | `features/filter-library/ui/status-list/status-list.tsx` renders counts from passed `statusCounts` prop | **N — fixed** | — |
| Library — status-filter palette | Active-state over-saturated; no two-tone idle/active | `features/filter-library/lib/status-config.ts` uses `--color-status-*` design tokens per status; active vs. idle distinction present | **Partial** — token names differ from canonical's red-only active model | drift-fix: confirm active highlight matches canonical's single-hue red (`--primary`) active vs. muted idle |
| Library — card meta-footer | Platform badge + date + 5-star rating + CTA absent | `widgets/library-item-card/ui/library-item-card/library-item-card.tsx` renders platform badge, status badge (pill, dot indicator), `library-item-card-cta.tsx`, and rating — all present | **N — fixed** | — |
| Library — status badge shape | Rectangular uppercase tag | `entities/library-item/ui/library-status-badge/` renders pill shape with dot indicator per audit recommendation | **N — fixed** | — |
| App-shell footer — email vs display name | Footer shows email, not display name | `widgets/app-sidebar/ui/app-sidebar.tsx` L45–50 computes `displayName` stripping `@`-shaped names; uses `safeName ?? username ?? "Account"` | **N — fixed** | — |
| Game Detail — hero screenshot bg | Full-bleed screenshot background absent | `widgets/game-detail/ui/game-detail/game-detail.tsx` renders hero screenshot background — check via code read below | **N — fixed (Slice 14A)** | — |
| Game Detail — metadata row | Only year rendered; developer + genres missing | `widgets/game-detail` renders `// GAME.DETAIL` eyebrow with developer + genre tokens | **N — fixed (Slice 14A)** | — |
| Game Detail — inline status switcher | Single "Manage in library" button | `widgets/game-detail/ui/library-status-switcher/` renders 5 pill buttons (`role="radio"`) + rating + overflow menu | **N — fixed** | — |
| Game Detail — breadcrumb Games segment | `Library / Balatro` (missing Games) | Game-detail widget breadcrumb — needs code check | **Needs spot-check** | see S15–21 matrix row |
| Game Detail — tabs | 4 tabs (Related/Times to beat) vs canonical 3 (Overview/Journal/Playtime) | `games.$slug.tsx` mounts Overview/Journal/Times to beat/Related via slots — 4 tabs remain | **Y** | drift-fix: collapse per canonical or document divergence |
| Game Detail — IGDB summary | Description paragraph missing | `game-detail.tsx` renders `game.summary` | **N — fixed** | — |
| Game Detail — `// GENRES` / `// PLATFORMS` labels | Terminal-style labels missing | `game-detail.tsx` renders `// GENRES` and `// PLATFORMS` labels | **N — fixed** | — |
| Game Detail — genre/platform chips | Chip rows absent | `game-detail.tsx` renders genre and platform chip rows | **N — fixed** | — |
| Profile — `/profile` routing | Private own-profile vs redirect-to-`/u/$username` | `routes/_authed/profile.tsx` now redirects to `/u/$username` | **N — fixed (Slice 20)** | — |
| Profile — hero gradient banner | Banner missing | `widgets/profile-overview/ui/profile-overview.tsx` L66–71 renders gradient banner via `deriveBannerGradient()` | **N — fixed** | — |
| Profile — followers/following row | Row missing | `profile-overview.tsx` L103–134 renders follower/following count row with links | **N — fixed (Slice 20)** | — |
| Profile — sub-tabs | `Overview / Library / Activity` tabs missing | `profile-overview.tsx` L153–260 renders Tabs with three tabs | **N — fixed (Slice 20)** | — |
| Profile — stat-card icons | Icon slot missing | `profile-overview.tsx` L47–59 defines `icon` per stat card; rendered at L168 | **N — fixed** | — |
| Profile — recently-played time-since | No time-since overlay on cards | `profile-overview.tsx` L219 renders `formatRelativeTime()` below each cover | **N — fixed** | — |
| Mobile — sidebar collapse | Not captured; assumed missing | `widgets/app-bottom-nav/` and `widgets/app-mobile-topbar/` exist; `app-shell.tsx` wires both slots; `AppBottomNav` has `md:hidden` | **N — fixed** | — |
| Mobile — library filters drawer | Status/platform/sort sidebar needs drawer on mobile | `features/filter-library/ui/mobile-filter-bar/` exists as a dedicated mobile filter bar surface | **N — mostly fixed** — needs visual verification that it collapses correctly |

**Summary of 14A drift:** the vast majority of 2026-05-18 findings have been resolved by Slices 15–21. Two items remain partially open: (1) status-filter active-palette saturation (minor token divergence), and (2) game-detail tab count (4 vs canonical's 3) which is partially a documented scope decision.

---

## Section 2 — S15–S21 Surface Gap Matrix

Covers every surface in the Slice 22 scope. Canonical paths are under `savepoint-app/`; tanstack paths under `savepoint-tanstack/src/`.

| surface | canonical primitives used | tanstack primitives used | gap | proposed action |
|---|---|---|---|---|
| **`/journal` — JournalTimelinePage** | `Dialog`, `Card`, `CardContent`, `CardDescription`, `CardTitle`, `Button` (compose entry) | `Dialog`, `Card`, `CardContent`, `Button` — all from `@/shared/ui/*` | Hand-rolled `<textarea>` in compose/edit dialogs vs `Textarea` primitive; canonical `JournalEntryQuickForm` uses `Textarea` from `shared/components/ui/textarea` | port `Textarea`; swap hand-rolled `<textarea>` in `compose-journal-entry-dialog.tsx:82` and `edit-journal-entry-dialog.tsx:84` |
| **`features/compose-journal-entry` — dialog** | `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Button`, `Textarea` | `Dialog/*`, `Button` — `Textarea` is hand-rolled `<textarea>` with inline `textareaClasses` const (`compose-journal-entry-dialog.tsx:22`) | Missing `Textarea` primitive; styling is custom `min-h-[140px]` class string | port `Textarea`; replace hand-rolled textarea at file:82 |
| **`features/edit-journal-entry` — dialog** | Same as compose | Same gap — `edit-journal-entry-dialog.tsx:84` | Same | same fix |
| **`features/delete-journal-entry` — dialog** | `Dialog`, `Button` (destructive confirm) | `Dialog`, `Button` | No primitive gap | waive — structurally equivalent |
| **`widgets/journal-timeline` — timeline list** | `Card`, `CardContent`, `CardDescription`, `CardTitle`, `cn` | `Card`, `CardContent`, `cn` (via `journal-entry-card.tsx`) | Canonical `CardTitle`/`CardDescription` not used in tanstack card; layout may differ in typographic hierarchy | drift-fix: add `CardDescription` for entry date/mood sub-line in `entities/journal-entry/ui/journal-entry-card/` |
| **`widgets/journal-entry-detail`** | `Dialog`, `Button` | `Dialog`, `Button` | No primitive gap | waive |
| **`routes/_authed/search` (canonical: `/games/search`)** | `Input`, lazy-loaded `GameSearchResults`, `Button` | **Route does not exist in tanstack** — only a dev-only `/dev/igdb-search` stub | Entire `/search` (or `/games/search`) surface missing | port: create `routes/_authed/search.tsx` composing a `features/search-games` UI widget; wire `searchGamesFn` + debounced `Input` |
| **`features/search-games` — UI surface** | `Input`, debounced results list, `GameSearchResults` with add/view actions | `features/search-games` has only `api/search-games.ts` — no UI component | No search UI in features layer | port: add `features/search-games/ui/search-games-input/` composing `Input` + results list; or scope into new route widget |
| **`routes/_authed/settings/account`** | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `Button` (logout) | `Card` (via `SignOutCard`), `Button` — all from `@/shared/ui/*`; no settings layout/rail shell | Canonical has a sidebar settings navigation rail (`widgets/settings-rail`) with `Profile / Connected systems / Account` links; tanstack has standalone pages with an `ArrowLeft` back-link only — no persistent settings nav | drift-fix: add a settings layout with nav links (Profile / Account) — either a simple `<nav>` or port `SettingsRail`; low-cost since tanstack's settings are flat |
| **`routes/_authed/settings/profile`** | Same settings rail + `Form`, `Input`, `Label`, `Switch`, `Avatar` | `Form`, `Input`, `Label`, `Switch`, `AvatarUpload` — all ported; no settings rail | Same settings rail gap | same drift-fix as above |
| **`features/manage-account` — SignOutCard** | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `Button` | `Card/*`, `Button` — structurally equivalent | No primitive gap | waive |
| **`features/steam-connect` — SteamConnectCard** | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `Button` | `Card/*`, `Button` — structurally equivalent | No primitive gap | waive |
| **`routes/_authed/steam/games` — ImportedGamesPage** | `Alert`, `AlertTitle`, `AlertDescription`, `Button`, `EmptyState`, `Checkbox` (bulk-select, now removed) | `Alert/*`, `Button`, `EmptyState` — all ported; bulk-select retired (documented divergence) | No unresolved primitive gap; `Alert` already ported in Slice 18 | waive |
| **`widgets/imported-games-page` — filter bar** | `Input`, `Select`, `Checkbox`, `Button` | `Input`, `Select`, `Checkbox`, `Button` — all from `@/shared/ui/*` | No primitive gap | waive |
| **`features/steam-import/ui/imported-game-card`** | `Card`, `CardContent`, `Badge`, `Button`, `DropdownMenu` | `Card`, `CardContent`, `Badge`, `Button`, `DropdownMenu` — all ported | No primitive gap | waive |
| **`features/steam-import/ui/import-game-modal`** | `Dialog`, `Select`, `Button` | `Dialog`, `Select`, `Button` — all ported | No primitive gap | waive |
| **`features/steam-import/ui/igdb-manual-search`** | `Button`, `Card`, `CardContent`, `Input` | `Button`, `Card`, `CardContent`, `Input` — all ported | No primitive gap | waive |
| **`features/command-palette`** | `Command`, `CommandGroup`, `CommandInput`, `CommandList`, `Dialog`, `DialogContent`, `DialogTitle`, `DialogDescription` | Same — all from `@/shared/ui/command` and `@/shared/ui/dialog` | Functional parity; three feature gaps documented in DIVERGENCES.md (no quick-add, no recent-games, no mobile sheet variant) | drift-fix: add mobile bottom-sheet variant using `Sheet` from `@/shared/ui/sheet` (already ported Slice 18); reference canonical `MobileCommandPalette` |
| **`features/follow-user` — FollowUserButton** | `Button`, `cn` | `Button` — from `@/shared/ui/button` | No primitive gap | waive |
| **`features/unfollow-user` — UnfollowUserButton** | `Button`, `cn` | `Button` | No primitive gap | waive |
| **`widgets/profile-activity-tab`** | `Card`, `CardContent`, `Button`, `EmptyState` (activity feed items as plain `div`s) | `Button`, `EmptyState` — activity items rendered as plain `div`/`p` rows | No primitive gap; canonical activity feed items also avoid Card for individual rows | waive |
| **`features/whats-new` — WhatsNewModal** | `Dialog`, `Button`, `Badge` | `Dialog`, `Button`, `Badge` — all from `@/shared/ui/*` | Canonical has multi-step Next/Dismiss-all pagination (documented divergence — tanstack shows one announcement with single "Got it") | waive — divergence documented in DIVERGENCES.md Slice 20 |
| **`features/onboarding-first-time`** | `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger`, `Button` | `Card` only — no `Collapsible` usage; checklist is flat `<ul>` with hand-rolled expand-icon button | Missing `Collapsible` primitive for the canonical accordion-collapse pattern on the onboarding card | drift-fix: `Collapsible` is already ported (Slice 18); wrap the onboarding card header in `Collapsible`/`CollapsibleTrigger`/`CollapsibleContent` to match canonical's expand/collapse UX |
| **`features/toggle-theme` — ThemeToggle** | Canonical: hand-rolled `<div role="menu">` popover with button trigger | Tanstack: `DropdownMenu` / `DropdownMenuContent` / `DropdownMenuItem` from `@/shared/ui/dropdown-menu` | Tanstack upgraded to `DropdownMenu` (improvement over canonical's hand-rolled popover) | waive — tanstack is superior; document as intentional upgrade in DIVERGENCES.md |
| **`widgets/user-list`** | Canonical: `features/social/ui/{followers-list,following-list,user-list-item}` with plain `div`/`Avatar`/`Button` | `widgets/user-list/ui/user-list/` — `Avatar`, `AvatarFallback`, `AvatarImage`, `Button` from `@/shared/ui/*` | No primitive gap; tanstack collapsed the three-file split into one widget (documented divergence Slice 20) | waive |
| **`widgets/profile-overview` — profile page** | Canonical: `SegmentedControl` for tab nav (`profile-tab-nav.tsx`); `Tabs` for sub-content | Tanstack: `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` from `@/shared/ui/tabs` | Canonical uses `SegmentedControl` (Radix Tabs-based custom wrapper) for the profile tab nav row; tanstack uses standard Radix `Tabs` — visually different affordance (segmented pill vs standard underline tab strip) | drift-fix: `SegmentedControl` is a canonical primitive built on `@radix-ui/react-tabs` (same dep); port `SegmentedControl` into `src/shared/ui/segmented-control.tsx` and swap the profile `TabsList` to it; OR waive and document |
| **`widgets/game-detail` — library status switcher** | `SegmentedControl`, `SegmentedControlItem` (5 pills) + `RatingInput` + `DropdownMenu` overflow | Hand-rolled `<button role="radio">` pills + `RatingInput` + `DropdownMenu` — `library-status-switcher.tsx:124–141` | Status pills use hand-rolled buttons instead of `SegmentedControl`; visual shape is similar but lacks the Radix-tabbed focus management and keyboard arrow-key navigation | drift-fix: once `SegmentedControl` is ported, replace hand-rolled pills in `library-status-switcher.tsx:121–143` |
| **`routes/u.$username` — public profile** | Full profile shell via `profile-tab-nav.tsx` + tabbed route groups | `routes/u.$username.tsx` → `ProfileOverview` widget with Radix `Tabs` | Functional parity with intent; `Tabs` vs `SegmentedControl` is the primary visual difference | same as ProfileOverview row above |

---

## Section 3 — Primitives to Port

Final list from the gap matrix. `Command` and `Tabs` are already in `src/shared/ui/` — they do NOT need porting.

| primitive | surfaces that consume it | canonical Radix dep | action |
|---|---|---|---|
| **`Textarea`** | `features/compose-journal-entry`, `features/edit-journal-entry` | none (styled `<textarea>` wrapper, no Radix) | **Port.** Add `src/shared/ui/textarea.tsx` mirroring `savepoint-app/shared/components/ui/textarea.tsx`. Pin at exact version already in workspace. Swap hand-rolled `<textarea>` in both dialog files. |
| **`SegmentedControl`** | `widgets/game-detail/ui/library-status-switcher`, `widgets/profile-overview` (tab nav style), `routes/u.$username` | `@radix-ui/react-tabs` (already installed — `tabs.tsx` uses it) | **Port.** Add `src/shared/ui/segmented-control.tsx` from `savepoint-app/shared/components/ui/segmented-control.tsx`. No new Radix dep. Use to replace pill buttons in `library-status-switcher.tsx` and optionally to restyle profile `TabsList`. |
| **`RadioGroup`** | Not used in canonical or tanstack for in-scope surfaces | `@radix-ui/react-radio-group` | **Waive.** No in-scope surface in either app uses `RadioGroup`. The spec flagged it as "likely" but code evidence does not support that. Do not port speculatively. |

**Already ported (no action needed):** `Command`, `Tabs`, `Alert`, `Collapsible` (Slice 18), `EmptyState`, `Badge`, `DropdownMenu`, `Dialog`, `Select`, `Sheet`, `Popover`, `RatingInput`, `ScrollArea`, `Checkbox`, `Separator`, `Tooltip`, `Sonner`, `UndoToast`.

---

## Section 4 — Tailwind Tokens Delta

**No new design tokens required.** All S15–S21 surfaces use only the tokens already declared in the `@theme inline` block in `src/styles.css` (lines 678–758): `--color-*`, `--radius-*`, `--font-*`, status-color tokens (`--color-status-{wishlist,shelf,upNext,playing,played}`), and the spacing scale.

The only arbitrary Tailwind values found in S15–S21 surfaces are:
- `min-h-[140px]` in `compose-journal-entry-dialog.tsx:22` and `edit-journal-entry-dialog.tsx:21` — these become unnecessary once the `Textarea` primitive is ported (it ships with `min-h-[80px]` via the canonical wrapper).
- `max-h-[400px]` in `command-palette.tsx:76` — intentional constraint; waive.
- `sm:max-w-[480px]` in `import-game-modal.tsx:3` — responsive width override; waive.

**Verdict: adopt 14A token set as-is.** No `@theme` changes needed for Slice 22.

---

## Section 5 — Mobile (<768px) Parity Gap

The 2026-05-18 audit could not capture tanstack mobile due to a chrome-mcp resize bug. This section audits responsive behavior via code-read only.

### What canonical does at 375px

1. **Navigation:** left sidebar hidden, bottom tab nav shown (`Library / Journal / Profile`), sticky top bar with logo + search icon + theme icon.
2. **Library filters:** status/platform/sort sidebar collapses behind a `Filters` drawer button; filter input becomes full-width.
3. **Library cards:** cards re-arrange to horizontal-row variant (small cover left, metadata right).
4. **Settings:** settings navigation rail stacks vertically below the heading.

### Tanstack current state

| behavior | tanstack implementation | gap |
|---|---|---|
| Bottom tab nav at `<768px` | `widgets/app-bottom-nav/ui/app-bottom-nav/app-bottom-nav.tsx` with `md:hidden` — **present** | None |
| Sidebar hidden at `<768px` | `widgets/app-sidebar/ui/app-sidebar.tsx` — sidebar is `hidden md:flex` per `app-shell.tsx` — **present** | None |
| Mobile topbar | `widgets/app-mobile-topbar/ui/app-mobile-topbar.tsx` — **present** with logo + search-open + theme toggle icons | None |
| Library filters collapse | `features/filter-library/ui/mobile-filter-bar/mobile-filter-bar.tsx` — **present**; renders behind a "Filters" button that opens the filter controls | None |
| Library card horizontal row | `widgets/library-item-card/ui/library-item-card/library-item-card.tsx` — check responsive flex direction | **Spot-check needed**: code has a two-column grid at desktop; need to verify `sm:flex-row` or equivalent variant for mobile |
| Settings nav at mobile | No settings rail at all (flat pages with back-link) — applies at both viewports | **Gap**: no persistent settings nav; same at all viewports. Low severity — tanstack's flat settings still navigable via back-link. |
| Command palette mobile | Desktop `Dialog` shown at all viewports; no `Sheet` variant | **Gap**: needs mobile bottom-sheet variant using already-ported `Sheet` primitive (DIVERGENCES.md Slice 17 item 3) |

**Primary mobile gaps to fix in Slice 22:**
- Library-item card: verify/add horizontal-row responsive variant (`flex-row` at `sm:` or `<md`).
- Command palette: add `Sheet`-based mobile variant (already ported primitive, just needs the component split).

---

## Section 6 — Recommended Task Ordering

1. **Port `Textarea` first** (30 min). Unblocks compose-journal-entry and edit-journal-entry drift fixes. No new Radix dep. Single file.

2. **Drift-fix journal dialogs** (compose + edit — swap hand-rolled `<textarea>` with `Textarea`). Colocated test updates. Quick.

3. **Port `SegmentedControl`** (1 hr). No new Radix dep (same `@radix-ui/react-tabs` already installed). Unblocks both game-detail status-switcher and profile tab-nav style fixes.

4. **Drift-fix `library-status-switcher`** — replace hand-rolled pill buttons with `SegmentedControl`. Keyboard nav and focus ring come for free. Tests need updating (Radix-aware action helpers per 14A pattern).

5. **Add settings navigation rail** — thin `<nav>` with links to Profile + Account settings (port or hand-roll from canonical `SettingsRail`). Low-cost; fixes the missing persistent settings navigation at all viewports.

6. **Add `/search` route + search-games UI** — create `routes/_authed/search.tsx` + `features/search-games/ui/search-games-input/` composing `Input` + results. This is the only entirely missing route in scope.

7. **Command palette mobile `Sheet` variant** — split `CommandPalette` into desktop-dialog / mobile-sheet variants using already-ported `Sheet`. Wire via `useMediaQuery` or a CSS-hidden approach.

8. **Drift-fix onboarding `Collapsible`** — wrap checklist card in `Collapsible`/`CollapsibleTrigger`/`CollapsibleContent` (primitive already ported).

9. **Library-item card mobile variant** — verify/add `flex-row` at `<md` breakpoint.

10. **Visual diff sweep** — walk all surfaces side-by-side at desktop + mobile; confirm copy, spacing, hover/focus states, transitions match; document any remaining intentional divergences in DIVERGENCES.md.

**Parallel-safe:** steps 1–2, 5, 6 can run in parallel. Steps 3–4 depend on each other but are independent of 5–6. Step 7 is independent. Step 8 is independent. Step 10 is the gate.

---

## Open Questions for Next Agent

1. **Profile tab nav visual treatment decision**: should `widgets/profile-overview` `TabsList` be swapped to `SegmentedControl` for a segmented-pill look (matching canonical's `SegmentedControl`-based nav), or is the current underline `Tabs` intentionally divergent? If waived, add a DIVERGENCES.md entry.

2. **`/search` route scope**: canonical's search is at `/games/search` (within the games layout); the spec scope lists `routes/_authed/search`. Confirm the correct URL (`/search` vs `/games/search`) before creating the route file.

3. **Game-detail tabs (4 vs 3)**: the spec says align to canonical `Overview / Journal {count} / Playtime` but tanstack currently has `Overview / Journal / Times to beat / Related`. The "Times to beat" tab content already exists as a slot; "Related" is infinite-scroll. Decision needed: collapse "Times to beat" into "Playtime" (rename), fold "Related" into Overview, or document as intentional? This is a product-intent question, not a code question.
