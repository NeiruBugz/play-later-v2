import type { ImportedGame } from "@prisma/client";

import { LibraryItemStatus } from "@/shared/types";

/**
 * Calculate smart status for imported Steam games based on playtime and last played date.
 *
 * Logic:
 * - 0 playtime → OWNED (user has it but hasn't played)
 * - Playtime + last played within 7 days → PLAYING
 * - Playtime + last played > 7 days ago → PLAYED
 */
export function calculateSmartStatus(
  importedGame: ImportedGame
): LibraryItemStatus {
  if (!importedGame.playtime || importedGame.playtime === 0) {
    return LibraryItemStatus.OWNED;
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (
    importedGame.lastPlayedAt &&
    new Date(importedGame.lastPlayedAt) > sevenDaysAgo
  ) {
    return LibraryItemStatus.PLAYING;
  }

  return LibraryItemStatus.PLAYED;
}
