import type {
  LibraryItemStatus,
  PlaythroughStatus,
} from "../../../shared/lib/prisma/client.ts";

const PRE_PLAY_STATUSES = new Set<LibraryItemStatus>([
  "WISHLIST",
  "SHELF",
  "UP_NEXT",
]);

export function deriveLibraryStatus(
  playthroughs: ReadonlyArray<{ status: PlaythroughStatus }>,
  storedStatus: LibraryItemStatus
): LibraryItemStatus {
  if (playthroughs.length === 0) {
    // Spec §2.8: with no runs the status must be a manual pre-play status.
    // If the stored status is a stale run-derived value (PLAYING / PLAYED),
    // reset to SHELF ("On the Shelf") — the neutral default.
    return PRE_PLAY_STATUSES.has(storedStatus) ? storedStatus : "SHELF";
  }
  if (playthroughs.some((p) => p.status === "PLAYING")) return "PLAYING";
  return "PLAYED";
}

export function deriveHasBeenPlayed(
  playthroughs: ReadonlyArray<{ status: PlaythroughStatus }>
): boolean {
  return playthroughs.some(
    (p) => p.status === "FINISHED" || p.status === "ABANDONED"
  );
}
