import { getServerUserId } from "@/auth";
import { prisma } from "@/src/packages/prisma";
import { sessionErrorHandler } from "@/src/packages/utils";

export const getPlayingGames = async () => {
  try {
    const session = await getServerUserId();

    if (!session) {
      sessionErrorHandler();
      return [];
    }

    const playing = await prisma.game.findMany({
      select: {
        id: true,
        imageUrl: true,
        title: true,
      },
      where: {
        deletedAt: null,
        isWishlisted: false,
        status: "INPROGRESS",
        userId: session,
      },
    });

    if (!playing) {
      return [];
    }

    return playing;
  } catch (error) {
    console.error(error);
    return [];
  }
};
