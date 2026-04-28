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

## Responsive layout map

- **`<md`** authenticated routes: `mobile-topbar` (top) + `mobile-nav` (bottom).
- **`md+`** authenticated routes: `sidebar` (left rail). No mobile-topbar / mobile-nav.
- **Unauth + `/u/[username]` public profile**: `header` only. The legacy `header` is no longer mounted on protected layouts.
- The shadcn `Sidebar` primitive's offcanvas mode is unused — `mobile-nav` handles `<md` instead.

## Trip-wires

1. **The global ⌘K binding is owned by `command-palette` only.** Do not bind ⌘K elsewhere; trigger the palette via `useCommandPaletteContext().open()` from `mobile-topbar`, `sidebar`, or any new surface.
2. **Widgets cannot import from other widgets.** If two widgets need shared UI, lift it to `shared/components/`.
3. **Widgets cannot fetch data.** Pass server-loaded props from the layout (Server Component) — no `data-access-layer` imports, no client-side queries owning the request.
4. **`y2k:` Tailwind classes in `mobile-nav` are intentional** theme tokens, not legacy holdover. Configured in `tailwind.config`.
5. **Sidebar collapse state is cookie-backed** via the shadcn `SidebarProvider`. Do not add a parallel state machine.
6. **`sidebar-user-menu` calls `signOut()` from `next-auth/react` directly** to avoid a cross-feature import for logout. Mirror this pattern if adding new sign-out surfaces.
