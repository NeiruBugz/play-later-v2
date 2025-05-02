import { getServerUserId } from "@/auth";
import { prisma } from "@/shared/lib/db";

export async function getGame(id: string) {
  const userId = await getServerUserId();

  if (!userId) {
    return null;
  }

  const game = await prisma.game.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      title: true,
      igdbId: true,
      description: true,
      coverImage: true,
      mainStory: true,
      mainExtra: true,
      completionist: true,
      backlogItems: true,
      Review: true,
    },
  });
  if (game) {
    return { game, userId };
  }

  return null;
}
