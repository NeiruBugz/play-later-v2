"use server";

import { getServerUserId } from "@/auth";
import { Game } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const getPlaythroughList = async ({ id }: { id: Game["id"] }) => {
  try {
    const session = await getServerUserId();

    if (!session) {
      throw new Error("");
    }

    return prisma.playthrough.findMany({
      where: {
        gameId: id,
        userId: session,
      },
      orderBy: {
        startedAt: "desc",
      },
    });
  } catch (e) {
    console.error(e);
  }
};
