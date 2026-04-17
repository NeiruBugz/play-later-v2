# Feature: journal

Gaming journal for logging play sessions and long-form reflections. Entries are tied to a game (schema allows null `gameId` but the UI only exposes game-tied entries in MVP).

## Entry model

`JournalEntry` has a discriminator field `kind: QUICK | REFLECTION`:

- **QUICK** — default for the quick-entry sheet. Captures `playedMinutes` + optional `content`, `mood`, and `tags`. Content is optional; either playtime or a note must be present.
- **REFLECTION** — long-form editor with title + rich content. Reached via `/journal/new` or the "Reflect" button on dashboard / game detail.

Additional optional fields on every entry: `mood` (JournalMood enum), `tags` (string[]).

## Structure

- `hooks/` -- journal entry dialog state
- `schemas.ts` -- Zod schemas for create/update; bounds on tags (max 10 × 30 chars) and `playedMinutes` (1..10080)
- `server-actions/` -- create, update, delete entries; fetch helpers
- `ui/journal-entry-quick-form.tsx` -- QUICK form (playtime-led, optional note, mood chips, tags)
- `ui/journal-entry-form.tsx` -- REFLECTION form (title + rich content)
- `ui/journal-quick-entry-sheet.tsx` -- sheet wrapper; accepts `preselectedGame` prop for dashboard/game-detail tiles
- `ui/journal-entry-card.tsx` -- dual-variant card (compact for QUICK, rich for REFLECTION)
- `ui/journal-fab.tsx` -- hidden on `/journal*`, `/games/:slug`, and below md breakpoint

## Notes

- Exported for cross-feature use by `game-detail`, `dashboard`, and `timeline`
- Mood label pairs (enum → UI copy): EXCITED→Hyped, RELAXED→Chill, FRUSTRATED→Fried, ACCOMPLISHED→Proud, CURIOUS→Curious, NOSTALGIC→Nostalgic
- Tag input is comma-separated free-form; parsed and deduped client-side before submit
