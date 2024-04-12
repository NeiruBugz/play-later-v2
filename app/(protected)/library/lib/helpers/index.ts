"use server";

import { getServerUserId } from "@/auth";
import { Game, GameStatus } from "@prisma/client";
import { HowLongToBeatService } from "howlongtobeat";

import { prisma } from "@/lib/prisma";

import { updateGame } from "@/app/(protected)/library/lib/actions/update-game";

export const updateBackloggedGames = async (backlogged: Game[]) => {
  for (const game of backlogged) {
    if (!game.gameplayTime && game.howLongToBeatId) {
      const hltbService = new HowLongToBeatService();
      const details = await hltbService.detail(game.howLongToBeatId);
      await updateGame(game.id, "gameplayTime", details?.gameplayMain);
    }
  }
};

export const getAllUserPlatforms = async () => {
  const userId = await getServerUserId();

  return prisma.game.findMany({
    distinct: ["platform"],
    where: { userId },
    select: { platform: true },
  });
};

export const calculateTotalBacklogTime = async (
  backlogged: Game[]
): Promise<number> => {
  return backlogged.reduce(
    (acc, game) => acc + (game.gameplayTime ? game.gameplayTime : 0),
    0
  );
};

export const getListBasedOnStatus = async ({
  currentStatus,
  inprogress,
  abandoned,
  backlogged,
  completed,
  fullyCompleted,
  shelved,
}: {
  currentStatus: GameStatus;
  inprogress: Game[];
  abandoned: Game[];
  backlogged: Game[];
  completed: Game[];
  fullyCompleted: Game[];
  shelved: Game[];
}): Promise<Game[]> => {
  switch (currentStatus) {
    case "INPROGRESS":
      return inprogress;
    case "ABANDONED":
      return abandoned;
    case "BACKLOG":
      return backlogged;
    case "COMPLETED":
      return completed;
    case "FULL_COMPLETION":
      return fullyCompleted;
    case "SHELVED":
      return shelved;
    default:
      return [];
  }
};
