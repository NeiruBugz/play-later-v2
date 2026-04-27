# Widget: header

Minimal top-bar header for unauthenticated routes (login screen) and the public profile route group (`/u/[username]`). Renders the brand mark and theme toggle. The `isAuthorised` prop tweaks visual emphasis only — the header has no nav links (those moved to `widgets/sidebar` on `md+` and `widgets/mobile-nav` on `<md`).

## Structure

- `ui/header.tsx` — `Header` client component

## Notes

- The mobile bottom nav previously co-located here was extracted to `widgets/mobile-nav` in spec-014 slice 3
- The authenticated `(protected)` and `games` layouts no longer mount this component — they use `widgets/mobile-topbar` on `<md` and `widgets/sidebar` on `md+`
