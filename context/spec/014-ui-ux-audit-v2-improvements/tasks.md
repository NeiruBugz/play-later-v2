# Tasks: UI/UX Audit V2 — Round 2 Improvements

- **Functional Spec:** [`functional-spec.md`](./functional-spec.md)
- **Technical Spec:** [`technical-considerations.md`](./technical-considerations.md)
- **Branch:** `refactor/ui-ux-audit-v2` (current)

Each slice leaves the app in a runnable state. Slices are ordered so the global shell lands before the page reworks that sit inside it. Type-scale aliases ship first (additive, zero behavior change) so subsequent slices can adopt the semantic names as they touch each page.

---

## Slice 0 — Type Scale: Semantic Aliases (additive, no UI change) ✅

Foundation slice. Adds the semantic utilities; existing pages keep working untouched.

- [x] Add `.text-display`, `.text-h1`, `.text-h2`, `.text-h3`, `.text-body`, `.text-caption` utilities in `savepoint-app/shared/globals.css`, composing the existing CSS variables per the canonical mapping (`display-lg` / `heading-xl` / `heading-lg` / `heading-md` / `body-md` / `caption`). Existing utilities remain in place. **[Agent: react-frontend]**
- [x] Create `savepoint-app/shared/lib/typescale/typescale.md` — role rules per stop, mapping table, examples. **[Agent: react-frontend]**
- [x] Add a smoke fixture page (or temporary playground route, gated to dev) that renders one of each new utility next to its legacy equivalent — verify identical computed `font-size`, `line-height`, `letter-spacing` via Playwright `page.evaluate`. Remove the fixture before slice close (or leave under a dev-only flag). **[Agent: typescript-test-expert]** _(implemented as Vitest CSS-source-parity test instead of Playwright fixture)_
- [x] Verify: `pnpm --filter savepoint dev`; no visual regression on Library / Dashboard. Run `pnpm --filter savepoint ci:check`. **[Agent: testing]**

---

## Slice 1 — Settings Route Restructure ✅ (`/settings/[section]`)

Smallest user-visible slice that exercises a real page move. After this, `/settings/profile` works and `/profile/settings` redirects.

