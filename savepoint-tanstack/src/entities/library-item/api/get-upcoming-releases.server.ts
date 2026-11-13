import { prisma } from "@/shared/lib/db.server";

import { utcMidnightShiftedByDays } from "./get-coming-soon-candidates.server";

const DAY_OF_SLACK_FOR_DEVICE_TIMEZONE = 1;

export type UpcomingRelease = {
  id: number;
  status: "WANT" | "PLAYING" | "DONE";
  isOwned: boolean;
  game: {
    slug: string;
    title: string;
    coverImage: string | null;
    releaseDate: Date;
    releaseDatePrecision: "DAY";
    releaseDateMovedFrom: Date | null;
    releaseDateMovedAt: Date | null;
  };
};

export async function getUpcomingReleases(
  userId: string,
  utcToday: string
): Promise<UpcomingRelease[]> {
  const items = await prisma.libraryItem.findMany({
    where: {
      userId,
      game: {
        releaseDatePrecision: "DAY",
        releaseDate: {
          gte: utcMidnightShiftedByDays(
            utcToday,
            -DAY_OF_SLACK_FOR_DEVICE_TIMEZONE
          ),
        },
      },
    },
    orderBy: [{ game: { releaseDate: "asc" } }, { game: { title: "asc" } }],
    select: {
      id: true,
      status: true,
      isOwned: true,
      game: {
        select: {
          slug: true,
          title: true,
          coverImage: true,
          releaseDate: true,
          releaseDateMovedFrom: true,
          releaseDateMovedAt: true,
        },
      },
    },
  });

  return items.flatMap(({ id, status, isOwned, game }) =>
    game.releaseDate
      ? [
          {
            id,
            status,
            isOwned,
            game: {
              ...game,
              releaseDate: game.releaseDate,
              releaseDatePrecision: "DAY" as const,
            },
          },
        ]
      : []
  );
}
