# Feature: browse-related-games

Displays franchise-related games on the game detail page. Uses a use-case to fetch franchise games from the DAL.

## Structure

- `use-cases/` -- `get-franchise-games` fetches related titles
- `ui/` -- related games grid with skeleton loading state

## Notes

- Server-only data fetching via `index.server.ts`
- Consumed by game detail page routes
