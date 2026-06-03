# Technical Specification: Unified Design System (Light + Dark)

- **Functional Specification:** [`./functional-spec.md`](./functional-spec.md)
- **Status:** Completed
- **Author(s):** Nail Badiullin

---

## 1. High-Level Technical Approach

A **presentation-only** change — no database, server functions, API contracts, or env vars are touched. Work is confined to the `app`/`routes`/`shared`/`entities` presentation surfaces plus static brand assets. Four workstreams:

1. **Token swap** — replace the `:root` (light) and `.dark` token bodies in `savepoint-tanstack/src/styles.css` with the v2 values from the design bundle (`context/spec/022-unified-design-system/design-system/project/colors_and_type.css`), and delete the four retired theme blocks (`.y2k`, `.jewel`, `.cartridge`, `.aurora`) plus their Tailwind `@custom-variant`s and any theme-specific `@layer` rules.
2. **Theme consolidation + migration** — narrow the `Theme` union and the provider/inline-script allow-lists to `light | dark | system`, which both trims the picker and auto-migrates retired-theme users to System.
3. **Typography** — drop the retired display/body/mono families from the font `<link>`, keeping Geist + Geist Mono + Space Grotesk; `--font-display` resolves to Space Grotesk globally (already in the v2 tokens).
4. **Brand assets** — swap in the Save Glow logo (`logo.svg`) and an SVG favicon; remove the old memory-card marks and the orphaned logo-glow classes; honor `--radius-cover` on game covers.

The v2 token *names* match the existing `@theme inline` Tailwind binding, so component code (which references Tailwind tokens like `bg-card`, `text-primary`, `border-border`) requires **no per-component edits** — it re-skins automatically. The exceptions are hardcoded color literals that bypass tokens, which a sweep will catch.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1 Architecture changes

None. No new layer, provider, route, server fn, entity, env var, or dependency. Space Grotesk / Geist / Geist Mono and Tailwind v4 are already in the stack. **No `/awos:hire` needed.**

### 2.2 Token system — `savepoint-tanstack/src/styles.css`

| Region (current lines) | Change |
|---|---|
| `@custom-variant dark` (line 30) | Simplify to `&:is(.dark *)` — drop the `.y2k/.jewel/.aurora` members |
| `@custom-variant y2k / jewel / aurora` (lines 31–33) | Delete |
| `:root` token body (lines ~35–198) | Replace values with v2 Light tokens; keep token **names** |
| `.dark` token body (lines ~199–287) | Replace values with v2 Dark tokens |
| `.y2k` / `.jewel` / `.cartridge` / `.aurora` blocks + `.aurora body::before/::after` (lines 288–692) | Delete |
| `@theme inline` (lines 693–1043) | Keep; reconcile so every bound `--color-*` / `--radius-*` / `--shadow-*` resolves (see Risk 3.2) |
| `@layer base` / `@layer utilities` (1044+) | Sweep for theme-specific rules (logo-glow, aurora keyframes) and remove orphans |

- **Accent:** sage is baked in as the single brand color. Keep the `--acc-l` / `--acc-d` indirection in `:root` set to sage, but **do not ship** the `[data-accent="indigo|sage|clay|plum"]` selector rules — that removes the swap surface entirely (matches the "no picker" decision) while leaving the token structure intact for a future opt-in.
- **Fonts:** strip the `@import url(...)` line from the pasted v2 block — the app loads fonts via `<link>` (with `preconnect`), not `@import`.

### 2.3 Theme consolidation + migration

| File | Change |
|---|---|
| `src/shared/lib/theme/index.ts` | `Theme` → `"light" \| "dark" \| "system"`; `ResolvedTheme` → `"light" \| "dark"` |
| `src/app/providers/theme-provider/theme-provider.utility.ts` | `THEME_LABELS` → `["light","dark","system"]`; `THEME_CLASS_MAP` → `{ light: "", dark: "dark" }`; `THEME_CLASS_NAMES` → `["dark"]` |
| `src/routes/__root.tsx` → `THEME_INIT_SCRIPT` | `validThemes` → `['light','dark','system']`; `classMap` → `{light:'',dark:'dark'}`; `classList.remove('dark')` only |
| `src/features/toggle-theme/ui/theme-toggle/theme-toggle.tsx` | Trim `THEMES` to Light / Dark / System; drop `Gamepad2` + `Sparkles` imports |

