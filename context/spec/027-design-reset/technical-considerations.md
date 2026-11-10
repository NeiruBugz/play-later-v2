# Technical Specification: Design reset

- **Functional Specification:** [functional-spec.md](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Nail Badiullin (with Claude; specialist input from react-frontend, tanstack-fullstack, aws-infra)

Paths are relative to `savepoint-tanstack/` unless they start with `infra/`, `docs/` or `context/`. Raw inventory: [research-notes.md](./research-notes.md). Counts below were taken on 2026-11-05, before spec 026 shipped; re-count at the start of slice 0 (026 deletes and reshapes several blocks).

---

## 1. High-Level Technical Approach

The change is presentation-only: no database schema, no server function contracts, no route structure changes. It is delivered as three releases.

1. **Release 1 — primitive library swap (invisible).** `src/shared/ui` moves from 13 `@radix-ui/*` packages to `@base-ui/react`, keeping today's classes and look. Radix is imported only inside `shared/ui`, so the blast radius is the primitives plus 40 `asChild` uses (29 files), ~61 trigger call sites, 13 `onSelect` menu handlers, 5 `onInteractOutside` sites and one `forceMount`.
2. **Release 2 — phase 1, clean foundation.** Primitives are re-pulled from the shadcn `base-maia` style; today's spec-022 palette is mapped onto stock shadcn variable names; the private spacing/typography/shadow layer in `src/styles.css` (1369 lines) is codemodded to stock Tailwind and deleted; terminal labels, retired-look leftovers and `/about` go; the phone baseline (§2.6) lands; lint guards stop the custom layer from growing back.
3. **Release 3 — phase 2, own identity.** New accent and title font tokens, three signature components (`GameCover`, `StatusChip`, `UpNextShelf`), one product-name constant, new logo and assets, and a cutover to a new web address (Vercel domain redirect + additive Cognito/S3 changes).

Each phase is designed and accepted phone first (390 × 844, checked at 360 and 430), then desktop (1440 × 900). A manual Playwright script produces the before/after review images and runs the automated phone checks.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1 Sequencing and slices

Starts only after spec 026 has shipped. Every slice ships green (`lint`, `typecheck`, `test:unit`, `test:integration`, `build`).

| # | Slice | Release | Kind |
|---|---|---|---|
| 0 | Spike + harness: add `@base-ui/react` (exact pin), jsdom polyfill, `@playwright/test` dev dependency, review script; capture the phase-1 "before" set | — | tooling |
| 1a–1d | Base UI swap with current visuals and compat wrappers (see 2.2) | 1 | behaviour |
| 2 | De-compat call sites, remove `@radix-ui/*`, lint-ban `asChild` | 1 | behaviour |
| 3 | Tokens and dead code in `styles.css`; `--font-display` binding; delete `/about` | 2 | visual (neutral) |
| 4 | Re-pull primitives from `base-maia` with the deviation table (2.4) | 2 | visual |
| 5 | Call-site codemod per layer (shared → features → widgets → routes); `SectionLabel`, `PageHeader` everywhere | 2 | visual (neutral) |
| 6 | Delete remaining custom utilities; turn on guardrails (2.5) | 2 | tooling |
| 7 | Phone baseline (2.6) | 2 | visual |
| 8 | Landing page on the theme; off-palette colors and platform hexes removed; theme-color meta | 2 | visual |
| 9 | Phone-first owner review (§2.8) → release phase 1 | 2 | review |
| 10 | Options round: 2–3 accents, 2–3 title fonts, name candidates, shown as token swaps on a preview deployment, phone first | — | review |
| 11 | Accent and title-font tokens | 3 | visual |
| 12 | `GameCover` | 3 | visual |
| 13 | `StatusChip` | 3 | visual |
| 14 | `UpNextShelf` | 3 | visual |
| 15 | Product-name constant, head/meta, manifest route, logo component and assets (assets last, after the name is chosen) | 3 | visual |
| 16 | Address cutover (2.9) | 3 | ops |
| 17 | Phone-first owner review → release phase 2 | 3 | review |

### 2.2 Release 1 — Radix → Base UI (no visual change)

**Dependencies.** Add `@base-ui/react` at an exact version (1.9.0 at the time of writing). At the end of slice 2, remove all 13 `@radix-ui/*` packages and check with `rg "@radix-ui"`. `cmdk`, `sonner`, `lucide-react`, `class-variance-authority` and `tw-animate-css` stay.

**Primitive map (inside `src/shared/ui`):**

| Today | Base UI | Notes |
|---|---|---|
| `react-slot` (button, form) | `render` prop / `useRender` + `mergeProps` | No `asChild` in Base UI |
| `react-dialog` (dialog, sheet, command, image-lightbox) | `dialog` | `Popup` inside `Portal` + `Backdrop`; `command.tsx` keeps `cmdk` inside a Base UI Dialog (spike it in slice 0) |
| `react-popover` | `popover` | Separate `Positioner` hidden in the wrapper |
| `react-select` | `select` | Pass `items` to the root so the value shows its label; no empty-string values (use `null`); `alignItemWithTrigger={false}`; `onValueChange` value may be `null` |
| `react-tabs` (tabs, segmented-control) | `tabs` | `data-active`; `forceMount` → `keepMounted` |
| `react-tooltip` | `tooltip` | `delayDuration` → `delay`; the trigger must be focusable |
| `react-dropdown-menu` | `menu` | `onSelect` → `onClick` (+ `closeOnClick={false}` where the menu should stay open); labels live inside `Menu.Group` |
| checkbox, switch, avatar, collapsible, separator | same-named Base UI parts | `data-checked`/`data-unchecked`; `--collapsible-panel-height` |
| `react-label` | plain `<label>` | |

**Slices 1a–1d** re-implement each primitive on Base UI but keep the current class strings and the current public API through thin compat wrappers. For example, `asChild` maps to `render` and `onSelect` maps to `onClick`. Call sites therefore do not change, and a revert is cheap.
- 1a: button, label, separator, avatar, checkbox, switch, collapsible, tabs, segmented-control.
- 1b: tooltip, popover, dropdown-menu.
- 1c: dialog, sheet, command, image-lightbox, responsive-modal.
- 1d: select and its 6 consumers.

Attribute selectors are translated as part of the swap: `data-[state=open]` becomes `data-open`, and the same applies to `active` and `checked`.

**Outside-press guard.** The 5 `onInteractOutside` sites keep a sheet or dialog open when the user taps a toast: `responsive-modal`, `global-action-host`, `command-palette` ×2 and `done-follow-up`. They move to one helper in `shared/lib`. The helper reads `onOpenChange(open, details)` and cancels when `details.reason === "outside-press"` and the target is inside the toaster. It gets a dedicated behaviour test, because this is the most likely regression.

**Slice 2: removing the compat wrappers.**
- `<Button asChild><Link/></Button>` becomes `<Link className={buttonVariants(...)}>`. This keeps TanStack `Link` typing. **Assumption** (no owner input asked; standard shadcn guidance).
- Triggers use `render={<Button …/>}`. A trigger whose element is a link also needs `nativeButton={false}`.
- The compat wrappers are deleted.
- `asChild` is banned through ESLint `no-restricted-syntax` on the JSX attribute.

### 2.3 Tokens and `styles.css` (slice 3, 6)

The target is roughly 250–300 lines, in this order: imports → `:root` → `.dark` → `@theme inline` → `@layer base` → a small `@utility` block → one reduced-motion block.

- **Stock names carry today's values.** `--background`, `--foreground`, `--card`, `--popover`, `--primary` (today's teal), `--secondary`, `--muted`, `--accent` (the stock hover surface, not the brand accent), `--destructive`, `--border`, `--input`, `--ring`. Each `-foreground` is chosen for AA contrast.
- **Radius.** One stock `--radius` with derived steps. The per-element radius tokens are deleted.
- **Surviving non-stock tokens.** Each is declared as a raw variable in `:root`/`.dark` and as `--color-*: var(--*)` in `@theme inline`, so variants work:
  - `--success`, `--warning`, `--info` (+ `-foreground`);
  - `--status-want`, `--status-playing`, `--status-done`. "Let go" reuses `done`;
  - `--font-sans`, `--font-mono`, `--font-display`. `--font-display` is the missing binding that makes `font-display` a no-op today;
  - `--bottom-nav-height` and the `pb-safe-nav` / `pb-bottom-nav` utilities from spec 025.
