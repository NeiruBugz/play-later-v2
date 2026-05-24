import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";

/**
 * Statuses that imply the user has played the game even without an explicit
 * start/finish date.
 */
export const TOUCHED_STATUSES: readonly LibraryItemStatus[] = [
  "PLAYING",
  "PLAYED",
];

type TouchableFields = {
  status: LibraryItemStatus;
  startedAt: Date | null;
  completedAt: Date | null;
};

/**
 * Whether the user has actually engaged with a game — currently or formerly
 * playing, or with a recorded start/finish date. This is the derived
 * replacement for the dead `hasBeenPlayed` flag, which no write path ever set;
 * it powers the "Hide untouched games" filter, the "Tried" card badge, and the
 * UP_NEXT "Replay" label.
 */
export function isTouched(item: TouchableFields): boolean {
  return (
    TOUCHED_STATUSES.includes(item.status) ||
    item.startedAt !== null ||
    item.completedAt !== null
  );
}
