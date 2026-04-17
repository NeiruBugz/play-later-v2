# Feature: timeline

Chronological "Memories Timeline" view of a user's journal entries, grouped by ISO week. Within a week, multiple QUICK entries for the same game collapse into a single compressed card; REFLECTION entries always render individually.

## Structure

- `lib/bucket.ts` — ISO-week keying + bucketing logic (pure, unit-tested)
- `lib/bucket.unit.test.ts` — week-boundary, compression, and reflection/quick mixing tests
- `ui/timeline-view.tsx` — weekly sections, compressed QuickGroupCard, singleton via JournalEntryCard
- `index.server.ts` — barrel

## Notes

- Route: `app/(protected)/timeline/page.tsx` fetches up to 200 entries; no pagination yet.
- Reuses `JournalEntryCard` from `@/features/journal` for singletons.
- Week keying is UTC-stable (uses `getUTC*`) so display is deterministic regardless of server timezone.
- Compression threshold: 2 or more QUICK entries for the same game in the same ISO week.
