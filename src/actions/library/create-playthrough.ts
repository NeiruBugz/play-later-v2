"use server";

import { getServerUserId } from "@/auth";
import { prisma } from "@/src/packages/prisma";
import { sessionErrorHandler } from "@/src/packages/utils";
import { Game, Playthrough } from "@prisma/client";
import { revalidatePath } from "next/cache";


export const createPlaythrough = async ({
  gameId,
  payload,
}: {
  gameId: Game["id"];
  payload: Omit<Playthrough, "gameId" | "id" | "userId">;
}) => {
  try {
    const session = await getServerUserId();

    if (!session) {
      sessionErrorHandler();
      return;
    }

    await prisma.playthrough.create({
      data: {
        createdAt: new Date(),
        deletedAt: null,
        finishedAt: payload.finishedAt,
        game: {
          connect: {
            id: gameId,
          },
        },
        label: payload.label,
        platform: payload.platform,
        startedAt: payload.startedAt,
        updatedAt: null,
        user: {
          connect: {
            id: session,
          },
        },
      },
    });
    revalidatePath(`/library/${gameId}`);
  } catch (error) {
    console.error(error);
  }
};
