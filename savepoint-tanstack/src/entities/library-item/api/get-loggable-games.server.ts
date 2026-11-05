import { prisma } from "@/shared/lib/db.server";

import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";

export type LoggableGame = {
  libraryItemId: number;
  upNextPosition: number | null;
  gameId: string;
  slug: string;
  title: string;
  coverImage: string | null;
  status: LibraryItemStatus;
};

/**
 * The games a user can log time or a note against: their library items only,
 * Playing first, then by title.
 */
export async function getLoggableGames(
  userId: string
): Promise<LoggableGame[]> {
  const items = await prisma.libraryItem.findMany({
    where: { userId },
    orderBy: { game: { title: "asc" } },
    select: {
      id: true,
      upNextPosition: true,
      status: true,
      game: {
        select: { id: true, slug: true, title: true, coverImage: true },
      },
    },
  });

  const games = items.map(({ id, upNextPosition, status, game }) => ({
    libraryItemId: id,
    upNextPosition,
    gameId: game.id,
    slug: game.slug,
    title: game.title,
    coverImage: game.coverImage,
    status,
  }));

  return [
    ...games.filter((game) => game.status === "PLAYING"),
    ...games.filter((game) => game.status !== "PLAYING"),
  ];
}
