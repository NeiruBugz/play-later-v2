# Feature: up-next

Server functions for the Up Next queue (max `UP_NEXT_MAX` = 5 games per user,
contiguous positions 1..N). UI lands in a later slice.

## Structure

- `api/add-to-up-next-fn` — `{ id }` -> `{ position }`. Appends; idempotent if
  already queued. Full queue throws `ConflictError` with `context.code`
  `UP_NEXT_FULL`; a Playing game throws `ValidationError`.
- `api/remove-from-up-next-fn` — `{ id }` -> `{ position: null }`. Compacts the
  games behind it; no-op if not queued.
- `api/move-in-up-next-fn` — `{ id, direction: "up" | "down" }` or
  `{ id, toPosition: 1..5 }` -> full ordered `[{ id, position }]`. No-op at the
  edges; `ValidationError` if the game is not queued.

Each fn is a thin `createServerFn` wrapper (no `.server` suffix) over a
`*-fn.worker.ts` that re-parses input, rejects a missing `userId` with
`UnauthorizedError`, and delegates to `entities/library-item/api/*.server.ts`.

## Invariants

- Every queue mutation (here and in `setLibraryItemStatus` /
  `restoreLibraryItem`) holds the per-user advisory lock from
  `up-next-queue.server.ts` before touching rows; concurrency tests assert it.
- The `(userId, upNextPosition)` unique index forbids transient duplicates:
  swaps null the moved row first, shifts run in the direction that frees a slot.
- The "queue full" copy is keyed by `error.code` in `shared/lib/user-facing-error`.
