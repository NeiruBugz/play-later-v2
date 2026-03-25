import type { ImportedGameDto } from "@/data-access-layer/domain/imported-game";

import { LibraryItemStatus } from "@/shared/types";

export function calculateSmartStatus(
  importedGame: ImportedGameDto
): LibraryItemStatus {
  if (!importedGame.playtime || importedGame.playtime === 0) {
    return LibraryItemStatus.SHELF;
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
