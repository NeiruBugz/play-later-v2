# shared/ui

Primitives are the stock shadcn `base-maia` output (`shadcn view <name>` / `shadcn add` in a scratch directory outside the repo, never against the repo), with `cn` imported from `@/shared/lib/utils` and `lucide-react` icons. Re-pulled with `shadcn@4.23.0`.

## Deviations from stock (review on every re-pull)

| Deviation                                                                                                                                                                                                                                                                                                                  | Files                                                    | Why (spec 027)                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Button sizes `default h-11 md:h-9`, `sm h-11 md:h-8`, `lg h-11 md:h-10`, `icon size-11 md:size-9`, `icon-sm size-11 md:size-8`, `icon-lg size-11 md:size-10`; `xs` and `icon-xs` keep their size and get a 44px hit area (`after:-inset-2.5`)                                                                              | `button.tsx`                                             | 44 x 44 tap targets on phone (§2.6)                                             |
| Input, textarea, command input, select trigger are `text-base md:text-sm`; `Input` is `h-11 md:h-9`; select trigger is `h-11 md:h-9` (`sm`: `h-10 md:h-8`); command input wrapper is `h-11 md:h-9`                                                                                                                         | `input.tsx`, `textarea.tsx`, `command.tsx`, `select.tsx` | No iOS zoom on focus (§2.6)                                                     |
| Focus ring is solid `ring-ring` (stock is `ring-ring/50`)                                                                                                                                                                                                                                                                  | all                                                      | Focus visibility at >= 3:1 (§2.7). `aria-invalid` rings stay at stock `/20`     |
| `SheetContent` bottom: `max-h-[90dvh] overflow-y-auto rounded-t-xl`; `SheetContent` carries the side inset (`px-6`) and `SheetHeader` and `SheetFooter` are vertical-only (`py-6`) so sheet bodies are not edge to edge; `SheetFooter` is `sticky bottom-0 bg-popover` with `pb-[max(1.5rem,env(safe-area-inset-bottom))]` | `sheet.tsx`                                              | Thumb zone, safe areas (§2.6). Slice 11 swaps the arbitrary value for `pb-safe` |
| `Toaster` reads `resolvedTheme` (light or dark, "system" already resolved by the app provider) from `@/shared/lib/theme` (not `next-themes`); `mobileOffset.bottom` is `calc(var(--bottom-nav-height) + 0.5rem)`; the unresolved `cn-toast` class is dropped                                                               | `sonner.tsx`                                             | Dark toasts (§2.2); Undo stays above the bottom nav                             |
| `SelectContent` defaults `alignItemWithTrigger` to `false`                                                                                                                                                                                                                                                                 | `select.tsx`                                             | Release 1 fix: popup anchors under the trigger                                  |
| `CommandInput` uses a plain wrapper instead of stock `InputGroup`                                                                                                                                                                                                                                                          | `command.tsx`                                            | `input-group` is not a repo primitive                                           |

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

`SectionLabel`: the one section-label style (`text-muted-foreground text-sm font-medium`, body font, sentence case). Renders an `h2` by default; `as` switches to `h3`, `h4`, `p` or `span`. `PageHeader`: the one page-title style (`font-display`, `h1`) with optional `sub` and `actions`; no eyebrow.
