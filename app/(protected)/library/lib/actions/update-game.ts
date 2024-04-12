"use server";

import { revalidatePath } from "next/cache";
import { getServerUserId } from "@/auth";
import { Game, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

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

export async function addGameReview({
  id,
  review,
  rating,
}: {
  id: Game["id"];
  review: string;
  rating: number;
}) {
  await updateGameData(id, {
    rating: rating === 0 ? undefined : rating,
    review,
  });
}