- **Deleted.**
  - ~114 dead and ~48 live spacing classes; the latter are codemodded first.
  - 26 typography classes, `shadow-paper-*`, `--foreground-body`, `--primary-hover/active`, `--surface-*`, `chart-*`, `sidebar-*`.
  - Font-weight, duration and ease tokens; 10 keyframes (`tw-animate-css` supplies accordion); the duplicate reduced-motion block.
  - The v3-shaped `--container-*` and the self-referencing `@theme` bindings.
- **Never again declare utilities in `@layer utilities`.** Tailwind v4 does not apply variants to them; this caused the 15 silent no-ops. Anything custom goes through `@utility`.
- **Platform badges become neutral** (owner decision 2026-11-05): the 20 hexes in `badge.tsx` and the platform tokens are removed.
- **`components.json`.** `style: "base-maia"` and `baseColor: "neutral"`. The baseColor only seeds `shadcn add` output, and our tokens override it. A rule-file note forbids running `shadcn init` or `apply` against the repo, because `apply --only theme` would overwrite the palette.

### 2.4 Primitives on Maia (slice 4) and the deviation table

Each primitive is pulled with `shadcn view <name>` (style `base-maia`) in a scratch copy and diffed before replacing the repo file. Deliberate deviations from stock are listed in a short table in a new `src/shared/ui/README.md` section, and are reviewed whenever a primitive is re-pulled:

