# Slice 23 — FSD Audit (`savepoint-tanstack/`)

> **Spec:** 021 Migrate to TanStack Start · **Slice:** 23 (Final parity audit) · **Date:** 2026-05-21
> **Agent:** `react-architect` (findings) + orchestrator verification · **Scope:** layer placement, import direction, `next/*` references, `.server.ts` boundary across `savepoint-tanstack/src/`.
> **Gate verdict:** ✅ **PASS** (re-verified 2026-05-22 after FSD remediation A+B). *Original audit was 🚫 BLOCKED on 6 violations + 1 tooling gap; all resolved.* See § Remediation at end.

## Summary

710 source files audited across the 6 FSD layers (+ generated `routeTree.gen.ts`/`router.tsx`). All files are in structurally correct layer directories. **Zero `next/*` import references.** All `.server.ts` boundary rules respected. However: **6 import-direction violations** (all pre-existing, Slices 3–20) and **1 tooling gap** — `eslint-plugin-boundaries` does not resolve the `@/` path alias, so `lint` reports green while enforcing nothing on real (aliased) imports.

## Per-layer file inventory

| Layer | File count | Notes |
|---|---|---|
| `app` | 12 | Error boundary, theme provider, dev console helper, root index |
| `routes` | 38 | File-based routes; `_authed/` guarded group. `journal.{new,$id,$id.edit}`, `profile.setup`, `games.search` are S23 |
| `widgets` | 145 | `journal-entry-page/`, `profile-setup-page/` are S23 additions |
| `features` | 318 | `compose/edit/delete-journal-entry`, `setup-profile` are S23 additions |
| `entities` | 112 | `journal-entry/api/get-journal-entry-by-id.server.ts`, `profile/api/get-profile-setup-status.server.ts` are S23 |
| `shared` | 83 | `lib/`, `ui/`, `config/`, `api/` |
| generated | 2 | `routeTree.gen.ts`, `router.tsx` — excluded from layer analysis |

## Violations

### Import-direction violations (6, all pre-existing)

| # | Type | File | Evidence | Severity | Origin |
|---|---|---|---|---|---|
| 1 | feature → widget (upward) | `features/browse-related-games/ui/related-games-infinite-list/related-games-infinite-list.tsx` | `:4` `import { GameCard } from "@/widgets/game-card"` | blocking | Slice 20 (`540165da`) |
| 2 | feature → app (upward) | `features/toggle-theme/ui/theme-toggle/theme-toggle.tsx` | `:4` `import { useTheme } from "@/app/providers/theme-provider"` | blocking | Slice 20 (`540165da`) |
| 3 | feature → feature (sibling) | `features/command-palette/hooks/use-debounced-game-search.ts` | `:3` `import { searchGamesFn } from "@/features/search-games"` | blocking | `a9845383` |
| 4 | feature → feature (sibling) | `features/steam-import/ui/igdb-manual-search/igdb-manual-search.tsx` | `:4` `import { searchGamesFn } from "@/features/add-game/api/search-games-fn"` | blocking | `58f14b1d` |
| 5 | entity → entity (sibling) | `entities/profile/ui/overview-tab/overview-tab.tsx` | `:1` `import { LibraryGrid } from "@/entities/library-item/ui/library-grid"` | blocking | Slice 3/4 (`76361bb8`) |
| 6 | entity → entity (sibling) | `entities/profile/ui/overview-tab/overview-tab.type.ts` | `:1` `import type { LibraryStats } from "@/entities/library-item/api/get-library-stats.server"` | blocking | Slice 3/4 (`76361bb8`) |

**Suggested resolutions (architectural):**
- #1: lift `GameCard` to `shared/ui/` or pass as a prop (don't reach up to `widgets`).
- #2: move `useTheme`/`Theme` to `shared/lib/` (or an `entities/theme/`).
- #3, #4: promote `searchGamesFn` to `shared/api/` (or treat as a dependency-free shared operation) so siblings don't cross-import.
- #5, #6: lift the profile-overview composition into `widgets/profile-overview/` that imports both entities downward.

### Other categories — clean

- **Layer placement:** None. Every file under expected `src/<layer>/` path.
- **`.server.ts` boundary:** None. `createServerFn` files correctly omit `.server.ts`; the one `features/upload-avatar/api/get-avatar-presigned-url.server.ts` is a test-callable worker (no `createServerFn`, no client import).
- **`next/*` references:** None. (One prose comment in `shared/ui/empty-state.tsx` mentions `next/link` as annotation — not an import.)
- **Public-API bypass (non-blocking):** several routes import internal feature paths (`@/features/<x>/api/<name>`) rather than the slice `index.ts`. Layer direction is correct; only the public-API contract is bypassed. Consistent pre-existing pattern. Non-blocking.

## Slice 23 fresh-file assessment

All S23 additions verified present, correctly layered, correct `.server.ts` usage, downward-only imports. **Zero new violations introduced by Slice 23.** (Routes import features/widgets/shared downward; `journal-entry-page`/`profile-setup-page` widgets import features+shared; new entity queries `.server.ts` import only shared; loader-safe `createServerFn` files correctly un-suffixed.)

