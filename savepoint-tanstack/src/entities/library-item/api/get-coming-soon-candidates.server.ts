import { prisma } from "@/shared/lib/db.server";

const COMING_SOON_WINDOW_DAYS = 31;
const DAY_OF_SLACK_FOR_DEVICE_TIMEZONE = 1;
const MAX_CANDIDATES = 10;

export type ComingSoonCandidateRow = {
  id: number;
  game: {
    slug: string;
    title: string;
    coverImage: string | null;
    releaseDate: Date;
    releaseDatePrecision: "DAY";
  };
};

export function utcMidnightShiftedByDays(utcDay: string, days: number): Date {
  const midnight = new Date(`${utcDay}T00:00:00.000Z`);
  midnight.setUTCDate(midnight.getUTCDate() + days);
  return midnight;
}

export async function getComingSoonCandidates(
  userId: string,
  utcToday: string
): Promise<ComingSoonCandidateRow[]> {
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
          lte: utcMidnightShiftedByDays(utcToday, COMING_SOON_WINDOW_DAYS),
        },
      },
    },
    orderBy: [{ game: { releaseDate: "asc" } }, { game: { title: "asc" } }],
    take: MAX_CANDIDATES,
    select: {
      id: true,
      game: {
        select: {
          slug: true,
          title: true,
          coverImage: true,
          releaseDate: true,
        },
      },
    },
  });

  return items.flatMap(({ id, game }) =>
    game.releaseDate
      ? [
          {
            id,
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
