"use server";

import { getServerUserId } from "@/auth";
import { prisma } from "@/src/packages/prisma";
import { Game, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

const LIBRARY_PATH = "/library";

const updateGameData = async (id: Game["id"], data: Prisma.GameUpdateInput) => {
  const userId = await getServerUserId();
  await prisma.game.update({
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
  await updateGameData(id, { [gameKey]: value });
};