- [x] Create `app/(protected)/settings/layout.tsx` with a placeholder rail (no styling polish yet — single column is fine). **[Agent: nextjs-expert]**
- [x] Create `app/(protected)/settings/page.tsx` that `redirect()`s to `/settings/profile`. **[Agent: nextjs-expert]**
- [x] Create `app/(protected)/settings/profile/page.tsx` and migrate the avatar / username form from `app/(protected)/profile/settings/page.tsx` unchanged. **[Agent: nextjs-expert]**
- [x] Create `app/(protected)/settings/account/page.tsx` containing a Logout button wired to the existing signout flow. (Account section's expanded contents land later as needed.) **[Agent: nextjs-expert]**
- [x] Replace `app/(protected)/profile/settings/page.tsx` with a `redirect("/settings/profile")` (preserve the deep link for one release). **[Agent: nextjs-expert]**
- [x] Update any internal link to `/profile/settings` → `/settings/profile` (rg-driven sweep). **[Agent: nextjs-expert]**
- [x] Verify: navigate to `/settings`, `/profile/settings`, `/settings/profile`, `/settings/account`. Save profile changes. Logout from Account. **[Agent: testing]**

---

## Slice 2 — Desktop Left Rail ✅ (replaces top-bar nav for `md+`)

Replaces the desktop navigation shell. Mobile nav stays at 6 tabs in this slice; we only touch desktop. App remains runnable on mobile throughout.

- [x] Install shadcn `Sidebar` block: `pnpm dlx shadcn add sidebar`. Verify generated primitives land under `shared/components/ui/`. **[Agent: react-frontend]**
- [x] Create `widgets/sidebar/` with `ui/sidebar.tsx`, `ui/sidebar-search-trigger.tsx`, `ui/sidebar-user-menu.tsx`, `index.ts` barrel. Render brand, nav (Library / Journal / Timeline / Profile / Settings), search-icon button, user menu (Settings link + Logout). Use the new `text-*` semantic utilities. **[Agent: react-architect]**
- [x] Add a `widgets/sidebar/CLAUDE.md` describing structure and import rules (FSD pattern). **[Agent: react-architect]**
- [x] Update `features/CLAUDE.md` cross-feature import registry to authorize `command-palette` for `widgets/sidebar/`. **[Agent: react-frontend]**
- [x] Modify `app/(protected)/layout.tsx`: on `md+` switch to a grid (`[sidebar][main]`); on `<md` keep current `<Header>` + `<MobileNav>` for now. Mount `<CommandPaletteProvider>` once at the top. **[Agent: nextjs-expert]**
- [x] Modify `app/games/layout.tsx` to mirror the same shell (extract a shared `AuthenticatedShell` if duplication grows). **[Agent: nextjs-expert]**
- [x] Reduce `widgets/header/ui/header.tsx` to unauth scope: keep brand + theme toggle for marketing/login routes; remove the 5 nav links and the `+ Add Game` button. Update the test. **[Agent: react-frontend]**
- [x] Verify on desktop ≥ 1024px: rail is sticky, every authenticated route renders it, search-icon opens palette, ⌘K still opens palette, every NAV target reachable, `aria-current` correct. Verify themes (`y2k`, `jewel`) on each page. **[Agent: testing]**

---

## Slice 3 — Mobile Top App Bar ✅ + 4-Tab Nav

Drops mobile bottom nav to 4 tabs and adds the search-icon top bar on mobile. After this, search has a single anchor on every breakpoint.

- [x] Create `widgets/mobile-topbar/ui/mobile-topbar.tsx` and `index.ts`. Sticky top within `<main>`; renders brand + search-icon button calling `useCommandPaletteContext().open()`. Mobile-only (`md:hidden`). **[Agent: react-frontend]**
- [x] Create `widgets/mobile-nav/ui/mobile-nav.tsx` and `index.ts`. Reduce to 4 tabs: Library, Journal, Timeline, Profile. Drop Search and Dashboard from the bar. Preserve 44pt hit targets, `safe-area-inset-bottom`, theme classes. **[Agent: react-frontend]**
- [x] Update `app/(protected)/layout.tsx` and `app/games/layout.tsx` to render `<MobileTopbar>` and the new `<MobileNav>` instead of `<Header>` + old `MobileNav` on `<md`. **[Agent: nextjs-expert]**
- [x] Delete `widgets/header/ui/mobile-nav.tsx` (replaced by `widgets/mobile-nav`). Update the widget's barrel and any imports. **[Agent: react-frontend]**
- [x] Update `features/CLAUDE.md` to authorize `command-palette` for `widgets/mobile-topbar/`. **[Agent: react-frontend]**
- [x] Verify on mobile (Chrome DevTools 360–640px): bottom bar has 4 tabs, top bar has search-icon, palette opens via icon and ⌘K, no horizontal scroll, themes intact. **[Agent: testing]**

---

## Slice 4 — Command Palette Hardening ✅ (Games / Navigation / Quick actions)

The palette already exists; this slice formalizes the three result groups, ensures a single global ⌘K binding, and points the dashboard's `Add Game` CTA at the same provider.

- [x] Refactor `features/command-palette/ui/desktop-command-palette.tsx` and `mobile-command-palette.tsx` to render three labeled groups: **Games** (existing), **Navigation** (Library / Journal / Timeline / Profile / Settings / Dashboard), **Quick actions** (Add game to library; New journal entry; Log session — last two only when reachable). **[Agent: react-frontend]**
- [x] Confirm `features/command-palette/hooks/use-command-palette.ts` mounts a single global ⌘K / Ctrl+K listener at the provider; ensure no other surface rebinds ⌘K. Add a comment-free reservation in the hook's tests. **[Agent: typescript-test-expert]**
- [x] Wire the dashboard "Add Game" CTA (and any remaining `+ Add Game` callsites) to `useCommandPaletteContext().open()`. **[Agent: react-frontend]**
- [x] Update `features/command-palette/CLAUDE.md` to reflect the single search/quick-add surface. **[Agent: react-frontend]**
- [x] Verify: open palette from rail icon, mobile topbar icon, ⌘K, dashboard CTA. Add a game from a Games result; observe undo toast (spec 012 §2.11 path); navigate to Library via a Navigation result; close with Esc — focus returns. **[Agent: testing]**

---

## Slice 5 — Game Detail ✅: Unified Hero + Inline Segmented Status

Vertical slice on `app/games/[slug]/page.tsx`. After this, status changes do not open a modal.

- [x] Create `shared/components/ui/segmented-control.tsx` (built on Radix tabs primitives). Supports horizontal-scroll mode with snap points + fading edge for narrow viewports. **[Agent: react-architect]**
- [x] Add `LIBRARY_STATUS_INLINE_VARIANT` flag (env or `shared/config/`) defaulting to `"segmented"`. **[Agent: nextjs-expert]**
- [x] Create `features/game-detail/ui/library-status-segmented.tsx` — wraps `<SegmentedControl>`, dispatches existing status mutation optimistically. **[Agent: react-frontend]**
- [x] Create `features/game-detail/ui/library-status-dropdown-pill.tsx` (fallback). One-line swap by flag. **[Agent: react-frontend]**
- [x] Create `features/game-detail/ui/game-detail-hero.tsx` — cover + title (`text-display` or `text-h1`) + status + inline rating (reuse `library-rating-control.tsx`). Remove the standalone "Library Status" sidebar/card. Move Notes / secondary actions behind a `⋯` `dropdown-menu`. **[Agent: react-architect]**
- [x] Refactor `app/games/[slug]/page.tsx` to render `<GameDetailHero>` first; banner becomes a thin decorative gradient inside the hero (mobile shrinks it, cover overlaps). Single `<h1>` invariant on the page. **[Agent: nextjs-expert]**
- [x] Update / remove `features/game-detail/ui/library-status-display.tsx`. Update its tests. **[Agent: typescript-test-expert]**
- [x] Verify on desktop and mobile: title is the page subject, no modal opens for status or rating, segmented row scrolls on narrow viewports with visible affordance, fallback flag swaps to dropdown pill cleanly. **[Agent: testing]**

---

## Slice 6 — Journal Entry Detail ✅: Editorial Reading View

- [x] Create `features/journal/lib/derive-entry-title.ts` — pure utility per the rules in tech spec §2.5. Unit test fallback chain. **[Agent: typescript-test-expert]**
- [x] Refactor `features/journal/ui/journal-entry-detail.tsx`: remove "Game" / "Entry" card headings; entry title (auto-derived when persisted is empty) is the page `<h1>` in `text-h1` / `text-display`; mood eyebrow in `text-caption` above; metadata line below in `text-caption`; body in `text-body`. **[Agent: react-architect]**
- [x] Move Edit primary action inline; Delete moves into a `⋯` `dropdown-menu`. Reuse existing `delete-entry-dialog.tsx` for confirmation. No adjacent peer Delete button anywhere on the page. **[Agent: react-frontend]**
- [x] Verify: open an entry without a persisted title — see auto-derived title; open one with a title — see persisted title; Delete requires confirmation; Edit still works. **[Agent: testing]**

---

## Slice 7 — Journal List Grouped ✅ by Game + Chip Polish

Slice 7 closes both 2.6 and 2.11 because they touch overlapping files (`journal-timeline.tsx`, `journal-entry-card.tsx`).

- [x] Refactor `features/journal/ui/journal-timeline.tsx`: group entries by `gameId` after fetch. Group order = most-recent-entry desc; in-group order = `createdAt` desc. Group header shows cover, title, count. Empty state preserved. **[Agent: react-architect]**
- [x] Refactor `features/journal/ui/journal-entry-card.tsx`: mood as eyebrow above title (uppercase, color-tinted, `text-caption`); tags as outlined chips below body, no leading `#`. **[Agent: react-frontend]**
- [x] (Optional) Add `shared/components/ui/chip.tsx` for the outlined chip primitive if it's reused; otherwise inline-style and skip. **[Agent: react-frontend]**
- [x] Verify: populated timeline groups by game with counts; empty state unchanged; mood + tags read distinctly; tag taps still trigger any existing filter behavior. **[Agent: testing]**

---

## Slice 8 — Profile Header ✅ (Banner + Overlap) + Segmented Sub-Tabs ✅

- [x] Refactor / replace `features/profile/ui/profile-header.tsx`: banner area (image if present, deterministic gradient otherwise — no schema change), avatar overlap, single inline metadata row, exactly one primary action (Edit Profile owner / Follow visitor — reuse spec 008 follow control). Remove Logout. Remove email rendering. **[Agent: react-architect]**
- [x] Tighten the public-profile DTO so `email` is never serialized regardless of visibility toggle (verify `data-access-layer/services/profile-service.ts` or equivalent; add an integration test asserting public profile responses do not contain `email`). **[Agent: nextjs-expert]**
- [x] Refactor `features/profile/ui/profile-tab-nav.tsx` from underline tabs to segmented control (reuse `<SegmentedControl>` from Slice 5). Preserve props and routing semantics so `app/u/[username]/(tabs)/layout.tsx` doesn't change. Update the existing `profile-tab-nav.test.tsx`. **[Agent: typescript-test-expert]**
- [x] Verify on desktop and mobile: profile header shows the right primary action for owner vs visitor; no Logout, no email; sub-tabs render as segmented and don't visually clash with any underline tab bar. **[Agent: testing]**

---

## Slice 9 — Auth ✅ Minimal Editorial

- [x] Refactor `features/auth/ui/auth-page-view.tsx` to a quiet editorial layout: typographic mark, optional short copy specific to journaling, auth controls. Remove the literal "Manage your gaming experiences" copy. **[Agent: react-architect]**
- [x] Verify Google OAuth and email/password controls still function. Layout works at 360px and 1440px. **[Agent: testing]**

---

## Slice 10 — Settings Shell Polish ✅ (left-rail look)

Slice 1 already restructured the route. This slice gives the layout its proper rail look (nested under the global rail on desktop; sectioned list on mobile) and reserves the Danger Zone slot.

- [x] Create `features/profile/ui/settings-rail.tsx` — section list component used by `app/(protected)/settings/layout.tsx`. **[Agent: react-architect]**
- [x] Update `app/(protected)/settings/layout.tsx`: desktop renders the settings rail to the left of the section content (nested visually inside the global rail); mobile renders a sectioned list that pushes into sub-pages. Reserve a "Danger zone" slot at the bottom of Account. **[Agent: nextjs-expert]**
- [x] Verify: switch sections on desktop and mobile; deep links to `/settings/profile` and `/settings/account` work; `/profile/settings` still redirects. **[Agent: testing]**

---

## Slice 11 — Type-Scale Adoption ✅ + Scoped Lint Rule

After every page is reworked, sweep them onto the semantic names and lock the door behind us.

- [x] Sweep every file touched by Slices 1–10 onto `text-*` semantic utilities — replace stray `text-[NNpx]` literals and legacy `heading-*` / `body-*` callsites. Single `<h1>` per touched page (assert in tests). **[Agent: react-frontend]**
- [x] Add an ESLint rule (extend the existing custom plugin or use a regex via `no-restricted-syntax`) banning `text-[NNpx]` literals and the legacy `heading-*` / `body-*` utilities **only inside files touched by this spec** (scoped via `overrides`). Out-of-scope files remain untouched. **[Agent: nextjs-expert]**
- [x] Verify: `pnpm --filter savepoint lint` clean. Snapshot sweep confirms zero off-scale literals in scope. **[Agent: testing]**

---

## Slice 12 — Cross-Cutting Cleanup ✅, Themes, E2E Sweep

Last slice. Validates the entire stack end-to-end across both themes and both platforms; addresses any leftover deep links or doc updates.

- [x] Cross-feature audit: confirm every cross-feature import registered in `features/CLAUDE.md` reflects the new sidebar / mobile-topbar consumers; remove stale entries for the dropped 6-tab mobile nav. **[Agent: react-frontend]**
- [x] Update root `CLAUDE.md` and `savepoint-app/app/CLAUDE.md` if global shell or settings route paths are referenced. **[Agent: nextjs-expert]**
- [x] Theme smoke pass on every shell page under `y2k` and `jewel` themes (manual or scripted). **[Agent: testing]**
- [x] Run full CI: `pnpm --filter savepoint ci:check` (format, lint, typecheck, all test suites). **[Agent: testing]**
- [ ] Open PR off `refactor/ui-ux-audit-v2` → `main` referencing this spec directory. **[Agent: nextjs-expert]**

---

## Recommendations / Notes

| Item | Note |
|---|---|
| Slice 0 fixture | Optional. Skip if `text-*` aliases are trivially mapped via `composes-from` in CSS — but keep at least a Vitest assertion that `getComputedStyle` matches between aliases and legacy tokens. |
| Slice 2 / 3 | Themes (`y2k:`, `jewel:`) carry a lot of styling on the current `Header`. Audit theme-specific classes during extraction to `widgets/sidebar` and `widgets/mobile-topbar`. |
| Slice 5 fallback | `LIBRARY_STATUS_INLINE_VARIANT` defaults to `"segmented"`. Flip post-implementation only if usability rejects the scroll. |
| Slice 8 banner | No `User.banner` schema change in this spec. Use a deterministic gradient if absent. Custom banners are a follow-up. |
| Slice 11 lint | Scope is intentional. Whole-codebase migration of legacy text utilities is a separate follow-up tracked off the roadmap. |
| Linear sync | Skipped by user request (`/awos:tech omit linear sync`). Run `/awos:linear` later if desired. |
