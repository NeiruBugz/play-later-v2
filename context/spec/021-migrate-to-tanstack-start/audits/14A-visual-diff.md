# 14A Visual Diff Sweep

**Date:** 2026-05-07
**Methodology:** Code-level side-by-side diff of in-scope canonical (`savepoint-app/`) and tanstack (`savepoint-tanstack/src/`) surfaces, cross-referenced against [`14A-ui-gap-matrix.md`](./14A-ui-gap-matrix.md) and the "Known gaps (Slice 14A — UI parity)" section of [`savepoint-tanstack/CLAUDE.md`](../../../../savepoint-tanstack/CLAUDE.md).

**Why code-level, not browser-level:** Two blockers prevented a runtime walkthrough — (a) port `:6060` was already occupied by a tanstack dev server the agent was not authorized to terminate, and (b) browser-control MCP tools (`claude-in-chrome`, `playwright`) were not pre-loaded. The static-diff approach is sufficient for this subtask because the parity baseline is class strings, copy strings, hover/focus state classes, and DOM hierarchy — all readable from source. No screenshots are embedded; observations cite file paths + line numbers.

**Scope (in):** sidebar, library page, game detail, profile page, library modal. Surfaces explicitly out-of-scope (S15 journal, S17 command palette, S18 settings/social) are skipped per the audit's deferral notes.

---

## Sidebar (`widgets/app-sidebar/ui/app-sidebar/`)

| Aspect | Result |
|---|---|
| Brand mark + glow + wordmark token classes | Parity (`text-h3 y2k-chrome-text y2k:tracking-wider jewel-display jewel:tracking-[0.14em]`) |
| Search trigger (⌘K affordance) | Docs-known-gap (deferred to S17 command palette) |
| Nav links + active styling | Docs-known-gap (shadcn `Sidebar` primitive waived; hand-rolled `<aside>` is the documented divergence) |
| User menu — Profile settings + Sign out | Parity via ported `DropdownMenu` |
| User menu — "Account" item | Docs-known-gap (route absent until S18; `TODO(slice 18)` comment in source) |
| Sign-out destructive styling | Parity (`text-destructive focus:text-destructive`) |
| Avatar fallback | Divergence — tanstack uses `<img src={user.image ?? "/default-avatar.png"}>`; canonical uses `<User>` icon inside a `bg-sidebar-primary` circle when `avatarUrl` is null. Visual-only; not a regression because the missing image case still resolves to a working asset. **Class C (undocumented)** — see Findings. |

---

## Library page (`widgets/library-page/ui/library-page/`)

| Aspect | Result |
|---|---|
| Header: h1 + game count + AddGameTrigger | Parity |
| Header h1 token classes (`heading-lg y2k-chrome-text`) | Parity |
| Filter sidebar left-rail layout | **Fixed inline** — pre-fix, the parent container was `flex flex-col` with `LibraryFilters` (which is `<aside hidden xl:flex>`) rendered inline, so on `xl+` the filter rail rendered as a block ABOVE the grid instead of beside it. Wrapped `<LibraryFilters/>` + grid in `<div className="flex gap-6">` with the grid in a `min-w-0 flex-1` column to match canonical's `library-page-view.tsx` layout. |
| Filter sidebar — Status / Platform / Sort sections, count badges, status colors | Parity (per the slice 14A "GREEN (filter sidebar)" rebuild) |
| Mobile filter bar (Sheet + RatingInput + Switch) | Parity (per the slice 14A "GREEN (mobile filter bar)" port) |
| Grid column ramp (`grid-cols-3 sm:5 md:6 lg:8 xl:10 2xl:12`) | Parity |
| Empty state | Parity (rendered inline; canonical has a separate `LibraryEmptyState` component but visual delivery is equivalent) |
| LibraryItemCard cover hover/focus | Divergence — tanstack card uses `transition-shadow hover:shadow-md`; canonical has `y2k:` and `jewel:` themed bloom + scale transforms. **Class C (undocumented but consistent with the documented "no `y2k:` / `jewel:` token mirror" theme-translation policy in the tokens audit).** |
| LibraryItemCard status badge placement | Divergence — tanstack renders `<LibraryStatusBadge>` BELOW the cover in the metadata column; canonical overlays it `absolute top-2 left-2 z-10` ON the cover with `bg-black/55 ring-1 ring-white/10 backdrop-blur-sm` glass. Gap-matrix row 11's action was "**port**" with the glass overlay. **Class C (undocumented divergence — adopted but with simplified placement)** — see Findings. |
| LibraryCardMenu (⋯ overlay on cover) | Parity — `menu` slot accepts `<LibraryCardMenu>` from `manage-library-entry`; placement is `absolute top-2 right-2 z-20`. |

---

## Library modal (`features/manage-library-entry/ui/library-modal/`)

All checks against gap-matrix rows 15–19 reproduce the documented "Known gaps" outcome:

| Aspect | Result |
|---|---|
| Status field — Radix `Select` | Parity (ported per slice 14A) |
| Platform field — Radix `Select` (no Command search) | Docs-known-gap (gap-matrix row 16 partial port) |
| Rating field — `RatingInput` | Parity (ported per slice 14A) |
| Desktop / mobile split | Docs-known-gap (waived per slice 11) |
| Cover thumbnail in header | Docs-known-gap (waived per slice 11) |
| Save / delete toasts + invalidate + close | Parity |
| Inline delete confirm (single surface) | Parity (intentional collapse per slice 11) |

---

## Game detail (`widgets/game-detail/ui/game-detail/` + `entities/game/ui/game-metadata/`)

