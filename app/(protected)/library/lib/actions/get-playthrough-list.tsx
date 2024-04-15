"use server";

import { auth } from "@/auth";
import { Game } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const getPlaythroughList = async ({ id }: { id: Game["id"] }) => {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      throw new Error("");
    }

    return prisma.playthrough.findMany({
      where: {
        gameId: id,
        userId: session.user.id,
      },
      orderBy: {
        startedAt: "desc",
      },
    });
  } catch (e) {
    throw new Error("");
  }
};
