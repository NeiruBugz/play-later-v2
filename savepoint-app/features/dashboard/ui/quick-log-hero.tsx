import "server-only";

import { LibraryService } from "@/data-access-layer/services";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { LibraryItemStatus } from "@/shared/types/library";

import { QuickLogHeroClient } from "./quick-log-hero-client";

const PLAYING_LIMIT = 3;

interface QuickLogHeroProps {
  userId: string;
  username: string;
}

export async function QuickLogHero({ userId, username }: QuickLogHeroProps) {
  const logger = createLogger({ [LOGGER_CONTEXT.PAGE]: "QuickLogHero" });

  const service = new LibraryService();
  const result = await service.getLibraryItems({
    userId,
    status: LibraryItemStatus.PLAYING,
    sortBy: "startedAt",
    sortOrder: "desc",
    distinctByGame: true,
  });

  if (!result.success) {
    logger.error(
      { error: result.error, userId },
      "Failed to fetch playing games for quick-log hero"
    );
    return <QuickLogHeroClient username={username} playingGames={[]} />;
  }

  const playingGames = result.data.items
    .slice(0, PLAYING_LIMIT)
    .map((item) => ({
      id: item.game.id,
      title: item.game.title,
      slug: item.game.slug,
      coverImage: item.game.coverImage,
    }));

  return <QuickLogHeroClient username={username} playingGames={playingGames} />;
}
