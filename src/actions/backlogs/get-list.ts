"use server";

import { getServerUserId } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import { groupByUserName } from "@/src/lib/utils";

export const getList = async () => {
  try {
    const session = await getServerUserId();
    if (!session) {
      throw new Error();
    }

    const allBackloggedGames = await prisma.game.findMany({
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
