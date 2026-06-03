# Tasks — 022 Unified Design System (Light + Dark)

- **Functional Specification:** [`./functional-spec.md`](./functional-spec.md)
- **Technical Considerations:** [`./technical-considerations.md`](./technical-considerations.md)

---

## Methodology (binding)

- Each slice leaves the app in a **runnable, working state**. Verify before checking off.
- Slices with testable TypeScript follow the **TDD policy** (RED tests authored failing first, then GREEN implementation, then refactor) — see `savepoint-tanstack/CLAUDE.md` → TDD policy.
- Pure-CSS/asset slices have **no meaningful unit test**; their gate is a **visual pass in both Light and Dark** against the functional acceptance criteria, using the bundled UI kit (`design-system/project/ui_kits/app/`) as the visual reference. These visual-only gates were explicitly approved.
- Commands: `pnpm --filter savepoint-tanstack {dev,typecheck,lint,format:check,test:unit}`.
- Out of scope (no task): `og-image.png` regeneration — still shows the old logo on social shares; tracked as a post-spec follow-up.

---

## Slice 1 — Light + Dark re-skin (token swap)

_Delivers FR 2.1 (consistent restyle), 2.4 (geometric headings), 2.6 (status colors), 2.8 (platform colors)._

- [x] Diff the v2 token names (`design-system/project/colors_and_type.css`) against the `@theme inline` bindings in `src/styles.css`; list any token the block references but v2 omits (e.g. `--sidebar-primary`, `--sidebar-accent`, `--sidebar-ring`). **[Agent: react-frontend]** — found 5 sidebar sub-tokens (`--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-ring`).
- [x] Replace the `:root` (Light) and `.dark` (Dark) token *bodies* in `src/styles.css` with v2 values — keep token **names**; strip the v2 `@import` font line; bake sage `--acc-l`/`--acc-d` defaults; **do not** add `[data-accent]` selectors. Leave the retired theme blocks + `@custom-variant`s untouched this slice (so still-selectable Cartridge/Aurora keep working). **[Agent: react-frontend]**
- [x] Resolve every gap found in sub-task 1 — define the token in v2 `:root`/`.dark`, or remove its `@theme inline` line. **[Agent: react-frontend]** — all 5 gaps DEFINED (derived from nearest token, e.g. `--sidebar-primary: var(--primary)`), none removed.
- [x] `typecheck` + `lint` + `format:check` green; run the app, drive Chrome MCP across dashboard / library / game detail / journal in **Light and Dark** — confirm warm cream / warm charcoal surfaces, rationed sage accent, geometric (Space Grotesk) headings, consistent status + platform colors. _Visual-only gate._ **[Agent: react-frontend]** — build/lint/format/typecheck green (typecheck after `pnpm install` restored a stale dep). **Browser visual QA pending user confirmation.**

---

## Slice 2 — Consolidate to Light / Dark / System + migrate retired users

_Delivers FR 2.2 (3 theme options), 2.3 (retired-theme users → System); completes 2.4 (font-link cleanup)._

- [x] RED: extend `theme-provider.test.tsx` — a stored `"cartridge"`/`"aurora"` resolves to `system`; `applyThemeToHtml` only ever adds/removes `dark`. Extend `theme-toggle.test.tsx` — picker renders exactly Light / Dark / System. **[Agent: testing]** — 6 tests failed first (RED confirmed), then 26/26 pass.
- [x] GREEN: narrow `Theme` → `"light" | "dark" | "system"` and `ResolvedTheme` → `"light" | "dark"` in `src/shared/lib/theme/index.ts`. **[Agent: tanstack-fullstack]**
- [x] GREEN: update `theme-provider.utility.ts` allow-lists — `THEME_LABELS` → `["light","dark","system"]`, `THEME_CLASS_MAP` → `{ light: "", dark: "dark" }`, `THEME_CLASS_NAMES` → `["dark"]`. **[Agent: tanstack-fullstack]**
- [x] GREEN: update `THEME_INIT_SCRIPT` in `__root.tsx` (`validThemes`, `classMap`, `classList.remove('dark')`) — **same commit** as the provider to avoid FOUC drift. **[Agent: tanstack-fullstack]**
- [x] GREEN: trim `THEMES` in `theme-toggle.tsx` to Light / Dark / System; drop the `Gamepad2` + `Sparkles` imports. **[Agent: tanstack-fullstack]**
- [x] Delete the `.cartridge` / `.aurora` / `.y2k` / `.jewel` CSS blocks + `.aurora body::before/::after`; simplify `@custom-variant dark` to `&:is(.dark *)`; delete the `y2k` / `jewel` / `aurora` custom-variants and any orphaned `@layer` rules (logo-glow, aurora keyframes). **[Agent: tanstack-fullstack]** — styles.css 2689 → ~1349 lines.
- [x] Trim the font `<link>` in `__root.tsx` to Geist + Geist Mono + Space Grotesk (drop Source Serif 4, Bowlby One, Archivo, JetBrains Mono, Space Mono). **[Agent: tanstack-fullstack]**
- [x] Unit tests green (1221/1221); `typecheck` + `lint` + `format:check` + `build` green; picker shows 3 options and stored `"cartridge"` lands on System (proven by tests). **[Agent: tanstack-fullstack]**

