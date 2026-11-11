import { prisma } from "@/shared/lib/db.server";

export async function getLatestSessionDates(
  userId: string,
  gameIds: string[]
): Promise<Map<string, Date>> {
  if (gameIds.length === 0) return new Map();

  const groups = await prisma.journalEntry.groupBy({
    by: ["gameId"],
    where: { userId, gameId: { in: gameIds }, playedMinutes: { gt: 0 } },
    _max: { createdAt: true },
  });

  const latestByGameId = new Map<string, Date>();
  for (const group of groups) {
    if (group.gameId && group._max.createdAt) {
      latestByGameId.set(group.gameId, group._max.createdAt);
    }
  }
  return latestByGameId;
}
