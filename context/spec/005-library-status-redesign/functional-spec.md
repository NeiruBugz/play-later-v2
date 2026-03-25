# Library Status Redesign: Shelf + Up Next Model

## Problem

The current 4-status model (`WANT_TO_PLAY`, `OWNED`, `PLAYING`, `PLAYED`) has usability issues surfaced by real user feedback:

1. **"Owned" is confusing** — user quote: "Don't understand how to use Owned list. Something like simple title management?"
2. **No "want to replay" intent** — user wants to mark games for future replay without moving them to Playing (which implies active engagement)
3. **No single "what can I play?" view** — user wants one page showing everything playable
4. **Status labels don't map to mental models** — "Owned" mixes possession with activity; users think in terms of intent and engagement

## Solution

Replace 4 statuses with 5, using a single flat enum. Each status answers a distinct user question.

### Status Model

| Status | DB Enum | Meaning | User question | Owns game? |
|--------|---------|---------|---------------|------------|
| Wishlist | `WISHLIST` | Want it someday | "What do I want to buy?" | No |
| Shelf | `SHELF` | Own it, sitting there | "What do I have?" | Yes |
| Up Next | `UP_NEXT` | Want to play or replay | "What should I play?" | Yes |
| Playing | `PLAYING` | Actively engaged now | "What am I playing?" | Yes |
| Played | `PLAYED` | Have experienced | "What have I played?" | Yes |

### New Field: `hasBeenPlayed`

A boolean on `LibraryItem`, default `false`. Set to `true` whenever a game transitions to `PLAYED`. Never reset.

Purpose: when a Played game moves to `UP_NEXT`, the UI badge shows "Replay" instead of "Up Next". Same status in the database, different label in the UI. No play-count tracking, no date history — just a flag.

**Business rule**: Any transition where the target status is `PLAYED` must set `hasBeenPlayed = true`. This is enforced in the service layer, not the UI.

### Status Transitions

```
Wishlist ──→ Shelf (acquired the game)

Shelf ──→ Up Next (intent to play)
Shelf ──→ Played (mark as experienced without tracking Playing)

Up Next ──→ Playing (start playing)
Up Next ──→ Shelf (remove intent, put back)
Up Next (replay) ──→ Playing (start replaying)
Up Next (replay) ──→ Played (changed mind, keep as played)

Playing ──→ Played (finished/experienced)
Playing ──→ Up Next (pause — put down but intend to return)

Played ──→ Up Next (want to replay — sets/keeps hasBeenPlayed=true)
Played ──→ Shelf (archive — just keep on shelf, no intent)

Deletion is available from any status via the edit form. Deleting a library item removes the record entirely.
```

### Transition Enforcement

Transitions listed above are enforced in the UI only (action buttons show only valid transitions). The service layer accepts any status change for flexibility and edge cases (e.g., admin corrections, bulk operations). Invalid transitions are prevented by UI affordances, not server-side validation.

### `startedAt` / `completedAt` Behavior

Existing `startedAt` and `completedAt` fields on `LibraryItem` are unchanged by this redesign:

- `startedAt` is set when transitioning to `PLAYING` (if not already set)
- `completedAt` is set when transitioning to `PLAYED` (if not already set)
- On replay flows (`Played → Up Next → Playing → Played`): `startedAt` is overwritten with the new date, `completedAt` is overwritten when reaching `PLAYED` again. Only the most recent play-through dates are stored.

### Migration from Current Enum

| Old status | New status | `hasBeenPlayed` |
|------------|-----------|-----------------|
| `WANT_TO_PLAY` | `WISHLIST` | `false` |
| `OWNED` | `SHELF` | `false` |
| `PLAYING` | `PLAYING` | `false` |
| `PLAYED` | `PLAYED` | `true` |

### Steam Import Smart Status

| Condition | New status | `hasBeenPlayed` |
|-----------|-----------|-----------------|
| 0 playtime | `SHELF` | `false` |
| Playtime + last played within 7 days | `PLAYING` | `false` |
| Playtime + last played > 7 days ago | `PLAYED` | `true` |

Steam import never assigns `UP_NEXT` or `WISHLIST` because Steam data doesn't express user intent — only ownership and playtime.

### Default Status on Manual Add

User picks from all 5 statuses manually. No auto-routing.

## UI Design

### Library Page Layout

```
┌─────────────────────────────────────────────────┐
│  Library                        [Import from Steam] │
├─────────────────────────────────────────────────┤
│  [Up Next (8)] [Playing (3)] [Shelf (26)]       │
│  [Played (18)] [Wishlist (12)]                  │
├─────────────────────────────────────────────────┤
│  🔍 Search     Platform ▾     Sort ▾            │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │ game │ │ game │ │ game │ │ game │          │
│  │      │ │      │ │      │ │      │          │
│  └──────┘ └──────┘ └──────┘ └──────┘          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Tab Order

`Up Next` → `Playing` → `Shelf` → `Played` → `Wishlist`

Ordered by actionability. "Up Next" is the default landing tab — it answers the primary user question: "what should I play?"

### Card Badges

| Status | Badge text | Badge color |
|--------|-----------|-------------|
| Shelf | No badge | — |
| Up Next (new game) | "Up Next" | Warm orange |
| Up Next (hasBeenPlayed=true) | "Replay" | Warm orange |
| Playing | "Playing" | Teal (primary) |
| Played | "Played" | Green |
| Wishlist | No badge | — |

### Card Action Buttons (on hover)

| Current status | Actions |
|---------------|---------|
| Shelf | `★ Up Next` · `✓ Played` |
| Up Next | `▶ Playing` · `← Shelf` |
| Up Next (replay) | `▶ Playing` · `✓ Played` |
| Playing | `✓ Played` · `⏸ Up Next` |
| Played | `★ Replay` · `← Shelf` |
| Wishlist | `→ Move to Shelf` |

### Status Colors (CSS Variables)

| Status | Variable | Dark mode value |
|--------|----------|----------------|
| Wishlist | `--status-wishlist` | `oklch(0.65 0.15 260)` (blue-purple) |
| Shelf | `--status-shelf` | `oklch(0.75 0.15 55)` (gold) |
| Up Next | `--status-upnext` | `oklch(0.72 0.16 45)` (warm orange) |
| Playing | `--status-playing` | `oklch(0.72 0.15 175)` (teal) |
| Played | `--status-played` | `oklch(0.7 0.17 145)` (green) |

### Add/Edit Form

`StatusChipGroup` shows all 5 statuses. Selected status determines which tab the game appears in.

### Mobile

Status tabs switch to horizontal scrollable pills or a dropdown select (existing pattern). Card action bar becomes vertical swipe-based (existing pattern), updated with new status actions.

## Data Model Changes

### Prisma Schema

```prisma
enum LibraryItemStatus {
  WISHLIST
  SHELF
  UP_NEXT
  PLAYING
  PLAYED
}