| Deviation | Why (spec) |
|---|---|
| Button sizes `h-11 md:h-9` (default), `h-10 md:h-8` (sm), icon `size-11 md:size-9`; `xs` only with an expanded hit area | 44 × 44 tap targets on phone (§2.6) |
| Input, textarea, command input, select trigger `text-base md:text-sm` | No iOS zoom on focus (§2.6) |
| Focus ring solid `--ring` at ≥3:1 instead of `ring-ring/50` | Focus visibility (§2.7) |
| `SheetFooter` sticky at the bottom with `pb-safe`; the sheet scroll area is `flex-1 overflow-y-auto`; `max-h-[90dvh]` | Thumb zone, safe areas (§2.6) |
| `Toaster` receives `theme` from the theme provider; on phone it sits above the bottom nav (`mobileOffset` = `--bottom-nav-height` + spacing) | Dark toasts (§2.2); Undo stays in the thumb zone (**assumption**) |

Non-shadcn primitives (empty-state, page-header, rating-input, segmented-control, responsive-modal, undo-toast, image-lightbox) are restyled to stock tokens. A stock `Skeleton` replaces 11 ad hoc `animate-pulse` uses.

New shared pieces:
- `SectionLabel` replaces `terminal-label` (11 uses), the local `TerminalLabel` clone and the 12 `// LABEL` strings. It uses the body font and sentence case.
- `PageHeader` becomes the only page-title style. It uses the title font, and the profile name drops `font-serif`.

### 2.5 Call-site codemod (slice 5) and guardrails (slice 6)

**Codemod.** A dev-only script, `scripts/codemods/tailwind-semantic.ts`, built on ts-morph. It rewrites string literals in `className`, `cn()` and `cva()` only.
- **Spacing** (`xs…3xl` × `p/px/py/gap/space/m`): mapped 1:1 to numeric Tailwind steps, read from the current `styles.css` values before deletion, e.g. `gap-md` becomes `gap-2`. About 250 uses, fully scripted, visually neutral.
- **Typography:** `text-caption` → `text-xs`, `body-sm` → `text-sm`, `text-body`/`body-md` → `text-base`. Page and section titles go through `PageHeader` and `SectionLabel` by hand.
- **Shadows:** `shadow-paper-sm/paper/paper-md` → `shadow-xs/sm/md`.
- **Radius:** bare `rounded` and arbitrary values are fixed per file by hand.
- **Covers:** deferred to `GameCover` (slice 12).
- **Done by hand:**
  - 20 raw hexes and 45 Tailwind palette colors;
  - 32 inline `style={{}}` uses, e.g. `run-status-badge.tsx`;
  - `text-[10px]` and `text-[11px]`, 17 uses, handled in slice 7.
