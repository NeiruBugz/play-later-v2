"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { Game, Playthrough } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const createPlaythrough = async ({
  gameId,
  payload,
}: {
  gameId: Game["id"];
  payload: Omit<Playthrough, "id" | "userId" | "gameId">;
}) => {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    throw new Error("You must be logged in to save a game");
  }

  try {
    await prisma.playthrough.create({
      data: {
        label: payload.label,
        platform: payload.platform,
        createdAt: new Date(),
        startedAt: payload.startedAt,
        finishedAt: payload.finishedAt,
        updatedAt: null,
        deletedAt: null,
        user: {
          connect: {
            id: session.user.id,
          },
        },
        game: {
          connect: {
            id: gameId,
          },
        },
      },
    });
    revalidatePath(`/library/${gameId}`);
  } catch (error) {
    console.error(error);
  }
};
