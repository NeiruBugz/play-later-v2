import { getServerUserId } from "@/auth";
import { prisma } from "@/src/shared/api";

export async function getBacklogItems({ gameId }: { gameId: string }) {
  const userId = await getServerUserId();
  if (!userId) return [];

  try {
    return await prisma.backlogItem.findMany({
      where: { gameId, userId },
      orderBy: { createdAt: "asc" },
    });
  } catch (e) {
    console.error("Error fetching backlog items for game:", e);
    return [];
  }
}
