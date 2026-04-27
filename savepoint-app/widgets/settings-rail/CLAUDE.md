# Widget: settings-rail

Left-rail section navigation for the `/settings` shell. Lists settings sub-pages (Profile, Account) with active-state highlighting derived from `usePathname`.

## Structure

- `ui/settings-rail.tsx` — `SettingsRail` client component

## Notes

- Active section is determined by exact-match against `usePathname()`
- Mobile: full-width rounded items in a stacked list
- Desktop (`md+`): left-border accent on the active item

## Import Rules

- Imports `cn` from `shared/lib/ui/utils`
- Must NOT import from `app/`, `features/`, other `widgets/`, or `data-access-layer/`
