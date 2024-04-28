"use server";

import { getServerUserId } from "@/auth";
import { GameStatus, PurchaseType, type Game } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { FilterKeys } from "@/lib/types/library";

import {
  calculateTotalBacklogTime,
  getListBasedOnStatus,
} from "@/app/(protected)/library/lib/helpers";
import { updateBackloggedGames } from "@/app/(protected)/library/lib/helpers/server-helpers";
import { FetcherAndProcessor } from "@/app/(protected)/library/lib/types/actions";

export const getGames = async (
  filters: Record<FilterKeys, string | undefined>
) => {
  const userId = await getServerUserId();

  const sortState = {
    key: filters.sortBy || "updatedAt",
    order: filters.order || "desc",
  };

  const games: Game[] = await prisma.game.findMany({
    where: {
      title: {
        contains: filters.search || "",
      },
      purchaseType: filters.purchaseType
        ? (filters.purchaseType as PurchaseType)
        : undefined,
      userId,
      deletedAt: null,
    },
    orderBy: {
      [sortState.key as keyof Game]: sortState.order as "asc" | "desc",
    },
  });

  return {
    abandoned: games.filter((game) => game.status === GameStatus.ABANDONED),
    backlogged: games.filter((game) => game.status === GameStatus.BACKLOG),
    completed: games.filter((game) => game.status === GameStatus.COMPLETED),
    inprogress: games.filter((game) => game.status === GameStatus.INPROGRESS),
    fullCompletion: games.filter(
      (game) => game.status === GameStatus.FULL_COMPLETION
    ),
    shelved: games.filter((game) => game.status === GameStatus.SHELVED),
  };
};

export const getGamesListWithAdapter: FetcherAndProcessor = async (params) => {
  const platform = params.get("platform") ?? " ";
  const currentStatus = (params.get("status") as GameStatus) ?? "BACKLOG";
  const searchQuery = params.get("search") ?? "";
  const purchaseType = params.get("purchase") ?? "";

  const filters = {
    platform,
    order: params.get("order") ?? "desc",
    sortBy: params.get("sortBy") ?? "updatedAt",
    search: searchQuery,
    purchaseType,
  };

  const {
    abandoned,
    backlogged,
    completed,
    inprogress,
    fullCompletion,
    shelved,
  } = await getGames(filters);

  await updateBackloggedGames(backlogged);

  const totalBacklogTime = calculateTotalBacklogTime(backlogged);

  const list = getListBasedOnStatus({
    currentStatus,
    inprogress,
    abandoned,
    backlogged,
    completed,
    fullyCompleted: fullCompletion,
    shelved,
  });

  return {
    list,
    currentStatus,
    totalBacklogTime,
    backlogged,
  };
};

export const countGamesPerStatus = async () => {
  try {
    const session = await getServerUserId();

    if (!session) {
      return {
        [GameStatus.INPROGRESS]: 0,
        [GameStatus.BACKLOG]: 0,
        [GameStatus.ABANDONED]: 0,
        [GameStatus.COMPLETED]: 0,
        [GameStatus.SHELVED]: 0,
        [GameStatus.FULL_COMPLETION]: 0,
      };
    }

    const defaultParams = {
      userId: session,
      deletedAt: null,
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
      [GameStatus.INPROGRESS]: inprogress,
      [GameStatus.BACKLOG]: backlogs,
      [GameStatus.ABANDONED]: abandoned,
      [GameStatus.COMPLETED]: completed,
      [GameStatus.SHELVED]: shelved,
      [GameStatus.FULL_COMPLETION]: fullCompletion,
    };
  } catch (error) {
    console.error(error);
  }
};
