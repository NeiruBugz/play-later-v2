"use server";

import { GameStatus, type Game } from "@prisma/client";

import { getServerUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FilterKeys } from "@/lib/types/library";

import {
  calculateTotalBacklogTime,
  getListBasedOnStatus,
  updateBackloggedGames,
} from "@/app/(features)/(protected)/library/lib/helpers";
import { FetcherAndProcessor } from "@/app/(features)/(protected)/library/lib/types/actions";

export const getAllGames = async (): Promise<Game[]> => {
  const userId = await getServerUserId();

  return prisma.game.findMany({
    where: {
      userId,
      deletedAt: null,
    },
  });
};

export const getGames = async (
  filters: Record<FilterKeys, string | undefined>
) => {
  const userId = await getServerUserId();

  const sortState = {
    key: filters.sortBy || "updatedAt",
    order: filters.order || "desc",
  };

  let platform: string | undefined;

  if (filters.platform === "" || filters.platform === " ") {
    platform = undefined;
  } else {
    platform = filters.platform;
  }
  const games: Game[] = await prisma.game.findMany({
    where: {
      title: {
        contains: filters.search || "",
      },
      userId,
      deletedAt: null,
      platform: { contains: platform },
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
  };
};

export const getRandomGames = async () => {
  const userId = await getServerUserId();
  const games = await prisma.game.findMany({
    where: {
      userId,
      deletedAt: null,
    },
  });

  return games.sort(() => Math.random() - 0.5).slice(0, 20);
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

  const { abandoned, backlogged, completed, inprogress, fullCompletion } =
    await getGames(filters);

  await updateBackloggedGames(backlogged);

  const totalBacklogTime = calculateTotalBacklogTime(backlogged);

  const list = await getListBasedOnStatus({
    currentStatus,
    inprogress,
    abandoned,
    backlogged,
    completed,
    fullyCompleted: fullCompletion,
  });

  return {
    list,
    currentStatus,
    totalBacklogTime,
    backlogged,
  };
};
