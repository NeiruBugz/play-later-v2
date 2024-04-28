"use server";

import { getServerUserId } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import { Game } from "@prisma/client";

export async function getGamesFromWishlist(id?: string): Promise<Game[]> {
  const userId = id ?? (await getServerUserId());

  return prisma.game.findMany({
    orderBy: { updatedAt: "desc" as "asc" | "desc" },
    where: { deletedAt: null, isWishlisted: true, userId },
  });
}
