"use server";

import { revalidatePath } from "next/cache";
import { getServerUserId } from "@/auth";
import { Game, Playthrough } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const createPlaythrough = async ({
  gameId,
  payload,
}: {
  gameId: Game["id"];
  payload: Omit<Playthrough, "id" | "userId" | "gameId">;
}) => {
  try {
    const session = await getServerUserId();

    if (!session) {
      throw new Error("");
    }

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
            id: session,
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
