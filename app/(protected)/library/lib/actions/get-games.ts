"use server";

import { getServerUserId } from "@/auth";
import { GameStatus, type Game } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { FilterKeys } from "@/lib/types/library";

import {
  calculateTotalBacklogTime,
  getListBasedOnStatus,
  updateBackloggedGames,
} from "@/app/(protected)/library/lib/helpers";
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

  const filters = {
    platform,
    order: params.get("order") ?? "desc",
    sortBy: params.get("sortBy") ?? "updatedAt",
    search: searchQuery,
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

  const totalBacklogTime = await calculateTotalBacklogTime(backlogged);

  const list = await getListBasedOnStatus({
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
