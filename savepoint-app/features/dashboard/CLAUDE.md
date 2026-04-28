# Feature: dashboard

Main dashboard view. The page leads with a reflection-first quick-log hero ("What did you play, {user}?") instead of a vanity welcome banner, then shows library stats, activity feed, continue-playing, up-next, and recently-added.

## Structure

- `server-actions/` -- dashboard data fetching
- `ui/quick-log-hero.tsx` -- server component that fetches up to 3 `PLAYING` games
- `ui/quick-log-hero-client.tsx` -- client: renders the games as tiles with Log (opens `JournalQuickEntrySheet` preselected to that game) and Reflect (links to `/journal/new?gameId=X`) buttons
- `ui/dashboard-stats.tsx`, `ui/continue-playing.tsx`, `ui/up-next.tsx`, `ui/recently-added.tsx` -- lower-priority sections
- `index.server.ts` -- barrel for server components consumed by the page

## Notes

- Consumes `onboarding`, `journal`, `library` (notably `LibraryCard`), and `social` features for cross-feature UI
- The hero sits above the onboarding checklist; the intent is that returning users land on "log tonight's session" as the first action
- Stats are demoted below the hero so the dashboard can't feel like an empty collection on small libraries
