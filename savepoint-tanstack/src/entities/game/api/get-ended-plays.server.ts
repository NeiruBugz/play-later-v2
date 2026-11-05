import { prisma } from "@/shared/lib/db.server";

export type EndedPlay = {
  id: string;
  startedAt: Date | null;
  finishedAt: Date;
};

export async function getEndedPlays(
  userId: string,
  gameId: string
): Promise<EndedPlay[]> {
  const plays = await prisma.playthrough.findMany({
    where: {
      finishedAt: { not: null },
      libraryItem: { userId, gameId },
    },
    select: { id: true, startedAt: true, finishedAt: true },
    orderBy: [
      { finishedAt: "desc" },
      { startedAt: { sort: "desc", nulls: "last" } },
    ],
  });
  return plays.map((play) => ({
    id: play.id,
    startedAt: play.startedAt,
    finishedAt: play.finishedAt as Date,
  }));
}
