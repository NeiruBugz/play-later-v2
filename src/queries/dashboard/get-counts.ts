import { getServerUserId } from "@/auth";
import { prisma } from "@/src/packages/prisma";
import { sessionErrorHandler } from "@/src/packages/utils";
import { endOfYear, startOfYear } from "date-fns";

export const getCounts = async () => {
  try {
    const session = await getServerUserId();

    if (!session) {
      sessionErrorHandler();
      return {
        backlog: 0,
        total: 0,
      };
    }

    const [total, backlog] = await prisma.$transaction([
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
    ]);

    return {
      backlog,
      total,
    };
  } catch (error) {
    console.error(error);
    return {
      backlog: 0,
      total: 0,
    };
  }
};

export const getCompletedThisYearCount = async () => {
  try {
    const session = await getServerUserId();

    if (!session) {
      sessionErrorHandler();
      return 0;
    }

    const left = startOfYear(new Date());
    const right = endOfYear(new Date());

    const [completed, fullyCompleted] = await prisma.$transaction([
      prisma.game.count({
        where: {
          deletedAt: null,
          status: "COMPLETED",
          updatedAt: {
            gte: left,
            lte: right,
          },
          userId: session,
        },
      }),
      prisma.game.count({
        where: {
          deletedAt: null,
          status: "FULL_COMPLETION",
          updatedAt: {
            gte: left,
            lte: right,
          },
          userId: session,
        },
      }),
    ]);

    if (!completed && !fullyCompleted) {
      return 0;
    }

    return completed + fullyCompleted;
  } catch (error) {
    console.error(error);
    return 0;
  }
};
