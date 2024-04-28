"use server";

import { getServerUserId } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import { Game } from "@prisma/client";

export const getPlaythroughList = async ({ id }: { id: Game["id"] }) => {
  try {
    const session = await getServerUserId();

    if (!session) {
      throw new Error("");
    }

    return prisma.playthrough.findMany({
      orderBy: {
        startedAt: "desc",
      },
      where: {
        gameId: id,
        userId: session,
      },
    });
  } catch (e) {
    console.error(e);
  }
};
