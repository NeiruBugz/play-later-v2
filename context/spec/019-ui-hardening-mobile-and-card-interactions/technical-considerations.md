# Technical Specification: UI Hardening — Mobile Safe-Areas, Card Interactions & Landing Page

- **Functional Specification:** [`./functional-spec.md`](./functional-spec.md)
- **Status:** Draft
- **Author(s):** Nail Badiullin

---

## 1. High-Level Technical Approach

Three independent workstreams, sized to ship in the same release without coupling:

1. **Mobile chrome clearance (Cluster A)** — fix layout-shell padding and scroll anchoring. No component refactor; CSS-only changes inside `app/(protected)/layout.tsx`, `widgets/mobile-nav/`, and `widgets/header/`. Uses `env(safe-area-inset-*)` and `scroll-margin-top` / `scroll-padding-top`.

2. **Library card pointer correctness (Cluster B)** — restructure the shared card so the wrapping `<Link>` no longer encloses interactive controls. Adopt the “linked card with overlay” pattern (link element renders a `::after` covering the safe area; action controls sit at `position: relative; z-index: 1` outside the link's hit zone). Apply consistently to `widgets/game-card/`, `features/library/ui/library-card-*.tsx`, and the search-result `features/game-search/ui/game-card.tsx`. Touch-drag rating uses pointer capture + `touch-action: none`.

3. **Landing-page hardening (Cluster C)** — small, isolated edits to `app/page.tsx`, `app/layout.tsx`, `app/robots.ts`, and `app/sitemap.ts`. No new dependencies. Adds a `<main>` landmark, removes `preload: true` from theme-only fonts, parameterizes `metadataBase` via `process.env.VERCEL_URL` (with `NEXT_PUBLIC_SITE_URL` fallback), and corrects the disallow list.

No new services, no DB changes, no API contracts, no new dependencies.

---

## 2. Proposed Solution & Implementation Plan (The "How")

### 2.1 Mobile bottom-navigation clearance

**Files**
- `app/(protected)/layout.tsx` — main scrolling container.
- `widgets/mobile-nav/ui/mobile-nav.tsx` — verify fixed height token; expose as CSS variable `--mobile-nav-h` on `:root` or via a Tailwind theme value.
- `shared/globals.css` — declare `--mobile-nav-h` (e.g. `64px`) under a phone media query.

**Approach**
- The signed-in main scroll container gets `padding-bottom: calc(var(--mobile-nav-h) + env(safe-area-inset-bottom) + 16px)` on viewports `< md`.
- Bottom nav itself uses `padding-bottom: env(safe-area-inset-bottom)` so it sits flush above iOS home indicator.
- Audit each protected route's wrapper to ensure the padding propagates (no nested `overflow: auto` sub-regions that bypass it).

**Why CSS-only**
- The container model is already there; only the safe-area math is wrong. No JS measurement needed.

### 2.2 Mobile sticky-header clearance for in-page anchors

**Files**
- `shared/globals.css` — add `html { scroll-padding-top: var(--sticky-header-h); }` and `[id] { scroll-margin-top: var(--sticky-header-h); }` (or a more targeted selector for documented anchor targets).
- `widgets/mobile-topbar/` — declare `--sticky-header-h` via the same pattern as `--mobile-nav-h`.

**Approach**
- Use `scroll-margin-top` on heading targets that the in-app three-dot menu jumps to (Journal section anchor on the game detail page is the explicit failing case in §2.2 of the functional spec).

### 2.3 Library card pointer-event correctness (the structural fix)

**Files**
- `widgets/game-card/ui/game-card.tsx` — primary refactor.
- `widgets/game-card/ui/game-card-cover.tsx` — receives the link semantics.
- `features/library/ui/library-card-*.tsx` — actions, menu, rating, CTA: ensure they sit *outside* the link element, not inside.
- `features/game-search/ui/game-card.tsx` — applies the same overlay pattern for parity.
- `features/library/ui/library-card-rating.tsx` and `shared/components/ui/rating-input.tsx` — touch-drag handling.

**Card layout (logical)**

```
Card (position: relative)
├─ NavLink — position: absolute; inset: 0; z-index: 0;
│  └─ visually empty <a>, aria-label="View {gameName}"
├─ Cover image            (z-index: 0 — under the overlay, but the overlay is the link's ::before so cover remains visible)
├─ Title / metadata       (z-index: 0 — same, link covers them)
└─ Action region          position: relative; z-index: 1;
    ├─ Three-dot menu     (button, not link)
    ├─ Rating control     (button group / role=radiogroup)
    └─ Primary CTA        (button)
```

**Pattern details**
- Use the established “linked card” recipe: a single `<Link>` (or `<a>`) is placed inside the `<Card>` and absolutely positioned to cover the safe area; its visible text comes from the title, which is *behind* the overlay but visually rendered. Avoid `<Link>` wrapping the entire card subtree.
- All action controls are real `<button>` elements with `type="button"`. They sit at `z-index: 1` and intercept pointer events before the overlay link sees them.
- This automatically fixes left-click, middle-click, right-click, drag-link-preview, and keyboard tab order — because the controls are no longer inside `<a>`.

**Touch-drag rating**
- `shared/components/ui/rating-input.tsx`: use a `role="radiogroup"` / `role="slider"` with one of:
  - `onPointerDown` → `e.currentTarget.setPointerCapture(e.pointerId)`; `onPointerMove` computes star index from `e.clientX` against the bounding rect.
  - CSS: `touch-action: none; user-select: none; -webkit-user-drag: none; -webkit-touch-callout: none;` on the rating row.
- Stars are `<button type="button">`; each has an `aria-label="Rate N stars"` and the group has `aria-label="Rating"`.

**Keyboard contract** (from §2.3 keyboard ACs)
- Tab order: card link → three-dot button → rating control (single stop) → primary CTA.
- Rating control: arrow keys adjust value once focused; Space/Enter on individual star activates it. Enter on the group does *not* navigate.

### 2.4 Three-dot button tap target

**Files**
- `features/library/ui/library-card-menu.tsx`
- `features/game-search/ui/game-card.tsx` (quick-add button)

**Approach**
- Visible icon stays at current size. Hit area expanded via `padding` on the button (not via a transparent overlay, to avoid re-introducing pointer-event ambiguity). Target ≥ 44×44 dp on viewports `< md`.
- Tailwind: `min-w-11 min-h-11 p-2` (44dp = 44/16 = 2.75rem; use `min-w-[2.75rem]`).
- 8dp edge clearance via `inset-2` instead of `inset-1` on absolute positioning.

### 2.5 Landing-page skip link + main landmark

**File:** `app/page.tsx`

**Approach**
- Wrap the page contents in `<main id="main-content" tabIndex={-1}>…</main>`.
- `tabIndex={-1}` allows programmatic focus when the skip link is activated; Next’s default fragment-target behaviour will move scroll, and focus is moved by the browser following the link to a focusable element.
- No change needed in `shared/components/skip-to-content.tsx`.

### 2.6 Landing-page logo/wordmark — single accessible name

**File:** `app/page.tsx`

**Approach**
- For both header and footer logo+wordmark clusters: set `alt=""` on the `<Image>` (decorative; adjacent text is the accessible name). Wrap header logo+wordmark in a single `<Link href="/" aria-label="SavePoint home">` if not already; footer logo+wordmark is non-interactive and just needs the alt fix.

### 2.7 Landing-page font payload trim

**File:** `app/layout.tsx`

**Approach**
- Remove `preload: true` from the five non-default-theme font declarations (`fontPaperDisplay`, `fontCartridgeDisplay`, `fontCartridgeSans`, `fontCartridgeMono`, `fontAuroraDisplay`, `fontAuroraMono`). Keep `preload: true` only on `fontDefaultSans` (Geist) and `fontDefaultMono` (Geist Mono).
- Theme-only fonts remain referenced via CSS variables under their respective `.cartridge`/`.aurora` selectors in `shared/globals.css`. Without `preload`, browsers fetch them only when a CSS rule that uses the variable is actually applied — i.e. when a signed-in user picks that theme. The default-theme landing page never triggers the fetch.
- Verify with DevTools Network tab on a cold load of `/`: only Geist + Geist Mono fonts requested.

**Note on Source Serif 4 (`fontPaperDisplay`)**
- This is the *default* paper-theme display font. Audit whether `display-2xl` (the LCP h1 on the landing page) actually uses it; if yes, keep `preload: true`. If the landing page uses Geist-based `display-2xl`, drop preload.
- [NEEDS VERIFICATION during implementation: which font variable resolves `display-2xl` in the default theme.]

### 2.8 `metadataBase` parameterization

**File:** `app/layout.tsx`

**Approach**
- Replace hardcoded URL with:

```ts
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://savepoint-app.vercel.app");
export const metadata: Metadata = { metadataBase: new URL(siteUrl), /* … */ };
```

- Vercel auto-injects `VERCEL_URL` per deployment (preview & production), so OG/Twitter card absolute URLs resolve to the correct host without any runtime config.
- Same `siteUrl` is exported (or re-derived) for use in `app/sitemap.ts` and `app/robots.ts`.

**Env**

| Var | Source | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | manual override (optional) | force a canonical host (e.g. for staging with custom domain) |
| `VERCEL_URL` | injected by Vercel | per-deployment hostname; used as fallback |

### 2.9 `robots.ts` accuracy

**File:** `app/robots.ts`

**Approach**
- Replace `disallow: ["/api/", "/dashboard/", "/library/", "/profile/"]` with the actual signed-in route prefixes derived from `app/(protected)/`:
  - `/api/`
  - `/dashboard`
  - `/journal`
  - `/library` (kept — route exists under `(protected)`)
  - `/profile`
  - `/settings`
  - `/steam`
- Also derive `sitemap` URL from `siteUrl` (see §2.8) so previews list their own sitemap.

### 2.10 `sitemap.ts` portability

**File:** `app/sitemap.ts`

**Approach**
- Replace hardcoded `BASE_URL` with the same `siteUrl` resolver (extract to `shared/lib/site-url.ts` to avoid duplication).
- No new entries added: public profile pages remain out of scope per the functional spec's §2.9 deferral and Out-of-Scope clause.

### 2.11 "Change Status" submenu — current selection (renumbered §2.10)

**Files**
- `features/library/ui/library-card-menu.tsx` (or wherever `Change Status` is rendered).

**Approach**
- Use the existing menu primitive's `RadioGroup`/`CheckboxItem` variant (Radix `DropdownMenuRadioGroup` + `DropdownMenuRadioItem`). Bind `value` to the current library entry's status. Radix supplies the `[data-state="checked"]` styling hook and the correct ARIA — `aria-checked="true"` is announced by screen readers.
- No-op selection (re-selecting the active status): close the menu without dispatching the server action; suppress toast.

---

## 3. Impact and Risk Analysis

### System Dependencies

- **Card refactor blast radius** — the shared `widgets/game-card/` is consumed by Library, Dashboard, profile library tab, search results. Any visual regression affects all four surfaces. Mitigated by visual snapshot tests on the existing component test suite.
- **Theme system** — removing `preload` from theme fonts assumes browsers reliably defer the fetch until the variable is actually used. True in modern browsers (per CSS Fonts Module L3). Worst case: a signed-in user switching to the Cartridge theme sees a brief FOUT on first paint after switching. Acceptable.
- **`metadataBase` change** — affects every page's OG/Twitter absolute URL resolution. Verify by deploying a preview and pasting the URL into Slack.

### Potential Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Card overlay link pattern breaks middle-click → "open in new tab" semantics | The overlay is still a real `<a href>`, so middle-click works. Verified against the linked-card recipe. |
| `scroll-padding-top` on `html` interferes with non-anchor scroll behaviour | Restrict to anchor-driven scroll via `:target` selector if regressions appear; default behaviour is benign. |
| Removing `preload` introduces FOIT on default-theme display headings | Keep `display: "swap"` (already set on every font); FOUT is preferred over FOIT and is the existing behaviour. |
| `process.env.VERCEL_URL` undefined in local dev | Falls back to hardcoded production URL — same behaviour as today. |
| Re-selecting the same status in the new submenu silently does nothing — looks broken | The menu still closes; if user reports confusion, add a transient "No change" inline hint. Out-of-scope unless flagged in QA. |
| Touch-drag pointer capture conflicts with parent scrolling on mobile | `touch-action: none` is scoped to the rating row only; vertical page scroll outside the row is unaffected. Verified pattern in shadcn/ui slider. |

---

## 4. Testing Strategy

### Unit / component (Vitest + RTL, `test:components`)

- **`widgets/game-card/`** — assert: action region buttons are not nested inside `<a>` (`getByRole('link')` does not contain `getByRole('button')`); middle-click on a button does not navigate; right-click on a button does not produce a link context menu (assert `dataTransfer` not set on dragstart).
- **`shared/components/ui/rating-input`** — pointer-down + pointer-move sequence updates value; `touch-action: none` style applied; arrow-key keyboard contract.
- **`features/library/ui/library-card-menu`** — current status renders with `aria-checked="true"`; re-selecting active status closes menu without firing the server action.
- **`app/page.tsx`** — `<main id="main-content">` present; both logo `<Image>` instances have `alt=""`.

### Integration / E2E (Playwright, `test:e2e`)

Single new spec file `e2e/ui-hardening.spec.ts`:

- **Mobile clearance (390×844 viewport)** — scroll to bottom of Library, Journal, Profile, Settings, Dashboard; assert last list item's bounding rect is fully above the bottom-nav bounding rect (no intersection).
- **Card pointer events** — middle-click three-dot button asserts no new tab opens; right-click rating star asserts no "Open Link in New Tab" menu item (via context-menu handler interception).
- **Skip link on /** — Tab once, assert visible; press Enter, assert focus moves into `<main>` and next Tab targets a control inside main.
- **Preview-deployment metadata** — covered by a manual QA paste-test (Slack/Discord) on the next preview deployment; not automated.

### Performance (manual + Lighthouse CI)

- Run Lighthouse mobile audit on `/` cold-load, "Slow 4G" profile. Assert LCP < 2.5s and font-payload transfer ≤ 50% of current baseline. Capture before/after numbers in the PR description.

### Accessibility

- `axe-core` run on `/` (already wired into `e2e/`): assert zero new violations and that the prior "missing main landmark on /" finding is gone.
- Manual screen-reader pass (VoiceOver iOS) on landing page header and footer to confirm brand name announced once per cluster.

---

## 5. Out-of-Scope Reminders

- No PWA / Web App Manifest work.
- No public-profile (`/u/<username>`) sitemap inclusion.
- No visual redesign of the cards beyond what is required to satisfy tap-target and pointer-event requirements.
- No moving the `auth() → redirect("/dashboard")` call out of `app/page.tsx` into middleware (separate caching spec; called out in audit but explicitly *not* picked up here).
