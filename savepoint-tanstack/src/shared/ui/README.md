# shared/ui

Primitives are the stock shadcn `base-maia` output (`shadcn view <name>` / `shadcn add` in a scratch directory outside the repo, never against the repo), with `cn` imported from `@/shared/lib/utils` and `lucide-react` icons. Re-pulled with `shadcn@4.23.0`.

## Deviations from stock (review on every re-pull)

| Deviation                                                                                                                                                                                                                                                                                                                                                                                                  | Files                                                    | Why (spec 027)                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button sizes `default h-11 md:h-9`, `sm h-11 md:h-8`, `lg h-11 md:h-10`, `icon size-11 md:size-9`, `icon-sm size-11 md:size-8`, `icon-lg size-11 md:size-10`; `xs` and `icon-xs` keep their size and get a 44px hit area (`after:-inset-2.5`)                                                                                                                                                              | `button.tsx`                                             | 44 x 44 tap targets on phone (§2.6)                                                                                                                                                                                                                         |
| Input, textarea, command input, select trigger are `text-base md:text-sm`; `Input` is `h-11 md:h-9`; select trigger is `h-11 md:h-9` (`sm`: `h-10 md:h-8`); command input wrapper is `h-11 md:h-9`                                                                                                                                                                                                         | `input.tsx`, `textarea.tsx`, `command.tsx`, `select.tsx` | No iOS zoom on focus (§2.6)                                                                                                                                                                                                                                 |
| Focus ring is solid `ring-ring` (stock is `ring-ring/50`)                                                                                                                                                                                                                                                                                                                                                  | all                                                      | Focus visibility at >= 3:1 (§2.7). `aria-invalid` rings stay at stock `/20`                                                                                                                                                                                 |
| `SheetContent` bottom: `max-h-[90dvh] overflow-y-auto rounded-t-xl`; `SheetContent` carries the side inset (`px-6`) and `SheetHeader` and `SheetFooter` are vertical-only (`py-6`) so sheet bodies are not edge to edge; `SheetBody` (`min-h-0 flex-1 overflow-y-auto`) is the scroll area and `SheetFooter` is `sticky bottom-0 bg-popover` with `pb-safe` and a `1.5rem` floor (`[--safe-floor:1.5rem]`) | `sheet.tsx`                                              | Thumb zone, safe areas (§2.6). `pt-safe`, `pb-safe`, `pl-safe` and `pr-safe` in `styles.css` pad to `max(var(--safe-floor, 0px), env(safe-area-inset-*))`; set the floor with `[--safe-floor:<length>]` where the element needs padding when the inset is 0 |
| `Toaster` reads `resolvedTheme` (light or dark, "system" already resolved by the app provider) from `@/shared/lib/theme` (not `next-themes`); `mobileOffset.bottom` is `calc(var(--bottom-nav-height) + 0.5rem)`; the unresolved `cn-toast` class is dropped                                                                                                                                               | `sonner.tsx`                                             | Dark toasts (§2.2); Undo stays above the bottom nav                                                                                                                                                                                                         |
| `SelectContent` defaults `alignItemWithTrigger` to `false`                                                                                                                                                                                                                                                                                                                                                 | `select.tsx`                                             | Release 1 fix: popup anchors under the trigger                                                                                                                                                                                                              |
| `CommandInput` uses a plain wrapper instead of stock `InputGroup`                                                                                                                                                                                                                                                                                                                                          | `command.tsx`                                            | `input-group` is not a repo primitive                                                                                                                                                                                                                       |

## API-preserving deviations (stock dropped what call sites use)

| Primitive   | Kept                                                                                                                                         | Notes                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `Button`    | `loading` prop, `ButtonProps`                                                                                                                | Stock has neither                                                         |
| `Badge`     | variants `subtle`, `playstation`, `xbox`, `nintendo`, `pc` (all one neutral `bg-muted` treatment), `want`, `playing`, `done` (status tokens) | Platform hexes are gone (owner decision)                                  |
| `Alert`     | variants `error` (same as `destructive`), `success`, `warning`, `info`; `AlertProps`                                                         | Tinted text on `bg-card`                                                  |
| `Separator` | `decorative` prop (`role="none"` when true, default)                                                                                         | Tests and call sites rely on it                                           |
| `Card`      | `variant` `default` / `flat` (stock look) / `outlined` (`ring-foreground/25`)                                                                | Dropped unused `interactive`, `elevated`, header/content/footer `spacing` |

## Dropped (no call site)

`Button` `ghost-hover`; `Alert` `dismissible` / `onDismiss`; `Card` `interactive` / `elevated` / `spacing`; `CardProps` family types; `DropdownMenu*` `Circle` radio indicator (stock uses a check).