- After each layer PR: grep for the old names (template literals escape the codemod) and diff the compiled CSS for orphan classes.

**Guardrails.** All versions are exact pins.
- `eslint-plugin-better-tailwindcss`:
  - `no-unknown-classes`, pointed at `src/styles.css`;
  - `no-conflicting-classes`;
  - `no-restricted-classes`, banning `text-[Npx]`, hex and arbitrary colors, raw palette colors outside an allow-list, `font-serif`, and the retired semantic names.
- `no-restricted-syntax` bans inline color styles and `asChild`.
- `prettier-plugin-tailwindcss` is bumped to the v4-aware line, with `tailwindStylesheet: "./src/styles.css"` in `prettier.config.mjs`.
- `tailwind-merge` moves to the v3 line, which fixes `text-caption` being classified as a color.
- Docs updated to the new rule ("tokens in `styles.css`; stock `shadcn view` output is the source of truth; deviations listed in `shared/ui/README.md`"):
  - `.claude/rules/tanstack/shared.md` and `widgets.md`;
  - `src/shared/README.md`;
  - `DIVERGENCES.md`;
  - the spec-022 design README.

### 2.6 Phone baseline (slice 7)

| §2.6 criterion | Approach | Where |
|---|---|---|
| Safe areas | Viewport meta becomes `width=device-width, initial-scale=1, viewport-fit=cover`. Without it, `env(safe-area-inset-*)` stays 0 in Safari. Add `@utility pt-safe/pb-safe/pl-safe/pr-safe` and apply them to the mobile top bar, game-detail action bar, sheet footer, toaster offset and navigation progress bar. All of this ships in one slice, so nothing slips under the notch. | `routes/__root.tsx` `head()`, `styles.css`, 5 components |
| Keyboard | `dvh` instead of `vh` in the sheet. Sticky sheet and form footers keep the primary button visible. 16px inputs prevent zoom. No `maximum-scale` or `user-scalable=no`. `interactive-widget` is not added (WebKit ignores it). Add a `visualViewport` adjustment only if device checks show a field hidden behind the iOS keyboard. | primitives |
| Primary button in the thumb zone | A shared `StickyFooter` (inline on desktop) used by the sign-in, profile setup, log, journal edit and profile settings forms; sheets use `SheetFooter` | `shared/ui`, 5 forms |
| Bottom sheets instead of dialogs | Route these through `ResponsiveModal`: Remove from library, `library-modal`, whats-new, Steam import, Steam connect. Filters, status picker, Add game, Log session and the command palette already are sheets. The image lightbox stays full-screen. | call sites |
| Minimum text | Floor `text-xs` (12px); body `text-base md:text-sm`; replace `text-[10px]`/`[11px]` (bottom-nav labels, landing, library card, platform and status badges, profile); lint ban | call sites + lint |
| 44 × 44 | Button sizes in 2.4; migrate ~25 native `<button>` elements to `Button` or give them `min-h-11 min-w-11` | primitives + call sites |
| No hover-only info | Platform badge tooltip becomes a tap `Popover`; `title=` on the Steam imported-card icon buttons becomes `aria-label` + tooltip/popover | 2 call sites |
| No sideways scroll / no clipping at 360–430 | Verified by the review script (2.10), fixed per call site | — |

`useIsDesktop` starts as `false`, so the server render shows the phone variant. Keep CSS-first layouts. Only the sheet-versus-dialog decision depends on JS.

### 2.7 Landing, leftovers and theme (slices 3, 8)

- Delete `routes/about.tsx` and regenerate `routeTree.gen.ts`. No links point to it. The existing root `notFoundComponent` then renders. `src/routes/-route-tree.test.tsx` asserts `/about` is gone.
- Remove the forced `class="dark"` from `routes/index.tsx:22` and the decorative blobs and gradients. The existing pre-hydration script (`THEME_INIT_SCRIPT`, `__root.tsx`) already applies the saved choice or the device setting before first paint. `<html suppressHydrationWarning>` is already set.
- `theme-color` meta (`#f6f1e7` / `#120f0c`) and manifest colors switch to today's `--background` values. They come from `THEME_COLORS` in `shared/config/site.ts`, which phase 2 updates again.

