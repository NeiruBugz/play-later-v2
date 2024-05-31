import { getServerUserId } from "@/auth";

import { db } from "@/src/shared/api";
import { sessionErrorHandler } from "@/src/shared/lib/error-handlers";

export const getPlayingGames = async () => {
  try {
    const session = await getServerUserId();

    if (!session) {
      sessionErrorHandler();
      return [];
    }

    const playing = await db.game.findMany({
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