## Kept as-is

`form.tsx` (`base-maia` has no `form`; shadcn ships `field`). Only moved to stock tokens (`space-y-2`).

## Repo-owned primitives (not shadcn)

`SectionLabel`: the one section-label style (`text-muted-foreground text-sm font-medium`, body font, sentence case). Renders an `h2` by default; `as` switches to `h3`, `h4`, `p` or `span`. `PageHeader`: the one page-title style (`font-display`, `h1`; `font-display` is Zilla Slab and appears only on page titles, `DialogTitle`, `SheetTitle`, the landing headline and the product name) with optional `sub` and `actions`; no eyebrow. `StickyFooter`: the primary action row of a page form. Phone: `fixed inset-x-0` at the viewport bottom (`bottom-0` with `pb-safe`, `0.75rem` floor) with a `bg-background` top border and `px-4`, so the primary button is always in the thumb zone and stays put while the page scrolls, even on short forms. It renders an `aria-hidden` in-flow spacer (`md:hidden`) before the bar, sized to the bar's measured height via `ResizeObserver` (`h-17` until measured), so the last field is never covered. `aboveBottomNav` lifts the bar to `bottom-(--bottom-nav-height)` on screens that show the bottom nav (it already covers the home indicator). From `md` up it is a plain inline block with no border or background. Do not use `-mx-*` or `bg-*` overrides on phone; the bar is full width. Keep the submit inside the `<form>`; no ancestor of the bar may use `transform`, `filter` or `contain` (it would become the fixed containing block). Inside a sheet use `SheetFooter` instead, never both. `ModalBody` / `ModalFooter`: for content shared by both `ResponsiveModal` variants; they render `SheetBody` / `SheetFooter` (right-aligned row) on phone and a plain block / right-aligned row in the dialog.

## Contrast

WCAG 2.x ratios computed from the `styles.css` tokens (oklch to sRGB, channels clipped to gamut; translucent fills composited in sRGB space over the surface they sit on). Requirement: 4.5 for text, 3 for large text and for graphics and the focus ring. `src/shared/ui/contrast.test.ts` asserts the key pairs from `styles.css`, so a token edit that breaks one fails the unit suite. Text on disabled controls is exempt.

### Light

| Pair                                                                                                      | Ratio                     | Needs |
| --------------------------------------------------------------------------------------------------------- | ------------------------- | ----- |
| `foreground` on `background` / `card` / `popover` (body, labels, toast)                                   | 16.16 / 17.64 / 17.64     | 4.5   |
| `muted-foreground` on `background` / `card` / `popover` (muted, `SectionLabel`)                           | 5.84 / 6.38 / 6.38        | 4.5   |
| `muted-foreground` on `muted` / `secondary` / `accent` (`subtle` badge, hover)                            | 5.34 / 5.34 / 5.02        | 4.5   |
| Placeholder (`muted-foreground`) on `input/30` over `background` / `card`                                 | 5.34 / 5.69               | 4.5   |
| `primary-foreground` on `primary`; on `primary/90` (hover)                                                | 6.83; 5.55                | 4.5   |
| `secondary-foreground` on `secondary`                                                                     | 14.77                     | 4.5   |
| `foreground` on `accent` / `muted` (outline and ghost hover)                                              | 13.88 / 14.77             | 4.5   |
| `destructive` on `destructive/10` over `card`; on `/15` hover over `card` / `background`                  | 5.76; 5.23 / 4.81         | 4.5   |
| `destructive` on `popover` tint `/10` (dropdown item focus)                                               | 5.76                      | 4.5   |
| `destructive` on `card` / `background`                                                                    | 6.94 / 6.36               | 4.5   |
| Alert text on `card`: `success` / `warning` / `info`                                                      | 5.51 / 5.73 / 5.83        | 4.5   |
| Alert description (`/90`) on `card`: `success` / `warning` / `info` / `destructive`                       | 4.52 / 4.67 / 4.77 / 6.20 | 4.5   |
| `status-want/playing/done-foreground` on its status fill                                                  | 5.35 / 6.83 / 5.06        | 4.5   |
| `accent-text` (links) on `background` / `card` / `popover`                                                | 6.26 / 6.83 / 6.83        | 4.5   |
| `primary` fill against `background` / `card` (graphic)                                                    | 6.26 / 6.83               | 3     |
| `scrim-foreground` on `scrim/60` over a white cover (library status badge, profile caption, menu trigger) | 5.00                      | 4.5   |
| `scrim-foreground/80` on the profile cover gradient (`from-scrim/90`) over white                          | 12.35                     | 4.5   |
| `game-card` accent-cover title (`scrim-foreground`) on `status -> scrim` at 40 / 50 / 60 percent          | 9.65 to 13.56             | 4.5   |
| `fill-warning` rating stars on `card` / `background`                                                      | 5.73 / 5.25               | 3     |
| Focus ring (`ring`) against `background` / `card` / `popover`                                             | 6.26 / 6.83 / 6.83        | 3     |
| `QueueMarker` (`accent-text` on `primary/5`) over `background` / `card`                                   | 5.82 / 6.34               | 4.5   |
| Status-lens active chip count (`primary-foreground` on `primary`, no alpha)                               | 6.83                      | 4.5   |
| Focus ring against `accent` / `muted` / `secondary`                                                       | 5.38 / 5.72 / 5.72        | 3     |

