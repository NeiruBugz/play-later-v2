"use server";

import { getServerUserId } from "@/auth";
import { prisma } from "@/src/packages/prisma";
import { groupByUserName, sessionErrorHandler } from "@/src/packages/utils";


export const getList = async () => {
  try {
    const session = await getServerUserId();
    if (!session) {
      sessionErrorHandler();
      return;
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
