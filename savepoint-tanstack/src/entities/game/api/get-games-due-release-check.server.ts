import { prisma } from "@/shared/lib/db.server";

import { isDueForCheck } from "../model/release-check";
import type { ReleaseDatePrecision } from "../model/release-date";

const DUE_GAMES_CAP = 100;

export type DueReleaseCheckGame = {
  id: string;
  igdbId: number;
  releaseDate: Date | null;
  releaseDatePrecision: ReleaseDatePrecision | null;
  releaseDateCheckedAt: Date | null;
};

export async function getGamesDueReleaseCheck(
  userId: string,
  now: Date
): Promise<DueReleaseCheckGame[]> {
  const games = await prisma.game.findMany({
    where: { libraryItems: { some: { userId } } },
    select: {
      id: true,
      igdbId: true,
      releaseDate: true,
      releaseDatePrecision: true,
      releaseDateCheckedAt: true,
    },
    orderBy: { releaseDateCheckedAt: { sort: "asc", nulls: "first" } },
  });

  return games
    .filter((game) => isDueForCheck(game, now))
    .slice(0, DUE_GAMES_CAP);
}
