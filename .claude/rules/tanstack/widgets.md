---
description: Rules for the FSD `widgets/` layer in savepoint-tanstack (composite UI blocks)
paths:
  - "savepoint-tanstack/src/widgets/**/*"
---
# Rules — `widgets/` layer

Composite UI blocks. Widgets compose features + entities + shared/ui;
they do NOT implement business logic.

## Rules

- **Rule:** every widget is its own folder with a barrel + `.type.ts` + colocated `.test.tsx`. **Why:** parent CLAUDE.md "Component file conventions"; supports test isolation.
- **Rule:** widgets compose features (for CTAs/mutations) + entities (for display) + shared/ui (for primitives). They do not implement business logic. **Why:** business logic belongs in features' `api/`.
- **Rule:** prefer slot props (`ReactNode`) over direct feature imports when the widget is a layout template (e.g., `auth-page`, `game-detail`). **Why:** keeps widgets pure and testable; route owns Suspense / wiring.
- **Rule:** CVA — declare all axes at the type level, but populate compound entries only for currently-consumed combinations. Mark unpopulated axes with a "Deferred" comment. **Why:** forward-compatible types without dead variant CSS.
- **Rule:** no arbitrary Tailwind values (`bg-[#hex]`, `w-[123px]`). Use design tokens or the Tailwind theme. **Why:** one source of truth for color/spacing/typography.
- **Rule:** cover alt-text convention is `"Cover for {title}"` everywhere. **Why:** consistent screen-reader UX across the app.
- **Rule:** widgets that render `<Link>` mock `@tanstack/react-router` in their tests using the `to + params` → `<a>` shape. **Why:** avoids needing a full `RouterProvider` in component tests.
- **Rule:** routes own `<Suspense>` and per-section error boundaries for slot-based widgets. Widgets accept resolved data as a prop. **Why:** separates plumbing (route) from presentation (widget).
- **Rule:** CVA configs live next to the widget that uses them, not in a shared `lib/`. **Why:** variant axes are widget-specific.

## Documented exceptions

### Widget-to-widget imports

FSD nominally forbids sibling-to-sibling imports. The codebase has two intentional carve-outs:

- `widgets/library-page/` → `widgets/library-item-card/`
- `widgets/library-item-card/` → `widgets/game-card/` (extends GameCard's shape)

Both are justified in [`../../../savepoint-tanstack/DIVERGENCES.md`](../../../savepoint-tanstack/DIVERGENCES.md) (LibraryItemCard widget move post-Slice 14A). When introducing a new widget-to-widget import:

- The importer must fundamentally extend the importee's shape (composition, not coincidence).
- Document the import with an inline comment pointing to the new DIVERGENCES.md entry.
- If you can solve it with a slot prop instead, prefer that.

## See also

- [`testing.md`](./testing.md) — elements/actions/given-when-then test shape
- [`../../../savepoint-tanstack/DIVERGENCES.md`](../../../savepoint-tanstack/DIVERGENCES.md) — widget-to-widget carve-out context