### Dark

| Pair                                                                                             | Ratio                     | Needs |
| ------------------------------------------------------------------------------------------------ | ------------------------- | ----- |
| `foreground` on `background` / `card` / `popover` (body, labels, toast)                          | 16.04 / 15.03 / 15.03     | 4.5   |
| `muted-foreground` on `background` / `card` / `popover` (muted, `SectionLabel`)                  | 6.15 / 5.76 / 5.76        | 4.5   |
| `muted-foreground` on `muted` / `secondary` / `accent` (`subtle` badge, hover)                   | 5.15 / 5.15 / 4.85        | 4.5   |
| Placeholder (`muted-foreground`) on `input/30` over `background` / `card`                        | 5.76 / 5.46               | 4.5   |
| `primary-foreground` on `primary`; on `primary/90` (hover)                                       | 7.43; 6.21                | 4.5   |
| `secondary-foreground` on `secondary`                                                            | 13.43                     | 4.5   |
| `foreground` on `accent` / `muted` (outline and ghost hover)                                     | 12.65 / 13.43             | 4.5   |
| `destructive` on `destructive/15` over `card`; on `/20` hover over `card` / `background`         | 5.22; 4.76 / 5.18         | 4.5   |
| `destructive` on `popover` tint `/20` (dropdown item focus)                                      | 4.76                      | 4.5   |
| `destructive` on `card` / `background`                                                           | 6.50 / 6.93               | 4.5   |
| Alert text on `card`: `success` / `warning` / `info`                                             | 7.62 / 8.76 / 6.74        | 4.5   |
| Alert description (`/90`) on `card`: `success` / `warning` / `info` / `destructive`              | 6.38 / 7.31 / 5.68 / 5.47 | 4.5   |
| `status-want/playing/done-foreground` on its status fill                                         | 7.31 / 7.43 / 8.25        | 4.5   |
| `accent-text` (links) on `background` / `card` / `popover`                                       | 7.32 / 6.86 / 6.86        | 4.5   |
| `primary` fill against `background` / `card` (graphic)                                           | 7.32 / 6.86               | 3     |
| `scrim-foreground` on `scrim/60` over a white cover                                              | 5.00                      | 4.5   |
| `scrim-foreground/80` on the profile cover gradient (`from-scrim/90`) over white                 | 12.35                     | 4.5   |
| `game-card` accent-cover title (`scrim-foreground`) on `status -> scrim` at 40 / 50 / 60 percent | 5.78 to 10.25             | 4.5   |
| `fill-warning` rating stars on `card` / `background`                                             | 8.76 / 9.35               | 3     |
| Focus ring (`ring`) against `background` / `card` / `popover`                                    | 7.32 / 6.86 / 6.86        | 3     |
| `QueueMarker` (`accent-text` on `primary/5`) over `background` / `card`                          | 6.90 / 6.40               | 4.5   |
| Status-lens active chip count (`primary-foreground` on `primary`, no alpha)                      | 7.43                      | 4.5   |
| Focus ring against `accent` / `muted` / `secondary`                                              | 5.77 / 6.13 / 6.13        | 3     |

### Accent (slice 17, Plum)

`--primary` is `oklch(0.48 0.13 340)` in Light and `oklch(0.72 0.11 340)` in Dark; `--primary-foreground` and `--ring` are unchanged in role (`ring` follows `primary`). `--accent-text` is the token for accent-coloured text and is `var(--primary)` in both modes, because plum already holds 4.5:1 as a fill and as text on `background`, `card`, `popover` and the `primary/5` tint. It is a separate token so a future accent can split text from fill without editing call sites. Use `text-accent-text` for text and `bg-primary` / `ring-ring` for fills and focus.

The accent classes (`bg|text|border|ring|fill|...-primary`, `-accent-text`, `-primary-foreground`) are lint-restricted (`no-restricted-classes`, `ACCENT_ALLOWED_FILES` in `eslint.config.mjs`) to the primary button, selected or active items, Playing and links. Anything else uses a neutral token. Add a file to the allow-list only with one of those reasons. The Journal-entry hours and decorative icons moved to neutral tokens, so their old pairs are no longer listed.

