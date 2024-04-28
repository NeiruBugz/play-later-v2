"use server";

import { getServerUserId } from "@/auth";
import { prisma } from "@/lib/prisma";
import { type WishlistedGame } from "@prisma/client";

export async function getGamesFromWishlist(
  id?: string
): Promise<WishlistedGame[]> {
  const userId = id ?? (await getServerUserId());

  return prisma.game.findMany({
    orderBy: { updatedAt: "desc" as "asc" | "desc" },
    where: { deletedAt: null, isWishlisted: true, userId },
  });
}
