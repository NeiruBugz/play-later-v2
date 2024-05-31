import { getServerUserId } from "@/auth";

import { db } from "@/src/shared/api";
import { sessionErrorHandler } from "@/src/shared/lib/error-handlers";

export const getBacklogListForUser = async ({ name }: { name: string }) => {
  try {
    const session = await getServerUserId();
    if (!session) {
      sessionErrorHandler();
      return;
    }

    return await db.game.findMany({
      select: {
        id: true,
        imageUrl: true,
        title: true,
      },
      where: {
        NOT: {
          userId: {
            equals: session,
          },
        },
        status: "BACKLOG",
        user: {
          name: {
            equals: name.replace("%20", " "),
          },
        },
      },
    });
  } catch (error) {
    console.error(error);
  }
};
