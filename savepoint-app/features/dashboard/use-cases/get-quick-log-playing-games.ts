import "server-only";

import { JournalService } from "@/data-access-layer/services/journal/journal-service";
import { LibraryService } from "@/data-access-layer/services/library/library-service";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { LibraryItemStatus } from "@/shared/types/library";

const PLAYING_LIMIT = 3;

export type QuickLogPlayingGame = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  latestActivityAt: Date;
};

export async function getQuickLogPlayingGames(
  userId: string
): Promise<QuickLogPlayingGame[]> {
  const logger = createLogger({
    [LOGGER_CONTEXT.PAGE]: "getQuickLogPlayingGames",
  });

  const libraryService = new LibraryService();
  const journalService = new JournalService();

  const libraryData = await libraryService.getLibraryItems({
    userId,
    status: LibraryItemStatus.PLAYING,
    distinctByGame: true,
  });

  const items = libraryData.items;
  if (items.length === 0) {
    return [];
  }

  const gameIds = items.map((item) => item.game.id);

  let latestJournalDates = new Map<string, Date>();
  try {
    latestJournalDates = await journalService.getLatestEntryDatePerGame(
      userId,
      gameIds
    );
  } catch (error) {
    logger.warn(
      { error, userId },
      "Failed to fetch latest journal dates; falling back to library timestamps"
    );
  }

  const sorted = items
    .map((item) => {
      const journalDate = latestJournalDates.get(item.game.id);
      const candidates: number[] = [item.updatedAt.getTime()];
      if (item.startedAt) candidates.push(item.startedAt.getTime());
      if (journalDate) candidates.push(journalDate.getTime());
      const latestActivityAt = new Date(Math.max(...candidates));
      return { item, latestActivityAt };
    })
    .sort((a, b) => {
      const diff = b.latestActivityAt.getTime() - a.latestActivityAt.getTime();
      if (diff !== 0) return diff;
      return b.item.updatedAt.getTime() - a.item.updatedAt.getTime();
    })
    .slice(0, PLAYING_LIMIT)
    .map(({ item, latestActivityAt }) => ({
      id: item.game.id,
      title: item.game.title,
      slug: item.game.slug,
      coverImage: item.game.coverImage,
      latestActivityAt,
    }));

  return sorted;
}