### 2.8 Phase 2 components and tokens (slices 11–15)

- **Accent.** Three tokens: `--primary` (fill), paired with `--primary-foreground`; a new `--accent-text` for text, links and the focus tone on `--background`, with `--color-accent-text`; and `--ring`. A single tone rarely reaches 4.5:1 both as a fill and as text on cream and charcoal. Lint `no-restricted-classes` limits `text-primary`/`bg-primary` to the §2.9 places (primary button, selected item, Playing, focus, links).
- **Title font.** Declared as `--font-display` in `@theme`. Loaded through the existing Google Fonts `<link>` in `__root.tsx` with `display=swap`, at most 2 weights, and a preload for the main weight. Space Grotesk is removed. Applied by `PageHeader`, `DialogTitle`, the game-page name, the landing h1 and the header product name.
- **`GameCover`.** Moves from `entities/game/ui/game-cover/` to `shared/ui/game-cover/`, because entities, features and widgets all render covers, and entity UI cannot import across slices.
  - API: `{ src, name, size, priority }`.
  - Look: `aspect-[2/3]`, one radius, shadow and ring.
  - The placeholder shows the name with `line-clamp-3`.
  - Hover feedback comes from the parent link via `group-hover`.
  - IGDB URL building stays in `shared/lib/igdb-image`.
  - The seven inline cover treatments are deleted.
- **`StatusChip`.** `shared/ui/status-chip.tsx`, with a pure `status: "want" | "playing" | "done" | "let-go"` prop.
  - The entity maps its domain status and outcome to this union.
  - `let-go` uses the Done color.
  - It is built on the Maia `Badge`, uses `--status-*` colors and one casing.
  - It replaces about 8 implementations: the Badge status variants, `LibraryStatusBadge`, `RunStatusBadge` inline styles, action-bar and status-switcher color-mix styles, and the cover-gradient accents.
- **`UpNextShelf`.** `widgets/up-next-shelf/`. It replaces the presentation of the Up Next block that spec 026 delivers; its data and actions are unchanged.
  - The shelf is a horizontal scroll-snap row (`overflow-x-auto snap-x`, `overscroll-x-contain`, `min-w-0` on parents so the page never scrolls sideways).
  - The first cover is larger and capped at ~60% of the phone width, so the next one peeks.
  - The empty state keeps the outline and offers a button that opens the command palette.
- **Product name.** `shared/config/site.ts` exports `PRODUCT_NAME`, `PRODUCT_TAGLINE`, `PRODUCT_DESCRIPTION`, `THEME_COLORS` and `OG_IMAGE_PATH`.
  - Consumers: `__root.tsx` head, `routes/index.tsx`, `games.search.tsx`, `app-sidebar`, `app-mobile-topbar`, `auth-page-view`, `landing-hero`, `settings-list`, `features/whats-new/config.ts`.
  - A `pageTitle(part?)` helper is called from each route's `head()`.
  - Internal identifiers move along: the event `savepoint:command-palette:open`, `SavepointThemeProvider` and the `sp:` storage prefix.
- **Link previews.** Absolute `og:url`, `og:image` and `twitter:image` are built from `BETTER_AUTH_URL` (no new env var). The root loader computes the origin through a server function and passes it via route context, because `head()` also runs on the client, where server env vars are not available (see `FOOT-GUNS.md`). The landing page and `/games/$slug` set per-route `og:url` and titles.
- **Manifest.** A server route `routes/manifest[.]json.ts` built from `site.ts` replaces `public/manifest.json`. It uses `start_url: "/"`.
- **Logo.** `shared/ui/logo.tsx` exports `LogoMark` and `LogoWordmark` as inline `currentColor` SVG. They replace the three `<img src="/logo.svg">` uses and the auth page's text wordmark.
  - Static exports (`favicon.svg/ico`, `apple-touch-icon`, `icon-192/512`, maskable icons, `og-image.png`) are produced last, after the name is chosen.

