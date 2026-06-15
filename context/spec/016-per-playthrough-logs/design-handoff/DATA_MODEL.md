# Data model — Per-Playthrough Logs

Prisma changes, server functions, and the status-derivation wiring. Names follow
the repo's conventions (`*.server.ts` data fns, `*-fn` server-function wrappers,
zod validation). Adjust to match the exact Prisma client path used in
`src/shared/lib/prisma`.

## 1. New model: `Playthrough`

```prisma
enum PlaythroughKind {
  FIRST
  REPLAY
}

enum PlaythroughStatus {
  PLAYING
  FINISHED
  ABANDONED
}

model Playthrough {
  id              String            @id @default(cuid())
  libraryItem     LibraryItem       @relation(fields: [libraryItemId], references: [id], onDelete: Cascade)
  libraryItemId   String
  ordinal         Int                                  // 1-based, per library item
  kind            PlaythroughKind   @default(REPLAY)
  status          PlaythroughStatus @default(PLAYING)
  platform        String?                              // free string or a Platform enum if one exists
  startedAt       DateTime?
  finishedAt      DateTime?
  playtimeMinutes Int               @default(0)
  rating          Int?                                 // 1–10, matches LibraryItem.rating scale
  completion      String?                              // "Platinum", "100%", "Story", …
  notes           String?
  journalEntries  JournalEntry[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([libraryItemId])
  @@unique([libraryItemId, ordinal])
}
```

Notes:
- `playtimeMinutes` (not hours) stays consistent with `YourRecordPanel`'s existing
  minutes→hours conversion.
- `rating` reuses the existing **1–10** scale (UI shows 0–5 half-stars).
- Keep `platform` a string to start (the prototype uses `PS5/PS4/PC/Xbox/Switch`).
  Promote to an enum later if platform analytics need it.

## 2. Modify `JournalEntry`
Add an optional link so an entry belongs to a specific run. Nullable keeps
existing/legacy entries valid.

```prisma
model JournalEntry {
  // …existing fields…
  playthrough     Playthrough? @relation(fields: [playthroughId], references: [id], onDelete: SetNull)
  playthroughId   String?

  @@index([playthroughId])
}
```

## 3. Modify `LibraryItem`
Add the back-relation and a derived-status helper. Two valid strategies — pick
one:

```prisma
model LibraryItem {
  // …existing fields…
  playthroughs    Playthrough[]
  // `status` already exists (LibraryItemStatus). hasBeenPlayed already exists.
}
```

- **(A) Derive on read (preferred, no drift):** keep `status` only as the
  manual *pre-play* value (Wishlist/Shelf/Up Next). Compute the effective status
  from playthroughs in the route loader / a selector and pass it to the UI.
- **(B) Persist on write:** recompute `status` + `hasBeenPlayed` inside every
  playthrough create/update/delete mutation (single transaction). Simpler reads,
  but you must cover all write paths.

Either way, the rule is the same:

```ts
// entities/library-item/model/derive-status.ts
export function deriveLibraryStatus(
  playthroughs: { status: PlaythroughStatus }[],
  manualPrePlay: LibraryItemStatus, // WISHLIST | SHELF | UP_NEXT
): LibraryItemStatus {
  if (playthroughs.length === 0) return manualPrePlay;
  if (playthroughs.some(p => p.status === 'PLAYING'))  return 'PLAYING';
  if (playthroughs.some(p => p.status === 'FINISHED')) return 'PLAYED';
  return 'PLAYED'; // only ABANDONED → still "experienced"  (confirm w/ design)
}

export function deriveHasBeenPlayed(
  playthroughs: { status: PlaythroughStatus }[],
): boolean {
  return playthroughs.some(p => p.status === 'FINISHED' || p.status === 'ABANDONED');
}
```

## 4. Server functions (`entities/playthrough/api/`)

```
create-playthrough.server.ts   // input: { libraryItemId, kind, platform, status,
                               //          startedAt?, finishedAt?, playtimeMinutes,
                               //          rating?, completion?, notes? }
                               // - assigns next ordinal (max+1 for the item)
                               // - if kind FIRST already exists, coerce to REPLAY
                               // - after write: sync library status (strategy B) or noop (A)
update-playthrough.server.ts   // input: { id, ...partial }  → re-sync status
delete-playthrough.server.ts   // → re-number ordinals? (or leave gaps) → re-sync status
get-playthroughs.server.ts     // by libraryItemId, include journalEntries, order by ordinal desc
```

Modify the journal create fn:
```
compose-journal-entry: add `playthroughId` to input; in the same transaction add
`hours*60` to that playthrough's `playtimeMinutes`. Validate the playthrough
belongs to the same library item / user.
```

All mutations: ownership check (Better Auth user owns the `LibraryItem`),
`router.invalidate()` on the client after success, optimistic update mirroring the
existing `YourRecordPanel` / `LibraryStatusSwitcher` patterns.

## 5. Route loader
In `routes/games.$slug.tsx`, extend the existing detail query to include the
entry's playthroughs (with journal entries). Feed:
- `PlaythroughsPanel` ← `playthroughs`
- `JournalFeed` ← flattened entries (carry each entry's run label via
  `playthroughId`)
- `LibraryStatusSwitcher` ← `deriveLibraryStatus(...)` + `deriveHasBeenPlayed(...)`
- `TimesToBeatPanel` ← `Σ playtimeMinutes` (today it uses the single record total)

## 6. Migration / backfill
Existing entries have a single implicit "record" (playtime + rating on
`LibraryItem`, and journal entries). Backfill one `Playthrough` per played
library item:
- `ordinal = 1`, `kind = FIRST`
- `status`: `PLAYED`→`FINISHED`, `PLAYING`→`PLAYING`, else skip (no run for
  Wishlist/Shelf/Up Next)
- `playtimeMinutes` = the item's existing total, `rating` = item's rating
- Re-point that item's `JournalEntry.playthroughId` to this run.
Leave Wishlist/Shelf/Up Next items with **zero** playthroughs (status stays
manual until the user starts a run).

## 7. Test surface (mirror existing `*.unit.test.ts` / `*.test.tsx`)
- `deriveLibraryStatus` truth table (empty, playing, finished, abandoned, mixed).
- `deriveHasBeenPlayed` → Up Next renders "Replay".
- create assigns ordinal + coerces second FIRST→REPLAY.
- log-session increments the right run's `playtimeMinutes` and sets
  `playthroughId`.
- aggregate selector (total / best rating / completion).
