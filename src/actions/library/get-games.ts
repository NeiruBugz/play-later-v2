"use server";

import {
  calculateTotalBacklogTime,
  getListBasedOnStatus,
} from "@/app/(protected)/library/lib/helpers";
import { updateBackloggedGames } from "@/app/(protected)/library/lib/helpers/server-helpers";
import { getServerUserId } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import { FetcherAndProcessor } from "@/src/types/library/actions";
import { FilterKeys } from "@/src/types/library/components";
import { GameStatus, PurchaseType, type Game } from "@prisma/client";

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
      title: {
        contains: filters.search || "",
      },
      userId,
    },
  });

  return {
    abandoned: games.filter((game) => game.status === GameStatus.ABANDONED),
    backlogged: games.filter((game) => game.status === GameStatus.BACKLOG),
    completed: games.filter((game) => game.status === GameStatus.COMPLETED),
    fullCompletion: games.filter(
      (game) => game.status === GameStatus.FULL_COMPLETION
    ),
    inprogress: games.filter((game) => game.status === GameStatus.INPROGRESS),
    shelved: games.filter((game) => game.status === GameStatus.SHELVED),
  };
};

export const getGamesListWithAdapter: FetcherAndProcessor = async (params) => {
  const platform = params.get("platform") ?? " ";
  const currentStatus = (params.get("status") as GameStatus) ?? "BACKLOG";
  const searchQuery = params.get("search") ?? "";
  const purchaseType = params.get("purchase") ?? "";

  const filters = {
    order: params.get("order") ?? "desc",
    platform,
    purchaseType,
    search: searchQuery,
    sortBy: params.get("sortBy") ?? "updatedAt",
  };

  const {
    abandoned,
    backlogged,
    completed,
    fullCompletion,
    inprogress,
    shelved,
  } = await getGames(filters);

  await updateBackloggedGames(backlogged);

  const totalBacklogTime = calculateTotalBacklogTime(backlogged);

  const list = getListBasedOnStatus({
    abandoned,
    backlogged,
    completed,
    currentStatus,
    fullyCompleted: fullCompletion,
    inprogress,
    shelved,
  });

  return {
    backlogged,
    currentStatus,
    list,
    totalBacklogTime,
  };
};

export const countGamesPerStatus = async () => {
  try {
    const session = await getServerUserId();

    if (!session) {
      return {
        [GameStatus.ABANDONED]: 0,
        [GameStatus.BACKLOG]: 0,
        [GameStatus.COMPLETED]: 0,
        [GameStatus.FULL_COMPLETION]: 0,
        [GameStatus.INPROGRESS]: 0,
        [GameStatus.SHELVED]: 0,
      };
    }

    const defaultParams = {
      deletedAt: null,
      userId: session,
    };

    const backlogs = await prisma.game.count({
      where: {
        status: GameStatus.BACKLOG,
        ...defaultParams,
      },
    });
    const inprogress = await prisma.game.count({
      where: {
        status: GameStatus.INPROGRESS,
        ...defaultParams,
      },
    });
    const abandoned = await prisma.game.count({
      where: {
        status: GameStatus.ABANDONED,
        ...defaultParams,
      },
    });
    const completed = await prisma.game.count({
      where: {
        status: GameStatus.COMPLETED,
        ...defaultParams,
      },
    });
    const fullCompletion = await prisma.game.count({
      where: {
        status: GameStatus.FULL_COMPLETION,
        ...defaultParams,
      },
    });
    const shelved = await prisma.game.count({
      where: {
        status: GameStatus.SHELVED,
        ...defaultParams,
      },
    });
    return {
      [GameStatus.ABANDONED]: abandoned,
      [GameStatus.BACKLOG]: backlogs,
      [GameStatus.COMPLETED]: completed,
      [GameStatus.FULL_COMPLETION]: fullCompletion,
      [GameStatus.INPROGRESS]: inprogress,
      [GameStatus.SHELVED]: shelved,
    };
  } catch (error) {
    console.error(error);
  }
};
