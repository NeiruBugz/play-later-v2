"use server";

import type { Game, Prisma } from "@prisma/client";
import { HowLongToBeatService } from "howlongtobeat";
import { revalidatePath } from "next/cache";

import { getServerUserId } from "@/auth";

import { db } from "@/src/shared/api";

const LIBRARY_PATH = "/library";

const updateGameData = async (id: Game["id"], data: Prisma.GameUpdateInput) => {
  const userId = await getServerUserId();
  await db.game.update({
    data: {
      ...data,
      updatedAt: new Date(),
    },
    where: {
      id,
      userId,
    },
  });
  revalidatePath(`${LIBRARY_PATH}/${id}`);
  revalidatePath(LIBRARY_PATH);
};

export const updateStatus = async (id: Game["id"], status: Game["status"]) => {
  await updateGameData(id, { status });
};

export const updateGame = async (
  id: Game["id"],
  gameKey: keyof Game,
  value: Game[keyof Game]
) => {
  await updateGameData(id, { [gameKey]: value, isWishlisted: false });
};

export const updateBackloggedGames = async (backlogged: Game[]) => {
  for (const game of backlogged) {
    if (!game.gameplayTime && game.howLongToBeatId) {
      const hltbService = new HowLongToBeatService();
      const details = await hltbService.detail(game.howLongToBeatId);
      await updateGame(game.id, "gameplayTime", details?.gameplayMain);
    }
  }
};
