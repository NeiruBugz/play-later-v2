import { getServerUserId } from "@/auth";
import { calculateTotalBacklogTime } from "@/src/packages/library/client-helpers";
import { prisma } from "@/src/packages/prisma";
import { commonErrorHandler, sessionErrorHandler } from "@/src/packages/utils";
import { FetcherAndProcessor } from "@/src/types/library/actions";
import { FilterKeys } from "@/src/types/library/components";
import { type Game, GameStatus, PurchaseType } from "@prisma/client";

export const getGames = async (
  filters: Record<FilterKeys, string | undefined>
) => {
  const userId = await getServerUserId();

  const sortState = {
    key: filters.sortBy || "updatedAt",
    order: filters.order || "desc",
  };

  const games: Game[] = await prisma.game.findMany({
    orderBy: {
      [sortState.key as keyof Game]: sortState.order as "asc" | "desc",
    },
    where: {
      deletedAt: null,
      purchaseType: filters.purchaseType
        ? (filters.purchaseType as PurchaseType)
        : undefined,
      status: filters.status ? (filters.status as GameStatus) : undefined,
      title: {
        contains: filters.search || "",
      },
      userId,
    },
  });

  return games;
};

export const getGamesListWithAdapter: FetcherAndProcessor = async (params) => {
  const platform = params.get("platform") ?? " ";
  const currentStatus = (params.get("status") as GameStatus) ?? "INPROGRESS";
  const searchQuery = params.get("search") ?? "";
  const purchaseType = params.get("purchaseType") ?? "";

  const filters = {
    order: params.get("order") ?? "desc",
    platform,
    purchaseType,
    search: searchQuery,
    sortBy: params.get("sortBy") ?? "updatedAt",
    status: currentStatus,
  };

  const games = await getGames(filters);

  return {
    list: games,
  };
};

export const getCountsAndBacklogList = async () => {
  try {
    const session = await getServerUserId();

    if (!session) {
      sessionErrorHandler();
      return {
        backlogged: [],
        counts: {
          [GameStatus.ABANDONED]: 0,
          [GameStatus.BACKLOG]: 0,
          [GameStatus.COMPLETED]: 0,
          [GameStatus.FULL_COMPLETION]: 0,
          [GameStatus.INPROGRESS]: 0,
          [GameStatus.SHELVED]: 0,
        },
      };
    }

    const defaultParams = {
      deletedAt: null,
      userId: session,
    };

    const [
      backlogged,
      backlogCount,
      inprogressCount,
      abandonedCount,
      completedCount,
      fullCompletionCount,
      shelvedCount,
    ] = await prisma.$transaction([
      prisma.game.findMany({
        where: {
          status: GameStatus.BACKLOG,
          ...defaultParams,
        },
      }),
      prisma.game.count({
        where: {
          status: GameStatus.BACKLOG,
          ...defaultParams,
        },
      }),
      prisma.game.count({
        where: {
          status: GameStatus.INPROGRESS,
          ...defaultParams,
        },
      }),
      prisma.game.count({
        where: {
          status: GameStatus.ABANDONED,
          ...defaultParams,
        },
      }),
      prisma.game.count({
        where: {
          status: GameStatus.COMPLETED,
          ...defaultParams,
        },
      }),
      prisma.game.count({
        where: {
          status: GameStatus.FULL_COMPLETION,
          ...defaultParams,
        },
      }),
      prisma.game.count({
        where: {
          status: GameStatus.SHELVED,
          ...defaultParams,
        },
      }),
    ]);

    return {
      backlogged,
      counts: {
        [GameStatus.ABANDONED]: abandonedCount,
        [GameStatus.BACKLOG]: backlogCount,
        [GameStatus.COMPLETED]: completedCount,
        [GameStatus.FULL_COMPLETION]: fullCompletionCount,
        [GameStatus.INPROGRESS]: inprogressCount,
        [GameStatus.SHELVED]: shelvedCount,
      },
    };
  } catch (error) {
    commonErrorHandler("Couldn't find records");
    return {
      backlogged: [],
      counts: {
        [GameStatus.ABANDONED]: 0,
        [GameStatus.BACKLOG]: 0,
        [GameStatus.COMPLETED]: 0,
        [GameStatus.FULL_COMPLETION]: 0,
        [GameStatus.INPROGRESS]: 0,
        [GameStatus.SHELVED]: 0,
      },
    };
  }
};

export const computeBacklogTime = async () => {
  try {
    const session = await getServerUserId();

    if (!session) {
      sessionErrorHandler();
      return {
        time: 0,
      };
    }
    const backlogged = await prisma.game.findMany({
      select: {
        gameplayTime: true,
      },
      where: {
        deletedAt: null,
        status: GameStatus.BACKLOG,
        userId: session,
      },
    });
    if (!backlogged) {
      return {
        time: 0,
      };
    }

    const totalTime = calculateTotalBacklogTime(backlogged);

    return {
      time: totalTime,
    };
  } catch (error) {
    commonErrorHandler("Couldn't find records");
    return {
      time: 0,
    };
  }
};
