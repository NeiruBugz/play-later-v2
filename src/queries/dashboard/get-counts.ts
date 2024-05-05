import { getServerUserId } from "@/auth";
import { prisma } from "@/src/packages/prisma";
import { sessionErrorHandler } from "@/src/packages/utils";

export const getCounts = async () => {
  try {
    const session = await getServerUserId();

    if (!session) {
      sessionErrorHandler();
      return {
        backlog: 0,
        playing: 0,
        total: 0,
      };
    }

    const [total, backlog, playing] = await prisma.$transaction([
      prisma.game.count({
        where: {
          deletedAt: null,
          userId: session,
        },
      }),
      prisma.game.count({
        where: {
          deletedAt: null,
          status: "BACKLOG",
          userId: session,
        },
      }),
      prisma.game.count({
        where: {
          deletedAt: null,
          status: "INPROGRESS",
          userId: session,
        },
      }),
    ]);

    return {
      backlog,
      playing,
      total,
    };
  } catch (error) {
    console.error(error);
    return {
      backlog: 0,
      playing: 0,
      total: 0,
    };
  }
};