### 2.9 New address (slice 16)

**Decisions (owner, 2026-11-05):**
- One re-sign-in is accepted. Cookies are host-scoped, and Cognito's own session usually makes the re-sign-in a single tap.
- The theme choice resets to System on the new address, because `localStorage` is per origin.
- No session or theme hand-off is built.

**Infra (`infra/`), all additive and in-place:**
- Prod gains `additional_callback_urls`, copying dev's pattern. During the transition both origins are in the Cognito web client's `callback_urls` and `logout_urls`, which is an in-place update; the client ID and secret are unchanged.
- S3 CORS gets the new origin through `s3_additional_allowed_origins`.
- **Must not change** (ForceNew; data loss or an auth outage):
  - `project_name` / `name_prefix`: the S3 bucket would be replaced and avatars orphaned;
  - the Cognito hosted-UI `domain_prefix`, which keeps "savepoint" on the hosted sign-in screen as a known leftover.
- Pin `s3_bucket_name` explicitly in tfvars, and add `lifecycle { prevent_destroy = true }` to the user pool, bucket and pool domain.

**App.**
- `BETTER_AUTH_URL` switches to the new origin. It drives the Better Auth `baseURL`, the Steam OpenID realm and `return_to`, and the absolute og URLs.
- Already-linked Steam accounts keep working: `steamId64` is stored, and the realm is only used during the handshake.
- An optional `BETTER_AUTH_EXTRA_ORIGINS` (comma-separated, Zod in `env.ts`) feeds `trustedOrigins` while both hosts serve the app. It is removed after the redirect is on.

**Vercel (dashboard, no repo file).** Add the new domain to the same project and make it primary. Once sign-in is verified, the old domain becomes a **308 redirect to the new domain that preserves path and query**. This needs no code and keeps working even when the app is broken or rolled back.

**Cutover runbook.** Each step is verified before the next.
1. Infra is applied additively, dev first and then prod. Verify that old-host sign-in still works.
2. Add the new domain in Vercel. Verify TLS.
3. Merge the rename code.
4. Switch `BETTER_AUTH_URL` and redeploy. Verify on the new host: Google sign-in, Steam connect, avatar upload, a deep link and sign-out.
5. Enable the 308 redirect. Verify that `curl -I` on an old deep link with a query returns 308 with a `Location` header on the new host carrying the same path and query.
6. After 2–4 weeks, remove the old origin from S3 CORS and `trustedOrigins`. Keep the old callback URL and the old domain redirect for at least a year.

`docs/cutover-rollback.md` gets a section for this spec:
- The old claim that sessions survive because the domain is the same no longer holds.
- Rollback order: turn off the redirect, then restore `BETTER_AUTH_URL` and redeploy. This means one more re-sign-in on the old host.
- Never detach the old domain during the transition window.

### 2.10 Review and phone-check script (slice 0)

- `@playwright/test` is added as an exact-pinned dev dependency. It is used by a manual script, `scripts/design-review/capture.ts`, and is not part of the CI test tier. There is still no E2E suite.
- The script reads a screen list:
  - landing, sign-in, home, library, game page, journal list, profile, settings, and the Add game sheet;
  - for §2.6 also the remaining screens in §2.0;
  - signed in with the local credentials provider against a seeded dev database.
- Output: phone images at 390 in Light and Dark, written first; desktop images at 1440 on request. They go to `context/spec/027-design-reset/review/<phase>/<before|after>/<phone|desktop>/`.
- Checks, run at 360, 390 and 430 by reusing `.claude/skills/verify-ui/scripts/check-overflow.js` and `check-clickable.js` via `page.evaluate`:
  - `scrollWidth <= innerWidth`;
  - every interactive element is at least 44 × 44;
  - computed font size is at least 12px, and body text at least 15px;
  - no clipped elements.
- Results are written as a JSON report next to the images.

---

## 3. Impact and Risk Analysis

**System dependencies.**
- Spec 026 must ship first. It reshapes the dashboard, library, game page and status UI, and 027 touches the same files (`__root.tsx`, shell widgets, status components).
- The rest of the functional behaviour (spec 025 layouts, global action host, theme provider) is preserved.
- No database, server function or route-contract change.
- Phase 2 depends on Vercel domain settings, the Cognito web client, S3 CORS and DNS outside the repo.

