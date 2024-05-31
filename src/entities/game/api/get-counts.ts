import { endOfYear, startOfYear } from "date-fns";

import { getServerUserId } from "@/auth";

import { db } from "@/src/shared/api";
import { sessionErrorHandler } from "@/src/shared/lib/error-handlers";

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

    const [total, backlog] = await db.$transaction([
      db.game.count({
        where: {
          deletedAt: null,
          userId: session,
        },
      }),
      db.game.count({
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

    const [completed, fullyCompleted] = await db.$transaction([
      db.game.count({
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
      db.game.count({
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
