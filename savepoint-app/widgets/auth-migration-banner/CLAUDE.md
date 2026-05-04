# Widget: auth-migration-banner

48-hour pre-cutover banner notifying signed-in users that the auth system is being upgraded and they will be signed out at the cutover moment. Spec 020 §2.4.

## Structure

- `ui/auth-migration-banner.tsx` — server component. Reads cutover via `getCutoverAt()`/`isInBannerWindow()` from `features/auth/lib/cutover`. Renders nothing outside the 48h window. Formats the cutover date as a human-readable UTC string and passes it to the client island.
- `ui/auth-migration-banner-client.tsx` — `"use client"` island handling per-browser dismissal via `localStorage["auth_migration_dismissed"]`.

## Notes

- Visibility-by-auth (signed-in only) is the responsibility of the consuming layout, not this widget.
- Auto-hides post-cutover because `isInBannerWindow` returns false; signed-in users hitting any page post-cutover are forced through middleware → `/login` anyway, so this is belt-and-braces.
- Date formatting is server-side (`Intl.DateTimeFormat` with `timeZone: "UTC"`) so SSR/CSR markup matches.
- Hydration-safe pattern: the banner renders by default; the client island reads `localStorage` in `useEffect` and unmounts itself if dismissed (brief flash on dismissed reloads is acceptable).
