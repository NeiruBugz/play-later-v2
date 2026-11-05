import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";

const RECENT_PLAY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Map a Steam last-played timestamp to a library status hint: PLAYING when the
 * game was last played within 7 days of now, otherwise WANT. DONE is never
 * inferred — recency says nothing reliable about completion; the user decides.
 */
export function calculateSmartStatus(input: {
  playtime?: number | null;
  lastPlayedAt: Date | null | undefined;
}): LibraryItemStatus {
  if (!input.lastPlayedAt) return "WANT";

  const playedRecently =
    new Date(input.lastPlayedAt).getTime() > Date.now() - RECENT_PLAY_WINDOW_MS;
  return playedRecently ? "PLAYING" : "WANT";
}
