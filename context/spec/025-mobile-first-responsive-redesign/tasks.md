# Tasks — 025 Mobile-First Responsive Redesign

- **Functional Specification:** [`./functional-spec.md`](./functional-spec.md)
- **Technical Considerations:** [`./technical-considerations.md`](./technical-considerations.md)
- **Design reference (visual oracle):** [`./design-reference/`](./design-reference/) — `Mobile Audit.html`, `mobile/Mobile Hi-Fi.html`, `desktop/Desktop Hi-Fi.html`

---

## Methodology (binding)

- Each slice leaves the app in a **runnable, working state**. Verify before checking off.
- Slices with testable TypeScript follow the **TDD policy** (RED tests authored failing first, then GREEN implementation, then refactor) — see `savepoint-tanstack/CLAUDE.md` → TDD policy.
- UI changes gate on a **Chrome-MCP (or Playwright-MCP) visual pass in Light + Dark, at phone (~390px) and desktop (~1440px)** against the matching `design-reference/` screen. Authed surfaces may defer the live visual pass when no session is available in the sandbox (IGDB/Twitch OAuth unreachable) — note the deferral, same posture as spec 016/023.
- Component/route tests follow the **elements / actions / given-when-then** shape and assert **user-observable behavior**, not call-envelope shape (`.claude/rules/tanstack/testing.md`).
- Respect FSD boundaries + the C2 DAL rules; mind FOOT-GUNS #1 (`.server.ts` is a client-import boundary), #2 (loader hover-preload), #8 (worker-split). **No new server functions, no new `AppError` subclasses, no DB migration** — presentation-layer only.
- **One responsive boundary: `md` (768px)** for chrome AND filters. New code uses tokens/standard utilities, not arbitrary `[…]` Tailwind values (replace flagged ones as their screens are touched).
- Coverage gate (`src/{entities,features}` ≥85% statements) bites on `filter-library`, `add-game`, `compose-journal-entry` touches — keep them at/above threshold. Most other work is in `widgets/` (ungated) but still tested.
- Commands: `pnpm --filter savepoint-tanstack {dev,typecheck,lint,format:check,test:unit,test:integration,build}`.

---

## Slice 1 — Foundations: shared `useMediaQuery`, unified `md` boundary, PWA manifest

_Unblocks every later slice; independently testable. Delivers AC GLOBAL-3 (single switch point) and AC X (installability premise)._

- [x] RED: unit test for a shared, SSR-safe `useMediaQuery` (returns a stable value on the server, updates on match-media change). **[Agent: testing]** — RED on missing module; 7 cases (match/no-match/change-both-ways/SSR-safe/useIsDesktop query).
- [x] GREEN: add `src/shared/lib/use-media-query/` (hook + barrel) with a `useIsDesktop()` = `min-width: 768px` convenience; repoint the two existing local copies (`features/command-palette/hooks/use-media-query.ts`, `widgets/game-detail/ui/library-status-switcher/use-media-query.ts`) to the shared hook and delete the duplicates. **[Agent: tanstack-fullstack]** (react-frontend agent broken by a shadcn startup command — reassigned) — 7/7 hook + 66/66 command-palette tests GREEN; both local copies deleted, `rg` confirms no missed importers; a command-palette test mock was repointed too.
- [x] GREEN: normalize the library filter responsive boundary from `xl`→`md` so nav and filters switch together — `features/filter-library/ui/mobile-filter-bar/` (`xl:hidden`→`md:hidden`) and `features/filter-library/ui/library-filters/` (`hidden xl:flex`→`hidden md:flex`). **[Agent: tanstack-fullstack]** — no other `xl:` classes in the feature.
- [x] GREEN: link the orphaned PWA manifest in `src/routes/__root.tsx` `head()` (`<link rel="manifest">` + a `theme-color` meta); correct `public/manifest.json` `theme_color`/`background_color`. **No service worker.** **[Agent: tanstack-fullstack]** — manifest linked + light/dark `theme-color` metas added. **Finding:** the existing `#f6f1e7` is NOT retired cream — it is the exact sRGB of the current light `--background` `oklch(0.96 0.014 85)`, so no manifest color change was needed; dark `#120f0c` added for the dark `theme-color`.
- [x] Gate: unit + typecheck + lint + format green; at ~800px width the library shows desktop chrome AND desktop filters (no broken middle state); browser devtools shows the manifest linked + install eligibility for the manifest. **[Agent: testing]** — typecheck/lint/format/build clean; `test:unit` 178 files / 1591 tests / 0 failures. **Live in-browser visual deferred** (no auth session in sandbox), consistent with methodology.

---