## Tooling cross-check (the load-bearing finding)

`pnpm --filter savepoint-tanstack lint` → **exit 0, no warnings**. The `eslint-plugin-boundaries` config (`eslint.config.mjs:91–154`) correctly encodes the 6-layer hierarchy with `default: "disallow"` and downward allow-lists, and `test/eslint/` regression guard passes (2/2).

**Gap (blocking-class):** the `settings` block (`eslint.config.mjs:91–106`) has **no `import/resolver`**. `eslint-plugin-boundaries` resolves import *targets* via the default node resolver, which cannot resolve the `@/` TS path alias. So `boundaries/dependencies` can classify the *source* file (by path) but not the *target* of an `@/`-aliased import → with `boundaries/no-unknown` off, those imports are silently allowed.

**Verified empirically (orchestrator):**
- `eslint.config.mjs:91–106` — confirmed no resolver setting in the boundaries block.
- `npx eslint src/features/toggle-theme/ui/theme-toggle/theme-toggle.tsx --rule '{"boundaries/dependencies":"error"}'` → **exit 0, no output** despite the file's `@/app/...` upward import (violation #2). The rule does not fire on the aliased import.
- The `test/eslint/` regression guard uses **relative paths** (`../features/index`), which the node resolver *can* resolve — so it passes, giving false confidence that aliased imports are also covered.

**Consequence:** every prior slice's "FSD boundaries clean" claim rested on a linter blind to `@/`-aliased imports (≈ all real imports). The 6 violations above were found by manual `rg` and are a **floor, not a ceiling** — the authoritative count is unknown until the resolver is fixed.

**Fix:** add `eslint-import-resolver-typescript` (or tsconfig `paths`-based resolution) to the boundaries `settings` block under `"import/resolver"`, then re-run lint for the authoritative violation list, and extend the `test/eslint/` regression guard to assert an aliased upward import is flagged (so the gap can't silently reopen).

## Gate verdict

🚫 **BLOCKED**. Required before PASS:
1. **Fix the resolver gap** (`eslint-import-resolver-typescript` in the boundaries settings) — highest leverage; makes the linter authoritative and reveals the true violation count. Extend `test/eslint/` to pin alias resolution.
2. **Resolve the real violation set** (the 6 above + any further ones the fixed linter surfaces) via the architectural moves listed — OR formally record accepted deviations with justification in `DIVERGENCES.md` if cutover cannot wait.

Note: all current violations are **pre-existing technical debt** that escaped earlier audits due to the resolver gap; Slice 23's own work is clean.

## § Remediation (2026-05-22) — gate now PASS

**A. Resolver gap fixed.** Added `eslint-import-resolver-typescript@4.4.4` (exact-pinned) and wired `settings["import/resolver"].typescript` in the boundaries config block so `@/`, `#/`, `@env` aliases resolve. Re-running lint with the honest resolver surfaced **34** raw violations (vs the 6 found by hand) — triaged as 6 genuine code breaks + ~5 allowed widget compositions + ~23 config false-positives (barrels + `routes/__root.tsx → @/app` shell wiring).

**B. Config redesigned to enforce real policy + 6 genuine violations relocated.**
- `eslint.config.mjs`: per-slice capture groups for `features`/`entities` (cross-slice forbidden, same-slice/barrel allowed via `${from.slice}` matching); `widgets→widgets` allowed (composition per `widgets.md`); `routes→app` allowed (root-shell seam); same-layer barrels allowed. Now flags ONLY genuine cross-slice/cross-layer breaks.
- Relocations: (1) `browse-related-games` feature→widget removed — `GameCard` injected via a `renderGame: (game) => ReactNode` slot prop from `games.$slug.tsx`; (2) `toggle-theme` feature→app removed — `Theme`/`ResolvedTheme`/`ThemeContextValue`/`ThemeContext`/`useTheme` moved to `@/shared/lib/theme`, `ThemeProvider` stays in `app/` importing from shared; (3,4) feature→feature siblings removed — `searchGamesFn` relocated to `entities/game/api/search-games.ts`, all consumers (`command-palette`, `steam-import`, `add-game`, `search-games`, routes) import downward; (5,6) entity→entity siblings removed — `entities/profile/ui/overview-tab` deleted, cross-entity composition lifted to the widget layer.
- Regression guard (`test/eslint/fsd-boundaries.test.ts`) extended to pin alias resolution + per-slice policy (cross-slice flagged, same-slice/widget-composition not).
- Widget-composition carve-outs documented in `DIVERGENCES.md` per `widgets.md` discipline.

**Verified gates (2026-05-22):** typecheck clean · `pnpm lint` exit 0 / **0 boundaries violations** · test:unit 852/111 files · test:integration 406/41 files · format:check clean · eslint regression guard passes.

**Non-blocking follow-up:** the boundaries plugin prints v5→v6 deprecation diagnostics (legacy selector + `${...}` template syntax via `boundaries/legacy-templates: true`). Harmless under v6.0.2 (lint exits 0) but should migrate to object-selectors + `{{...}}` to silence the per-run console noise. Tracked, not blocking.
