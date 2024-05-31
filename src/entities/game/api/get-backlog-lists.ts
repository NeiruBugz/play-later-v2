import { getServerUserId } from "@/auth";

import { db } from "@/src/shared/api";
import { groupByUserName } from "@/src/shared/lib/array-functions";
import { sessionErrorHandler } from "@/src/shared/lib/error-handlers";

export const getBacklogLists = async () => {
  try {
    const session = await getServerUserId();
    if (!session) {
      sessionErrorHandler();
      return;
    }

    const allBackloggedGames = await db.game.findMany({
      select: {
        id: true,
        imageUrl: true,
        title: true,
        user: {
          select: {
            name: true,
            username: true,
          },
        },
      },
      where: {
        NOT: {
          userId: {
            equals: session,
          },
        },
        status: "BACKLOG",
      },
    });

    return groupByUserName(allBackloggedGames);
  } catch (error) {
    console.error(error);
  }
};
