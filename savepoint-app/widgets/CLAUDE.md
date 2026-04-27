# Widgets Layer

Compositional UI blocks that combine features and shared components into larger page sections. Widgets sit between the `app/` and `features/` layers in the FSD hierarchy.

## Import Rules

Widgets CAN import from:
- `features/` (public API only)
- `shared/`

Widgets CANNOT import from:
- `app/`
- `data-access-layer/`
- Other widgets (keep widgets independent)

## Current Widgets

| Widget | Purpose |
|--------|---------|
| `header/` | Unauth-only top-bar header (login screen + public profile route group); brand + theme toggle |
| `sidebar/` | Desktop left-rail navigation for `md+` viewports (spec-014 slice 2) |
| `mobile-topbar/` | Sticky top app-bar on `<md` for authenticated routes; brand mark, search trigger, theme toggle (spec-014 slice 3) |
| `mobile-nav/` | Bottom tab bar on `<md` for authenticated routes; primary destinations (Library, Journal, Profile) (spec-014 slice 3) |
| `settings-rail/` | Section navigation for the `/settings` shell (Profile, Account) |
| `game-card/` | Compound game card component with cover, content, header, meta, footer, skeleton, and genre badges |

## Structure Convention

Each widget uses FSD segments: `ui/` for components and types, `lib/` for variants and utilities. Public API is exported via `index.ts` barrel.