## Slice 2 — Global action host: open Log / Add from anywhere (URL-driven)

_The one new primitive. Delivers AC GLOBAL-2 / AC FLOW-1 / AC FLOW-4 reachability. Verifiable by URL before any nav button exists._

- [x] RED: component tests — given `action=log-session` in the root search, the host renders the Log flow (Sheet on mobile breakpoint, Dialog on desktop — mock `useMediaQuery`); given `action=add-game`, it renders Add; closing clears the params (router stub); no `action` → renders nothing. **[Agent: testing]** — 10 cases, RED on missing host module.
- [x] GREEN: add the root search-param contract to `src/routes/__root.tsx` `validateSearch` (Zod: `action?: "log-session" | "add-game"`, `game?: string`, both optional). **[Agent: tanstack-fullstack]** — also removed a stale `search={{ page: 1 }}` Link prop in `library-card-menu` that the new root schema rejected.
- [x] GREEN: extract the inner content of the existing flows into reusable content components so page + host share one source of truth — split `features/compose-journal-entry/ui/log-session-drawer/` and `features/add-game/ui/add-game-modal/` into a `*-content` component + a thin host wrapper. Preserve the `.server.ts` boundary (submit server fns imported from non-`.server.ts` files; foot-gun #1/#8). **[Agent: react-frontend]** — `LogSessionContent` + `AddGameContent` extracted and exported from the feature barrels; in-page drawer/modal/FAB unchanged; 1591 existing tests stayed green; `.server` boundary intact.
- [x] GREEN: build `src/widgets/global-action-host/` reading `useSearch({ from: "__root__" })`; render the right flow (mobile `Sheet side="bottom"` / desktop `Dialog`); close → `navigate` clearing `action`/`game`. Mount once in `__root.tsx` beside `CommandPalette` (gated on `user`). **[Agent: tanstack-fullstack]** — mounted; `add-game` fully functional. **DEFERRED:** the `log-session` slug→`{gameId, playthroughs}` data-loading is NOT wired yet (host passes the `game` slug to a content component that currently ignores it). It fails safe (empty `gameId` → ZodError → toast, no corruption) and is unreachable from the UI until Slice 5. **Carry-forward: Slice 5 (dashboard hero, first `&game=slug` trigger) must wire the slug→data lookup so global log-session is functional; Slice 3 owns the no-game picker.**
- [x] Gate: unit + integration (existing compose/add flows still green after extraction) + typecheck/lint green; manually visit `/dashboard?action=log-session` and `/library?action=add-game` → the correct sheet opens and closes; the existing in-page Log (game detail) and Add (library FAB) triggers still work. **[Agent: tanstack-fullstack]** — typecheck/lint/format/build clean; host 10/10; full unit suite green (a `_authed-shell` test was updated to stub the newly-mounted host, mirroring the existing CommandPalette stub). Live in-browser pass deferred (no sandbox session).

---

## Slice 3 — Bottom nav (5 slots) + topbar + sidebar parity

_Delivers AC GLOBAL-1 / GLOBAL-2 / GLOBAL-4 / GLOBAL-5 / GLOBAL-6 — the keystone navigation fix (NAV-01/02/03/04)._

- [ ] RED: tests — bottom nav renders 5 slots (Home→`/dashboard`, Library, center **Log**, Journal, Profile); the Log button navigates with `action=log-session` (router stub); the active tab exposes a filled/accented indicator + `aria-current` (not color-only); icon buttons meet the ≥44px target. Sidebar renders a Home link and a "Log a session" CTA that navigates with `action=log-session`. **[Agent: testing]**
- [ ] GREEN: rework `widgets/app-bottom-nav/` to the 5-slot model with a new `nav-log-button` raised center action (→ `?action=log-session`), filled-icon + `aria-current` active state, ≥44px targets. **[Agent: react-frontend]**
- [ ] GREEN: `widgets/app-mobile-topbar/` — bump icon buttons 36→44px; wire the search icon to `openCommandPalette()` (replace the page-nav). **[Agent: react-frontend]**
- [ ] GREEN: `widgets/app-sidebar/` — add a Home/Dashboard link (parity) and pin a "Log a session" CTA under the brand (→ `?action=log-session`); keep the status legend. Add safe-area bottom-nav spacing utility in `src/styles.css` and apply via `widgets/app-shell/`. **[Agent: react-frontend]**
- [ ] Gate: unit + typecheck/lint green; Chrome-MCP visual (phone: bottom nav with center Log + active state; desktop: sidebar Home + Log CTA) Light + Dark; tapping Log from Dashboard, Library, Journal, Profile opens the Log sheet (uses Slice 2 host). **[Agent: react-frontend]**

---

## Slice 4 — Library: 2-up shelf + sticky status lens + filters sheet + view toggle

_Delivers AC LIB-1…LIB-6._

- [ ] RED: tests — library renders a 2-up cover grid at phone width; a sticky status-lens segmented row (All + statuses with counts) re-filters in one interaction (drives the `status` search param); secondary filters live behind a Filters trigger with an active-count badge; a grid/list toggle switches presentation. **[Agent: testing]**
- [ ] GREEN: `widgets/library-page/` — default 2-up grid on phones widening to ~5-up desktop (tokenized columns, replacing the arbitrary `[repeat(auto-fill,minmax(…))]` values); add the grid/list view toggle (local UI state). **[Agent: react-frontend]**
- [ ] GREEN: `features/filter-library/` — promote status out of the sheet into an always-present **sticky `SegmentedControl` lens** with per-status counts; keep platform/rating/sort in the Filters sheet (mobile) / inline panel (desktop) with the active-count badge. **[Agent: react-frontend]**
- [ ] Gate: unit + integration (filter feature ≥85%) + typecheck/lint green; Chrome-MCP visual (phone 2-up + sticky lens that stays on scroll; desktop multi-up) Light + Dark; one-tap status switch re-filters. **[Agent: react-frontend]**

---

## Slice 5 — Dashboard: "Jump back in" hero + status strip + swipe rails

_Delivers AC DASH-1…DASH-4._

- [ ] RED: tests — dashboard leads with a "Jump back in" card for the most in-progress game whose Log button navigates with `action=log-session&game=<slug>`; status counts render as one compact strip; game rails are horizontal scroll-snap carousels on phone; desktop renders hero + continue rail side by side. **[Agent: testing]**
- [ ] GREEN: restructure `widgets/dashboard-page/` mobile-first — greeting eyebrow, jump-back-in hero, compact status strip (reuse `entities/library-item/ui/library-status-strip`), convert `dashboard-game-section` to a `scroll-snap` rail on mobile / grid on desktop; desktop pairs hero + continue and adds the library-breakdown + last-reflection cards. **[Agent: react-frontend]**
- [ ] GREEN (carry-forward from Slice 2): wire the global host's `log-session` data path — when `action=log-session&game=<slug>`, load that game's `{ gameId, playthroughs }` via the existing client-callable path and pass real props to `LogSessionContent` (it currently ignores the raw `game` slug). Remove the placeholder `game?: string` prop once real props flow. This is what makes the hero's "Log" actually functional. **[Agent: tanstack-fullstack]**
- [ ] Gate: unit + typecheck/lint green; Chrome-MCP visual (phone hero + swipe rails; desktop multi-column) Light + Dark; hero Log opens the sheet pre-targeted to the game AND a session saves against the correct game. **[Agent: react-frontend]**

---

## Slice 6 — Game detail (mobile): stacked hero, jump spine, sticky action bar

_Delivers AC GD-1…GD-4 (the phone layout; the critical "action never lost" fix)._

- [ ] RED: tests — game detail (mobile branch) renders a slim top bar with Back + More and **no breadcrumb**; a stacked hero (cover, critic ring, title on its own line); a sticky jump spine of section anchors; and a **sticky bottom action bar** with a status pill + a working Log trigger. **[Agent: testing]**
- [ ] GREEN: `widgets/game-detail/` mobile layout — stacked hero (replace `pt-[140px]`/`md:grid-cols-[1.35fr_1fr]` arbitrary values with tokenized classes), translucent Back/More top bar, status switcher row, new sub-components `game-detail-jump-spine/` + `game-detail-action-bar/` (sticky, above the tab bar; Log → host). Panels stay single-column; content unchanged (reuse existing Playthroughs/About/Themes-Tags/Journal/Screenshots/Related). **[Agent: react-frontend]**
- [ ] Gate: unit + typecheck/lint green; Chrome-MCP visual at phone width against `design-reference/mobile/` Light + Dark; scrolling to the bottom keeps the action bar + Log reachable; spine jumps between sections. (Authed visual pass may defer per methodology.) **[Agent: react-frontend]**

---

## Slice 7 — Game detail (desktop): two-column + sticky detail rail

_Delivers AC GD-5 — the desktop scale-up of Slice 6._

- [ ] RED: tests — game detail (desktop branch) renders a two-column split with a **sticky right rail** carrying the status switcher, a Log CTA, the `CriticScoreRing`, and a "Your time" summary; the jump spine stays sticky beside the content column. **[Agent: react-frontend]**
- [ ] GREEN: desktop two-column layout + `game-detail-detail-rail/` sub-component; JS-branch (shared `useMediaQuery`) so the mobile action bar and the desktop rail don't both mount. **[Agent: react-frontend]**
- [ ] Gate: unit + typecheck/lint green; Chrome-MCP visual at ~1440px against `design-reference/desktop/Desktop Hi-Fi.html` Light + Dark; rail stays visible as the content scrolls. **[Agent: react-frontend]**

---

## Slice 8 — Journal: compose as a keyboard-aware sheet

_Delivers AC JRN-1…JRN-4._

- [ ] RED: tests — the compose flow opens as a bottom `Sheet` at mobile breakpoint and a centered `Dialog` at desktop (mock `useMediaQuery`); the text area is the dominant element; copy states that playtime alone is a complete entry. **[Agent: testing]**
- [ ] GREEN: convert `features/compose-journal-entry/ui/compose-journal-entry-dialog/` to branch Sheet (mobile) / Dialog (desktop), keyboard-aware (text area hero, max-height, optional-thoughts guidance); desktop journal page pairs the timeline with a stats rail in `widgets/journal-timeline-page/`. **[Agent: react-frontend]**
- [ ] Gate: unit + integration (compose feature ≥85%) + typecheck/lint green; Chrome-MCP visual (phone full-height sheet; desktop dialog + stats rail) Light + Dark. **[Agent: react-frontend]**

---

## Slice 9 — Profile: compact header + sticky tab strip

_Delivers AC PRO-1 / PRO-2._

- [ ] RED: tests — profile renders a compact header (avatar + name + one stat row + a **full-width** primary action) above a sticky tab strip, so content starts high; the primary action is not squeezed into the name row. **[Agent: testing]**
- [ ] GREEN: `widgets/profile-overview/` — compact header, full-width primary action on mobile, sticky `SegmentedControl` tab strip; replace arbitrary avatar/banner sizes with tokenized classes. **[Agent: react-frontend]**
- [ ] Gate: unit + typecheck/lint green; Chrome-MCP visual (phone compact header, content above the fold) Light + Dark. **[Agent: react-frontend]**

---

## Slice 10 — Settings: mobile grouped list

_Delivers AC SET-1 / SET-2._

- [ ] RED: tests — settings renders a grouped list of full-height tappable rows (inline toggles / drill-in) at phone width; rows navigate into the existing `settings/profile` & `settings/account` routes; desktop keeps the two-column layout. **[Agent: testing]**
- [ ] GREEN: add a mobile `settings-list` sub-component (iOS-style grouped rows) in the settings widget; keep `widgets/settings-rail/` as the desktop `md:grid` nav. No new settings screens — reuse existing detail routes. **[Agent: react-frontend]**
- [ ] Gate: unit + typecheck/lint green; Chrome-MCP visual (phone grouped list → drill-in; desktop two-column) Light + Dark. **[Agent: react-frontend]**

---

## Slice 11 — Cross-cutting polish + full responsive verification

_Delivers AC X-1…X-4 and the audit's principle-level guarantees._

- [ ] Audit + fix: ≥44px tap targets across all chrome; active indicators never color-only; gate `Sheet`/`Dialog`/carousel entrance animations behind `prefers-reduced-motion` (`motion-reduce:`); confirm no hardcoded hex — status/surface tokens only. **[Agent: react-frontend]**
- [ ] Gate: full suite green — `typecheck`, `lint`, `format:check`, `test:unit`, `test:integration`, `build`; coverage ≥85% on touched features. **[Agent: testing]**
- [ ] Gate: end-to-end responsive visual pass across all 8 surfaces at phone (~390px) + desktop (~1440px) × Light + Dark + System, against the `design-reference/` prototypes; confirm each desktop view is the additive widening of its phone view (same nav model, no removed action). Record any authed-surface deferrals. **[Agent: react-frontend]**

---

## Notes / Recommendations

| Item | Note |
|---|---|
| Authed visual passes | Live Chrome/Playwright passes on signed-in surfaces (dashboard, library, game detail, journal, profile, settings) may defer where the sandbox has no session (IGDB/Twitch OAuth unreachable), consistent with spec 016/023. Component tests + unauth/landing visual still gate. |
| Sidebar collapse/expand | The desktop sidebar collapse toggle from the design is an **optional enhancement**, intentionally not slotted — add later if wanted. |
| Coverage | Net-new gated code is small (`filter-library`, `add-game`, `compose-journal-entry` touches + `global-action-host` if placed under a gated layer). Keep RED-first to stay ≥85%. |
| No general-purpose agents | Every sub-task maps to a project specialist (`react-frontend`, `tanstack-fullstack`, `testing`); no `general-purpose` fallbacks. |
