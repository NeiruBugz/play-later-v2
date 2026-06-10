# Components — Per-Playthrough Logs

Component tree, props, and **suggested FSD target paths** in `savepoint-tanstack`.
Names in `code` are the prototype components (in `prototype/*.jsx`); the arrow
points to where each belongs in the real app. Reuse existing `shared/ui`
primitives wherever noted.

```
routes/games.$slug.tsx
└─ widgets/game-detail (GameDetail)
   ├─ ScreenshotsPanel            (unchanged)
   ├─ PlaythroughsPanel  ★NEW     ← replaces YourRecordPanel
   │  ├─ AggregateBand  ★NEW
   │  └─ PlaythroughTimeline ★NEW (spine)
   │     ├─ PlaythroughNode ★NEW
   │     │  ├─ RunMarker ★NEW      (Save-Glow diamond)
   │     │  ├─ RunStatusBadge ★NEW
   │     │  ├─ RunMeta ★NEW
   │     │  └─ NestedJournal ★NEW
   │     └─ AddPlaythroughNode ★NEW
   ├─ AboutPanel                  (unchanged)
   ├─ TimesToBeatPanel            (unchanged)
   ├─ ThemesTagsPanel             (unchanged)
   ├─ RelatedPanel                (unchanged)
   ├─ JournalFeed  ★MOVED         ← full-width section, run-aware
   └─ LibraryStatusSwitcher ★MODIFY (run-derived + Replay label)
features:
   ├─ manage-playthrough ★NEW     (AddEditPlaythroughDrawer)
   └─ compose-journal-entry ★MODIFY (add playthrough picker + playthroughId)
entities:
   ├─ playthrough ★NEW            (model + api + ui atoms)
   ├─ library-item ★MODIFY        (status derivation)
   └─ journal-entry ★MODIFY       (playthroughId)
```

---

## Entity-level atoms → `entities/playthrough/ui/*`

### `RunMarker`  (`playthroughs.jsx`)
The brand Save-Glow diamond, reused as a timeline node.
| prop | type | notes |
|---|---|---|
| `status` | `'PLAYING' \| 'FINISHED' \| 'ABANDONED'` | colors the diamond |
| `size` | `number` | default 30 |
| `ring` | `boolean` | soft tinted halo behind the diamond |

Render `assets/logo-mark.svg` (or inline the two rotated rects) with
`stroke`/`fill` = `var(--status-{key})`. Inner diamond filled; outer stroked;
center fill `var(--card)` so the spine line hides behind it.

### `RunStatusBadge`  (`playthroughs.jsx`)
Small tinted badge: `color-mix(in oklch, var(--status-{key}) 15%, transparent)`
bg, status color text, Lucide icon (`Gamepad2`/`CheckCircle`/`Archive`) + label.

### `RunStatus` model  → `entities/playthrough/model/run-status.ts`
```ts
export const RUN_STATUS = {
  PLAYING:   { label: 'Playing',   token: 'playing', icon: Gamepad2 },
  FINISHED:  { label: 'Finished',  token: 'played',  icon: CheckCircle },
  ABANDONED: { label: 'Abandoned', token: 'shelf',   icon: Archive },
} as const;
```

### `PlatformPill`  (`playthroughs.jsx`)
Tinted pill for a single platform. Reuse the existing `PlatformBadges`/platform
color map from `entities/game` if it exposes single-badge rendering; otherwise a
thin wrapper. Brand colors constant (see README).

### `RatingInput` — **reuse existing** `shared/ui/rating-input`
The prototype's `RatingInput` (half-star, 1–10 store / 0–5 display, hover preview)
duplicates the real one. Use the codebase component; pass `readOnly` for the
aggregate "Best rating" display.

---

## Widget: `PlaythroughsPanel` → `widgets/game-detail/ui/playthroughs-panel/`
Replaces `your-record-panel`. Owns the add/log drawer open state (or lifts it to
`GameDetail`, matching how `YourRecordPanel` currently lifts `onLogSession`).

| prop | type | notes |
|---|---|---|
| `libraryItemId` | `string` | |
| `playthroughs` | `Playthrough[]` | already sorted newest-first |
| `framing` | `'journey'` | label mode; ship journey |
| `onAddPlaythrough` | `() => void` | opens add drawer |
| `onEditPlaythrough` | `(pt) => void` | opens edit drawer |
| `onLogSession` | `(pt) => void` | opens log drawer, preselects run |

