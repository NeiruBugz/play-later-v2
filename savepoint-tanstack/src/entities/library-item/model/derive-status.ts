import type {
  LibraryItemStatus,
  PlaythroughStatus,
} from "../../../../shared/lib/prisma/client.ts";

export function deriveLibraryStatus(
  playthroughs: ReadonlyArray<{ status: PlaythroughStatus }>,
  manualPrePlay: LibraryItemStatus
): LibraryItemStatus {
  if (playthroughs.length === 0) return manualPrePlay;
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
