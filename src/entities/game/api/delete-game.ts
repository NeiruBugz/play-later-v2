import { getServerUserId } from "@/auth";
import { prisma } from "@/src/shared/api";

export async function deleteGame(gameId: number) {
  const userId = await getServerUserId();

  if (!userId) {
    return;
  }

  try {
    await prisma.backlogItem.delete({
      where: {
        id: gameId,
        userId,
      }
    })
  } catch (error) {
    console.error(error);
  }
}