**`AggregateBand`** sub-component — derive in a selector:
`totalPlaytimeMinutes = Σ pt.playtimeMinutes`, `count`, `bestRating = max(rating)`,
`completion = first 'Platinum' else first non-null`. This is the seed for the
future **Aggregate Game Stats** — put the math in
`entities/playthrough/model/aggregate.ts` so Reviews/Stats can reuse it.

**Empty state** (`PlaythroughsEmpty`): render when `playthroughs.length === 0`.

---

## Widget: `PlaythroughTimeline` → `widgets/game-detail/ui/playthrough-timeline/`
Spine layout. Maps `playthroughs` → `PlaythroughNode[]` + a trailing
`AddPlaythroughNode`. Keep the connector line as a pseudo-element / absolute span
between markers.

### `PlaythroughNode`
| prop | type |
|---|---|
| `playthrough` | `Playthrough` (with `entries`) |
| `framing` | `'journey'` |
| `onEdit` / `onLogSession` | `() => void` |

Sub-parts: `RunHeader` (label + `RatingStars` read-only + `RunStatusBadge`),
`RunMeta` (platform/dates/hours/completion), notes, `NestedJournal`, Edit button.

### `NestedJournal`
| prop | type |
|---|---|
| `entries` | `JournalEntry[]` (this run only) |
| `onLogSession` | `() => void` |

Renders `// JOURNAL · N` + Log-session button + entry list (date · hours · italic
body). Entries are the same rows surfaced in the page-level `JournalFeed`.

---

## Widget: `JournalFeed` → keep in `widgets/journal-timeline` family, mounted full-width
Run-aware version of the existing journal list. Flattens all entries across the
entry's playthroughs, sorts newest-first, and shows
`DATE · {RUN LABEL} · {h}H` over the italic body, with a `RunMarker` gutter dot.
| prop | type |
|---|---|
| `playthroughs` | `Playthrough[]` |
| `framing` | `'journey'` |
| `onAddEntry` | `() => void` |

> The entry's run label comes from its `playthroughId`. If `playthroughId` is
> null (legacy entries), omit the run label gracefully.

---

## Feature: `manage-playthrough` → `features/manage-playthrough/`
`AddEditPlaythroughDrawer` = shadcn `Sheet side="right"`. Form
(`AddEditPlaythroughForm` in `drawers.jsx`):
| field | control | maps to |
|---|---|---|
| Type (add only) | segmented First/Replay | `kind` |
| Platform | segmented | `platform` |
| Status | segmented (icons) | `status` |
| Started / Finished | `type=date` | `startedAt` / `finishedAt` |
| Playtime (h) | number | `playtimeMinutes` (×60) |
| Completion | text | `completion` |
| Rating | `RatingInput` | `rating` (1–10) |
| Notes | textarea | `notes` |

Submit → `createPlaythroughFn` / `updatePlaythroughFn`, then
`router.invalidate()`. Segmented control: build on shadcn `ToggleGroup` (the
prototype's `Segmented` is a plain version of it).

On create/update, **recompute and persist the library status** (DATA_MODEL.md).

---

## Feature: `compose-journal-entry` → **modify existing**
The "Log session" drawer is the current journal composer plus:
- A **playthrough picker** (radio list of the entry's runs) preselected to the
  clicked run.
- Writes `playthroughId` on the `JournalEntry`.
- Adds the session's hours to that playthrough's `playtimeMinutes` (server-side,
  in the same mutation, to keep aggregates correct).

`LogSessionForm` in `drawers.jsx` shows the target UI.

---

## Widget: `LibraryStatusSwitcher` → **modify existing**
Today it's an always-interactive dropdown pill. New behavior:
- **Has playthroughs** → render the **read-only** pill (`StatusPill`
  `interactive={false}` in the prototype) + a muted "Follows your playthroughs"
  caption (`GitBranch` icon). No menu.
- **No playthroughs** → keep the existing dropdown for manual
  Wishlist/Shelf/Up Next (and "Add to library").
- Keep `getUpNextLabel(hasBeenPlayed)` — `hasBeenPlayed` now comes from runs.

Prototype reference: `StatusPill` in `panels.jsx`.

---

## State (prototype → real)
The prototype holds `playthroughs` in React state and derives everything on
render. In the app:
- **Source of truth = Prisma.** Load playthroughs (with their journal entries)
  in the `games.$slug` route loader alongside the existing game-detail data.
- Status is derived (DATA_MODEL.md) — derive on read **or** persist on write.
- Drawer open/target state stays client-side in `GameDetail` (mirrors how
  `composeOpen` works today).
