import { getServerUserId } from "@/auth";
import { groupByUserName } from "@/src/packages/utils";
import { db } from "@/src/shared/api";
import { sessionErrorHandler } from "@/src/shared/lib/error-handlers";

export const getList = async () => {
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