### Changes (slice 14, hues unchanged)

| Token (mode)            | Old                     | New                    | Why                                                        |
| ----------------------- | ----------------------- | ---------------------- | ---------------------------------------------------------- |
| `--primary` (Light)     | `oklch(0.52 0.085 195)` | `oklch(0.5 0.085 195)` | Hovered primary button/badge text was 4.32 at `/90`        |
| `--destructive` (Light) | `oklch(0.55 0.2 25)`    | `oklch(0.48 0.2 25)`   | Tinted button/badge/dropdown text was 4.47, hover 3.80     |
| `--destructive` (Dark)  | `oklch(0.62 0.2 25)`    | `oklch(0.74 0.2 25)`   | Text on `card` was 4.47, tinted 3.84, hover 3.60           |
| `--success` (Light)     | `oklch(0.52 0.12 150)`  | `oklch(0.5 0.12 150)`  | Alert description at `/90` was 4.19                        |
| `--warning` (Light)     | `oklch(0.6 0.13 70)`    | `oklch(0.51 0.13 70)`  | Alert text was 3.94, description 3.38 (stars rise to 5.73) |
| `--info` (Light)        | `oklch(0.52 0.13 250)`  | `oklch(0.5 0.13 250)`  | Alert description at `/90` was 4.41                        |

Call-site changes (alpha and gradient, not tokens):

| Where                                                                                                                      | Old                                                                           | New                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `button.tsx` default hover, `badge.tsx` default link hover                                                                 | `hover:bg-primary/80`                                                         | `hover:bg-primary/90`                                                                 |
| `button.tsx` destructive                                                                                                   | `hover:bg-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30` | `hover:bg-destructive/15 dark:bg-destructive/15 dark:hover:bg-destructive/20`         |
| `badge.tsx` destructive                                                                                                    | `dark:bg-destructive/20 [a]:hover:bg-destructive/20`                          | `dark:bg-destructive/15 [a]:hover:bg-destructive/15 dark:[a]:hover:bg-destructive/20` |
| `library-status-badge.tsx` (text over a cover; was 4.17 over a white cover)                                                | `bg-scrim/55`                                                                 | `bg-scrim/60`                                                                         |
| `library-item-card.utility.ts` accent-cover gradient (light title on a gradient ending in cream was 1.03 to 1.71 in Light) | `to-background`                                                               | `to-scrim`                                                                            |
| `queue-marker.tsx` (was 4.46 in Light)                                                                                     | `bg-primary/10`                                                               | `bg-primary/5`                                                                        |
| `status-lens.tsx` active chip count (was 4.17 in Light)                                                                    | `opacity-80`                                                                  | no alpha                                                                              |
| `journal-entry-card.tsx` hours (was 3.15 Light, 4.28 Dark)                                                                 | `text-primary/70`                                                             | `text-primary`                                                                        |
| `game-detail.tsx` breadcrumb "/" (2.1 to 2.4; decorative)                                                                  | `opacity-50`                                                                  | kept, plus `aria-hidden="true"`                                                       |

Unused pair: `--warning-foreground` on `--warning` (nothing uses `bg-warning`); re-check it if a filled warning surface is added.

### Focus indicator

One base rule in `styles.css` (`@layer base`) gives every focusable element `outline: 2px solid var(--ring)` with a 2px offset, so raw `<a>` and `<button>` elements no longer fall back to the browser's `outline: auto` (was 2.1 to 2.8 once recoloured by `outline-ring/50`). The outline is drawn on the surrounding surface, so the ratios above for `ring` against `background` / `card` / `popover` / `accent` / `muted` / `secondary` apply, including for elements filled with `primary`.

Components that draw their own ring (`Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `TabsTrigger`, `RatingInput`, `SegmentedControl`) keep `outline-none` plus `focus-visible:ring-*`; a utility beats the base layer, so nothing is doubled. A new component needs one of the two: nothing (the base outline) or `outline-none` with its own ring. Never `outline-none` with no ring. `TabsContent` is focusable on purpose (keyboard users reach a scrollable panel), so it relies on the base outline.

Over cover art the library card menu trigger uses a two-tone box-shadow (2px `scrim-foreground` inside, 2px `scrim` outside). A single colour cannot hold 3:1 against every cover; the pair does, because `scrim` is near-black and `scrim-foreground` near-white. The worst case is a mid-grey cover (relative luminance about 0.17) at 4.38, where both bands are about equally distant; the test sweeps greys from black to white.
