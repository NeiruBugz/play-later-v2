import { Game, GameStatus } from "@prisma/client";
import { HowLongToBeatService } from "howlongtobeat";

import { GamesByYear, LibraryData } from "@/lib/types/library";
import { groupByYear } from "@/lib/utils";

import {
  getGames,
  updateGame,
} from "@/app/(features)/(protected)/library/lib/actions";

export const fetchAndProcessGames = async (
  params: URLSearchParams
): Promise<LibraryData> => {
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

  for (const game of backlogged) {
    if (!game.gameplayTime && game.howLongToBeatId) {
      const hltbService = new HowLongToBeatService();
      const details = await hltbService.detail(game.howLongToBeatId);
      await updateGame(
        game.id,
        "gameplayTime",
        details?.gameplayMain,
        game.updatedAt
      );
    }
  }

  const totalBacklogTime = backlogged.reduce(
    (acc, game) => acc + (game.gameplayTime ? game.gameplayTime : 0),
    0
  );

  const completedByYear = groupByYear(completed);
  const fullCompletionByYear = groupByYear(fullCompletion);
  const backloggedByYear = groupByYear(backlogged);

  const currentList = (): Game[] | GamesByYear => {
    if (currentStatus === "INPROGRESS") {
      return inprogress;
    }

    if (currentStatus === "ABANDONED") {
      return abandoned;
    }

    if (currentStatus === "BACKLOG") {
      return backloggedByYear;
    }

    if (currentStatus === "COMPLETED") {
      return completedByYear;
    }

    if (currentStatus === "FULL_COMPLETION") {
      return fullCompletionByYear;
    }

    return [];
  };

  const list = currentList();

  return {
    list,
    currentStatus,
    totalBacklogTime,
    backlogged,
  };
};

export const setDefaultProps = (): URLSearchParams => {
  const params = new URLSearchParams(window.location.search);
  if (!params.get("sort")) {
    params.set("sort", "updatedAt");
    params.set("order", "desc");
  }

  return params;
};