**Migration logic:** purely the allow-list narrowing above. A stored `"cartridge"`/`"aurora"` fails `isTheme()` (provider) and the inline `validThemes` check (SSR), so both code paths fall back to the configured default (`system`). The provider and inline script **must change in the same commit** — if they drift, a retired-theme user sees a pre-hydration flash. No localStorage rewrite job is required; the stale string is simply never honored.

### 2.4 Brand assets — `savepoint-tanstack/public/` + sidebar

- Replace `public/logo.svg` with the Save Glow standalone (sage `#2f8a82` stroke/fill) from the bundle. Since the accent isn't user-swappable, the standalone sage SVG suffices for the sidebar `<img>` (no `currentColor` tinting needed).
- Add a Save Glow SVG favicon and point an explicit `<link rel="icon" type="image/svg+xml">` at it in the root `head`; update `manifest.json` icon references.
- Remove old memory-card assets (`favicon-memory-card*.svg`, stale `logo192/512.png`) and the `y2k-logo-glow jewel-logo-glow` classes on the sidebar logo (`src/widgets/app-sidebar/ui/app-sidebar/app-sidebar.tsx`).
- **`og-image.png` is explicitly out of scope** (functional spec §3) — left as a flagged follow-up.

### 2.5 Cover rounding — `src/entities/game/ui/game-cover/game-cover.tsx`

Replace the hardcoded `rounded-lg` (both the `<img>` and the fallback `<div>`) with the design token `--radius-cover` (10px), so every cover instance rounds identically. Express via a Tailwind arbitrary value (`rounded-[var(--radius-cover)]`) or a mapped radius utility.

### 2.6 Stray-color sweep

Grep components for hardcoded color literals that bypass tokens (e.g. the `selection:bg-[rgba(79,184,178,0.24)]` on `<body>` in `__root.tsx`, any `fuchsia`/`rose`/hex usage). Re-point to the appropriate token (`selection` → accent) so they re-skin with the system.

---

## 3. Impact and Risk Analysis

### System Dependencies

- **Tailwind v4 `@theme inline`** binds utilities to CSS vars — the token swap is safe *only if* every bound variable still resolves.
- **The pre-hydration inline script ↔ provider contract** — the two halves of the FOUC-prevention machinery must stay in lockstep (documented in DIVERGENCES.md → Slice 19).
- No dependency on DB, auth, server fns, or external services.

### Potential Risks & Mitigations

1. **FOUC / hydration mismatch** if the inline script and provider allow-lists drift → change both in one commit; assert in unit tests that a retired value resolves to `system`.
2. **Dangling `@theme inline` bindings** — v2 omits `--sidebar-primary`, `--sidebar-accent`, `--sidebar-ring` (and possibly others) that the current `@theme inline` references. → Diff the two token-name sets; for each gap either define the token in the v2 `:root`/`.dark` or remove its `@theme inline` line. This is the **primary reconciliation task**.
3. **Hardcoded colors bypassing tokens** won't re-skin → the §2.6 sweep + a visual pass on every screen in both modes.
4. **Lingering references to retired themes** (`cartridge`/`aurora`/`y2k`/`jewel` in CSS `@custom-variant`, component classNames, or strings) → narrowing the `Theme` union makes TS references compile-fail; `lint` + a grep for the CSS class strings covers the non-typed ones.
5. **Stale `og-image`** still shows the old logo on social shares → accepted, flagged as follow-up.

---

## 4. Testing Strategy

- **Unit (Vitest, jsdom):**
  - `theme-provider.test.tsx` — add cases: a stored `"cartridge"`/`"aurora"` resolves to `system`; `applyThemeToHtml` only ever adds/removes `dark`.
  - `theme-toggle.test.tsx` — the picker renders exactly Light / Dark / System (per the elements/actions + given/when/then convention); selecting each applies the expected state. Remove assertions referencing retired options.
- **Type/lint gates:** `pnpm --filter savepoint-tanstack typecheck` must surface any leftover retired-theme references; `lint` (incl. FSD boundaries) stays green. These are the cheapest regression net for the consolidation.
- **No integration/DB tests** — nothing server-side changes.
- **Manual visual QA** against the functional acceptance criteria: walk landing → dashboard → library → game detail → journal → settings in **both** Light and Dark, verifying surfaces, the rationed sage accent, geometric headings, status/platform colors, crisp corners + rounded covers, and the Save Glow logo in sidebar / landing / browser tab. Use the design bundle's UI kit (`design-system/project/ui_kits/app/`) as the visual reference.