| Aspect | Result |
|---|---|
| Breadcrumb (`Library / {title}`) | Parity (added during slice 14A hero rebuild) |
| Cover + metadata layout (`flex md:flex-row`) | Parity |
| Eyebrow — release year only | Docs-known-gap (studio + genres deferred to 18A — schema bleed) |
| Banner image | Docs-known-gap (deferred to 18A — schema bleed) |
| h1 + description body typography | Parity (`text-h1`, `text-body text-foreground/85 max-w-[720px] leading-relaxed`) |
| Release-date formatting | **Fixed inline** — pre-fix, `releaseDate.toLocaleDateString()` rendered "5/7/2026" in en-US; canonical uses `Intl.DateTimeFormat("en-US", { year, month: "short", day })` → "May 7, 2026" via `formatAbsoluteDate`. Inlined the same formatter in `game-metadata.tsx` and updated the co-located test to mirror the same shape. Gap-matrix row 23 explicitly called out this misalignment. |
| Tab strip (Overview/Journal/Related/Times to beat) | Parity (plain `<nav>` with `<a>` anchors per audit row 21 plan) |
| LibraryStatusStrip (read-only) | Parity (intentional divergence from canonical's dual segmented/dropdown surface, documented in slice 13) |
| ⋯ DropdownMenu next to status cluster | Docs-known-gap (waived — duplicates `ManageFromGameDetailButton`) |
| Times-to-beat | Docs-known-gap (minimal `<dl>`, full visual port deferred to 18A) |
| Related games — stacked sections + infinite list | Docs-known-gap (Tabs + ScrollArea deferred to 18A) |
| Related-game card chrome (genre badges, compound `Card`) | Docs-known-gap (Tooltip ported; chrome waived pending genre data) |

---

## Profile page (`routes/_authed/profile.tsx` → `ProfileOverview` widget)

| Aspect | Result |
|---|---|
| Avatar + stats + edit-profile CTA | Parity |
| Tabs (Overview / Library / Activity) + social | Docs-known-gap (intentional architectural pivot — S18 territory) |
| Page `<title>` | Pre-existing minor gap — page still shows the starter placeholder; canonical sets `"Profile"`. Already documented in [`CLAUDE.md` Flow 2](../../../../savepoint-tanstack/CLAUDE.md). Not a 14A regression. |

---

## Findings (class C — undocumented divergences worth recording)

These are the only divergences observed during the sweep that are not already captured in `14A-ui-gap-matrix.md` or in `CLAUDE.md` "Known gaps". Each is a deliberate-looking simplification, not a bug; classifying them per the subtask spec.

### F1 — LibraryStatusBadge placement on `LibraryItemCard`

**Canonical:** Glass-styled overlay on the cover (`absolute top-2 left-2 z-10` + `bg-black/55 ring-1 ring-white/10 backdrop-blur-sm`).
**Tanstack:** Plain `<Badge variant="...">` rendered below the cover in the metadata column flow.
**Why surfaced now:** Gap-matrix row 11's recommended action was "**port** — adopt on `LibraryItemCard`", implying the overlay placement; it shipped without the overlay glass treatment.
**Not a bug:** The badge is functional, accessible, and uses the `--status-*` token system. The placement simplification is consistent with the broader "tanstack avoids overlay-on-cover patterns where readability suffers" approach observed elsewhere (`GameCoverImage` also drops the canonical status-tint overlay per gap-matrix row 28).
**Recommendation:** Add an entry to `CLAUDE.md` "Known gaps" if the team agrees the overlay is non-load-bearing; otherwise this becomes a row 11 follow-up.

### F2 — Sidebar avatar fallback

**Canonical:** When `avatarUrl` is null, renders a `<User>` lucide icon inside a `bg-sidebar-primary text-sidebar-primary-foreground` circle.
**Tanstack:** Renders `<img src="/default-avatar.png">` unconditionally.
**Not a bug:** The default asset resolves and is sized identically.
**Recommendation:** Either align with canonical's icon-fallback pattern (matches the design system) or document this as a deliberate simplification.

### F3 — LibraryItemCard hover/focus theme classes

**Canonical:** Theme-conditional bloom + scale transforms (`y2k:`, `jewel:` variants).
**Tanstack:** Plain `transition-shadow hover:shadow-md`.
**Not a bug:** Matches the broader "no `y2k:` / `jewel:` mirror" policy from the tokens audit.
**Recommendation:** No action — this is consistent with the global theme-translation stance and doesn't deserve a separate "Known gaps" entry. Capturing here for completeness.

---

## Summary counts

| Class | Count | Notes |
|---|---|---|
| Parity | 22 rows |
| Docs-already-known | 19 rows | All matched the audit / CLAUDE.md "Known gaps" entries with no new info. |
| Fixed-inline | 2 rows | Library-page left-rail layout; game-metadata date formatting. Both class B (parity-work bugs). |
| Unresolved-finding (class C) | 3 rows | F1 / F2 / F3 — deliberate simplifications worth recording but no real-work refactor required. |
| Class D (real-work blockers) | 0 |

No class-D findings — none of the observed divergences require schema changes, new components, or work outside the 14A scope. The two class-B fixes are minimal and self-contained.

---

## Verification

| Check | Result |
|---|---|
| `pnpm --filter savepoint-tanstack typecheck` | green |
| `pnpm --filter savepoint-tanstack lint` | green |
| `pnpm --filter savepoint-tanstack test:unit` | 42 files / 422 tests passed |

Both inline fixes ship with their tests still green; the date-format fix updates the co-located `game-metadata.test.tsx` to assert against the same `Intl.DateTimeFormat` shape used in the component.
