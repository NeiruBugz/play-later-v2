# Feature: dashboard

Main dashboard view showing play stats, continue-playing, recently-added, and up-next sections.

## Structure

- `server-actions/` -- dashboard data fetching
- `ui/` -- stats cards, continue-playing, recently-added, up-next sections

## Notes

- Consumes `onboarding`, `journal`, and `library` features for cross-feature UI
- Server-side data loading via `index.server.ts`
