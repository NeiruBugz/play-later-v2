# 14A Tailwind Tokens Audit

**Date:** 2026-05-07
**Scope:** Full canonical token surface — not 14A-surface-restricted (per spec line 276 parenthetical: "tokens are global, not surface-specific; 18A inherits the result").
**Canonical source:** `savepoint-app/shared/globals.css` (Tailwind v4 CSS-first, single global stylesheet; no `tailwind.config.ts`).
**Tanstack target:** `savepoint-tanstack/src/styles.css` (Tailwind v4 CSS-first, `@theme inline {}` block).

---

## Headline finding

**Zero tokens needed translation.** `savepoint-tanstack/src/styles.css` is already a verbatim port of `savepoint-app/shared/globals.css`. Every status, semantic, spacing, typography, radius, motion, shadow, and platform-brand token from canonical exists on tanstack with identical values across all four theme variants (`:root` Paper, `.dark` Boxart, `.y2k` Xbox, `.jewel`, `.aurora`).

The only delta between the two files is an additive 11-line `:root` block at the top of `styles.css` declaring `--font-default-sans`, `--font-default-mono`, `--font-paper-display`, `--font-cartridge-{display,sans,mono}`, `--font-aurora-{display,mono}` font-family fallbacks. These are required because tanstack does not run Next.js's font loader, which is what injects `--font-*` custom-property aliases on the canonical app. They are font-family fallbacks, not new design tokens.

`diff savepoint-app/shared/globals.css savepoint-tanstack/src/styles.css` produces 12 lines of output (the additive font block + a trailing blank line) — line counts 2649 vs 2660.

## Verification

- `pnpm --filter savepoint-tanstack typecheck` — clean.
- `pnpm --filter savepoint-tanstack lint` — clean.

## Tokens already present on tanstack (full list, by category)

### Status tokens (per-theme override, four variants × five statuses × foreground)

`--status-wishlist`, `--status-wishlist-foreground`, `--status-shelf`, `--status-shelf-foreground`, `--status-upNext`, `--status-upNext-foreground`, `--status-playing`, `--status-playing-foreground`, `--status-played`, `--status-played-foreground` — defined in `:root` (Paper), `.dark` (Boxart), `.y2k`, `.jewel`, `.aurora`. Identical hue/lightness values across both apps.

Note on naming: canonical uses camelCase (`--status-upNext`) inside the CSS variable token despite the surrounding kebab-case convention. Tanstack preserves this verbatim — do NOT rename to `--status-up-next` or consumers will break. (Both apps' badge/button consumers query `var(--status-upNext)` literally.)

### Semantic colors

`--background`, `--foreground`, `--foreground-body`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-active`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--surface-hover`, `--surface-active`, `--destructive`, `--destructive-foreground`, `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--info`, `--info-foreground`, `--border`, `--input`, `--ring` — all four theme variants.

### Sidebar tokens

`--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring` — all four theme variants.

### Chart palette

`--chart-1` through `--chart-5` — all four theme variants.

### Platform brand colors

`--color-nintendo`, `--color-playstation`, `--color-xbox`, `--color-pc`.

### Typography ramp

Display: `--font-size-display-{2xl,xl,lg}` + matching `--font-line-height-display-*` + `--font-letter-spacing-display-*`.
Heading: `--font-size-heading-{xl,lg,md,sm,xs}` + matching line-height + letter-spacing.
Body: `--font-size-body-{lg,md,sm,xs}` + matching line-height.
Caption / overline: `--font-size-caption`, `--font-line-height-caption`, `--font-letter-spacing-caption`, `--font-size-overline`, `--font-line-height-overline`, `--font-letter-spacing-overline`.
Weights: `--font-weight-{display,heading,subheading,body,caption}`.
Family routing: `--font-runtime-sans`, `--font-runtime-mono`, `--font-display`.

### Radii (per-theme override)

`--radius`, `--radius-card`, `--radius-cover`, `--radius-btn`, `--radius-chip` — every theme overrides these.

### Shadows (per-theme override)

`--shadow-paper-sm`, `--shadow-paper`, `--shadow-paper-md`, `--shadow-paper-lg`, `--shadow-cover`, `--shadow-btn`.

### Spacing scale (semantic)

`--space-xs` (4px) through `--space-5xl` (96px) plus legacy aliases `--space-compact`, `--space-comfortable`, `--space-spacious`.

### Motion

`--duration-{instant,fast,normal,slow,slower}`, `--ease-out-expo`, `--ease-out-back`, `--ease-in-out`.

### `@theme inline {}` block

Both apps map every CSS custom property above into Tailwind v4's theme namespace (`--color-*`, `--font-*`, `--radius-*`, `--spacing-*`, etc.) so utilities like `bg-status-playing`, `text-status-shelf-foreground`, `space-y-3xl`, `rounded-card` resolve. The block is byte-identical between the two files.

## Tokens added in this audit

**None.** All tokens were already present.

## Deliberate naming deviations from canonical

**None.** Token names match canonical 1:1, including the camelCase exceptions (`--status-upNext`) and the `radius-*` / `shadow-paper-*` semantic-name suffixes.

The additive `:root` block at the top of `styles.css` (font-family fallbacks for `--font-default-*`, `--font-paper-display`, `--font-cartridge-*`, `--font-aurora-*`) is **not** a deviation in design intent — those custom properties exist on canonical too, but are populated by Next.js's `next/font/local` loader at the layout level. Tanstack has no equivalent loader, so the fallback families are declared statically. Identical net effect at the consumer (`var(--font-paper-display)` resolves either way).

## Implication for downstream 14A subtasks

GREEN tasks (status badges, filter sidebar, mobile filter bar, sidebar user menu, etc.) can author Tailwind utilities or arbitrary `var(--status-*)` references without any further token plumbing. The 18A re-audit will be a no-op on the token axis.
