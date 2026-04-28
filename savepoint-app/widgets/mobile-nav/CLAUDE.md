# Widget: mobile-nav

Bottom tab bar for `<md` viewports on authenticated routes. Primary destinations: Library, Journal, Profile (Search moved to the mobile top-bar; Dashboard is reachable via the brand mark).

## Structure

- `ui/mobile-nav.tsx` — `MobileNav` client component

## Notes

- Sticky to the viewport bottom with `safe-area-inset-bottom` padding
- 44pt minimum hit targets for accessibility
- Carries its own `md:hidden` so the layout does not need to wrap it
- `y2k:` classes are intentional theme tokens (see `tailwind.config`) — used in `ui/mobile-nav.tsx` to mirror the legacy nav

## Import Rules

- Imports `cn` from `shared/lib/ui/utils`
- Must NOT import from `app/`, `features/`, other `widgets/`, or `data-access-layer/`