| Risk | Mitigation |
|---|---|
| Base UI behaviour differs from Radix: focus return, scroll lock, outside press, Select anatomy, iOS keyboard | Release 1 ships the swap alone with today's look. The slice-0 spike runs the existing `shared/ui` tests first. The outside-press helper gets a dedicated test. Device checks on iPhone and Android. |
| jsdom gaps with Base UI (`getAnimations`) | No-op polyfill in `test/setup/unit.ts`. Open popups with `userEvent`. |
| Codemod misses dynamic class strings | Grep for the retired names after each layer; `no-unknown-classes` catches the rest. |
| Phase 1 slices visibly mix the old and new look mid-way | Custom utilities keep compiling (moved to `@utility`) until slice 6. Phase 1 is released only after the full owner review. |
| `viewport-fit=cover` without padding puts content under the notch | The viewport change and safe-area padding are in the same slice; the review script checks it. |
| Maia defaults break phone rules (36px buttons, 14px inputs, 50% focus ring) | The deviation table (2.4) is re-checked on every re-pull. |
| Accent fails AA as text or as fill | Separate fill and text tones; contrast checked in the options round. |
| User pool or bucket replacement during the rename | Never change `project_name` or `domain_prefix`; `prevent_destroy`; review every plan for `-/+`. |
| Cognito `redirect_mismatch`, Steam realm mismatch, S3 CORS failure at the switch | Register both origins before the env flip; post-switch checklist (runbook step 4). |
| Stale link previews | Re-scrape in the Telegram and Slack debuggers after the switch. |
| Old domain lapses, so old links break | Keep it registered and attached as a redirect for at least a year. |
| Parallel work in the same tree | 027 starts after 026 merges. Re-count the inventory at slice 0. |

---

## 4. Testing Strategy

- **Behaviour over classes.** These tests assert class names or tokens:
  - `badge.test.tsx`, `alert.test.tsx`;
  - `library-item-card.test.tsx:221,255`;
  - `platform-badges.test.tsx:63`;
  - `library-status-badge.test.tsx:61-69`;
  - `game-card.test.tsx:98-106`;
  - assertions on `data-state="…"`.

  They are rewritten to check roles, accessible names, visible text and `aria-expanded`/`aria-selected`/`aria-checked`. Pure presence-restate tests are dropped. `theme-provider.test.tsx` loses the retired theme names.
- **Release 1.** The existing `shared/ui/*.test.tsx` suite and the ~30 test files using the affected primitives must pass unchanged in slices 1a–1d. New tests cover the outside-press helper, Select label rendering and the `null` value.
- **Unit tests (framework and server):**
  - `head()` output: title helper, absolute og URLs, viewport string, theme-color pair;
  - the `site.ts` constants;
  - the manifest route payload;
  - `/about` absent from the route tree;
  - the landing page renders without a forced `dark` class;
  - `THEME_INIT_SCRIPT` evaluated in jsdom with a stubbed `matchMedia` (stored, missing and invalid values);
  - `BETTER_AUTH_EXTRA_ORIGINS` parsing;
  - a scan of `src/` and `public/` asserting that the old product name does not appear.
- **Components:** `GameCover` (2:3 placeholder, three-line clamp, accessible name); `StatusChip` (four labels, "Let go" shares the Done variant); `UpNextShelf` (queue order, first item emphasized, empty state opens the palette).
- **Automated phone checks:** the review script (2.10) at 360, 390 and 430, run before each owner review. Results are attached to the review.
- **Manual on real devices:**
  - iPhone with a notch: safe areas, keyboard over fields, Add to Home Screen name and icon;
  - Android Chrome;
  - contrast in Light and Dark;
  - the address cutover checklist: 308 with path and query, Cognito sign-in and sign-out, Steam connect, avatar upload, link previews.
- **CI** keeps the existing gates (format, ESLint with the new Tailwind rules, typecheck, unit + integration with coverage ≥85% statements, production build). No screenshot comparisons in CI (owner decision 2026-11-05).
