# Widget: sidebar

Desktop left-rail navigation for `md+` viewports. Replaces the top-bar nav on desktop. Uses the shadcn `Sidebar` primitive with cookie-backed collapse state.

## Structure

- `ui/sidebar.tsx` — `AppSidebar` client component: brand mark, primary nav (Library / Journal / Profile / Settings), search trigger, user menu, theme toggle
- `ui/sidebar-search-trigger.tsx` — icon button that opens the command palette via `useCommandPaletteContext().open()`
- `ui/sidebar-user-menu.tsx` — dropdown with profile/account links and sign-out; calls `signOut()` from `next-auth/react` directly (no cross-feature import for logout)

## Props

`AppSidebar` accepts `displayName: string` and `avatarUrl: string | null` passed from the server-component layout.

## Import Rules

- Imports `command-palette` from `features/` (authorized in `features/CLAUDE.md`)
- Imports `ThemeToggle` from `shared/components/`
- Imports shadcn primitives from `shared/components/ui/`
- Must NOT import from `app/`, `pages/`, other `widgets/`, or `data-access-layer/`

## Layout Integration

`AppSidebar` is rendered inside `SidebarProvider` in `app/(protected)/layout.tsx` and `app/games/layout.tsx`.
On `md+` the rail is visible; on `<md` the `Sidebar` primitive renders as an offcanvas sheet (not used — the mobile MobileNav handles `<md`).
