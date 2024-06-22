import { getServerUserId } from "@/auth";
import { prisma } from "@/src/shared/api";

export async function getGame(id: number) {
  const userId = await getServerUserId();

  if (!userId) {
    return null;
  }

  return prisma.game.findUnique({
    where: {
      id,
      userId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      coverImage: true,
      mainStory: true,
      mainExtra: true,
      completionist: true,
      backlogItems: true,
      userId: true,
    }
  })
}