model LibraryItem {
  // ... existing fields
  status         LibraryItemStatus @default(SHELF)  // SHELF as default: most common entry point for owned games
  hasBeenPlayed  Boolean           @default(false)
}
```

### Domain Enum

```typescript
enum LibraryItemStatus {
  WISHLIST = "WISHLIST",
  SHELF = "SHELF",
  UP_NEXT = "UP_NEXT",
  PLAYING = "PLAYING",
  PLAYED = "PLAYED",
}
```

### Status Config

```typescript
const LIBRARY_STATUS_CONFIG = [
  {
    value: LibraryItemStatus.WISHLIST,
    label: "Wishlist",
    description: "Want it someday",
    badgeVariant: "wishlist",
    icon: BookmarkIcon,
  },
  {
    value: LibraryItemStatus.SHELF,
    label: "Shelf",
    description: "Own it, sitting there",
    badgeVariant: "shelf",
    icon: BoxIcon,
  },
  {
    value: LibraryItemStatus.UP_NEXT,
    label: "Up Next",
    description: "Want to play or replay",
    badgeVariant: "upNext",
    icon: StarIcon,
  },
  {
    value: LibraryItemStatus.PLAYING,
    label: "Playing",
    description: "Actively engaged",
    badgeVariant: "playing",
    icon: GamepadIcon,
  },
  {
    value: LibraryItemStatus.PLAYED,
    label: "Played",
    description: "Have experienced",
    badgeVariant: "played",
    icon: CheckCircleIcon,
  },
];
```

## Files to Modify

### Schema & Domain
- `prisma/schema.prisma` — update enum, add `hasBeenPlayed` field
- `data-access-layer/domain/library/enums.ts` — update enum values
- `data-access-layer/domain/library/library-item.mapper.ts` — map new field

### Service Layer
- `data-access-layer/services/library/library-service.ts` — enforce `hasBeenPlayed` logic on status transitions, update `getRandomWantToPlayGame` to query `UP_NEXT`
- `data-access-layer/repository/library/library-repository.ts` — update `findWantToPlayItemsForUser` to query `UP_NEXT`
- `features/manage-library-entry/use-cases/add-game-to-library.ts` — support new statuses
- `features/manage-library-entry/server-actions/update-library-status-action.ts` — handle `hasBeenPlayed` flag

### Dashboard
- `features/dashboard/server-actions/get-random-want-to-play.ts` — query `UP_NEXT` instead of `WANT_TO_PLAY`
- `features/dashboard/ui/dashboard-stats-cards.tsx` — update `statusMap` to new enum values
- `features/dashboard/ui/dashboard-stats.tsx` — update status references

### Profile & Shared
- `shared/lib/profile/constants.ts` — update status references
- `shared/components/ui/progress-ring.tsx` — update `GameStatus` type to new enum values

### UI Components
- `shared/lib/library-status.ts` — new config, new variants, new colors
- `shared/globals.css` — add `--status-upnext` and `--status-wishlist` CSS variables
- `shared/components/ui/badge.tsx` — add `upNext` and `wishlist` badge variants
- `features/library/ui/library-filters.tsx` — update filter tabs to new statuses, change tab order
- `features/library/ui/library-card.tsx` — handle "Replay" vs "Up Next" badge display
- `features/library/ui/library-card-action-bar.tsx` — update action buttons per status
- `features/library/ui/library-card-mobile-actions.tsx` — update mobile actions
- `features/manage-library-entry/ui/status-select.tsx` — add new options
- `features/manage-library-entry/ui/status-chip-group.tsx` — add new chips
- `features/manage-library-entry/ui/entry-form.tsx` — update default status

### Steam Import
- `features/steam-import/lib/calculate-smart-status.ts` — map to new enum values
- `features/steam-import/use-cases/import-game-to-library.ts` — update status mapping

### Migration
- New Prisma migration: rename enum values, add `hasBeenPlayed` column, backfill data

### UI Action Bar Pattern Change

Replace the current "show all other statuses" pattern in `LibraryCardActionBar` with explicit per-status action lists as defined in the Card Action Buttons table above.

## Testing

- Unit tests for `hasBeenPlayed` flag logic in service layer
- Unit tests for status transition validation
- Integration test for migration (old data maps correctly)
- E2E test for tab navigation and card actions
- E2E test for Steam import with new statuses
- All existing tests referencing `WANT_TO_PLAY` or `OWNED` must be updated to use the new enum values

## Prototype

Interactive prototype available at `.superpowers/brainstorm/` — file `library-v3-fresh.html`. Demonstrates all 5 tabs, card actions per status, badge variants, and status transitions.