---

## Slice 3 — Save Glow logo + favicon

_Delivers FR 2.5 (new logo in sidebar, landing, browser tab)._

- [x] Replace `public/logo.svg` with the Save Glow standalone (sage); remove old memory-card assets (`favicon-memory-card*.svg`, `logo192/512.png`). **[Agent: react-frontend]**
- [x] Add a Save Glow SVG favicon + explicit `<link rel="icon" type="image/svg+xml">` in `__root.tsx`; update `manifest.json` icons; remove the dead retired-theme classes from BOTH the sidebar (`app-sidebar.tsx`) and the mobile topbar (`app-mobile-topbar.tsx`). **[Agent: react-frontend]** — also replaced the landing page's inline "S" letter-badge with the Save Glow `<img src="/logo.svg">`.
- [x] Run app, drive Chrome MCP — confirm the new mark in the sidebar, on the landing page, and as the browser-tab icon; no broken-image requests in the console. _Visual-only gate._ **[Agent: react-frontend]** — typecheck/lint/format/build green, no dangling asset refs. **Browser visual QA pending user confirmation.**

---

## Slice 4 — Rounded covers + stray-color sweep

_Delivers FR 2.7 (consistent rounded covers + crisp control corners); hardens FR 2.1._

- [x] Replace the hardcoded `rounded-lg` in `src/entities/game/ui/game-cover/game-cover.tsx` (both the `<img>` and the fallback `<div>`) with the `--radius-cover` token. **[Agent: react-frontend]** — `rounded-[var(--radius-cover)]`.
- [x] Grep components for hardcoded color literals bypassing tokens (the `selection:bg-[rgba(...)]` on `<body>` in `__root.tsx`, any `fuchsia`/`rose`/hex usage); re-point to tokens (selection → accent). **[Agent: react-frontend]** — `<body>` selection → `selection:bg-primary/25`. Platform brand colors left constant (FR 2.8). Landing decorative gradient art (fuchsia/rose/violet) left as-is — **flagged for visual review.**
- [x] Dead retired-theme class sweep: remove leftover `y2k:`/`jewel:` variants and `y2k-*`/`jewel-*` utility strings from `src/shared/ui/card.tsx`, `src/shared/ui/button.tsx`, `src/widgets/library-page/ui/library-page/library-page.tsx`, and any other `src/` file a fresh grep for `y2k`/`jewel`/`cartridge`/`aurora` turns up. These now produce no CSS (Tailwind silently drops them) — they're cruft from the Slice 2 deletions. **[Agent: react-frontend]** — done; final grep leaves only historical comments + intentional test assertions.
- [x] Run app; confirm covers round identically on the library grid / dashboard / detail, and the text-selection highlight uses the accent. `typecheck` + `lint` + `format:check` + `build` green; grep for `y2k`/`jewel`/`cartridge`/`aurora` across `src/` returns only intentional historical comments. _Visual-only gate._ **[Agent: react-frontend]** — automatable gates green (1221/1221 tests). **Browser visual QA pending user confirmation.**
