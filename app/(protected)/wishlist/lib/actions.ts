"use server";

import { getServerUserId } from "@/auth";
import { type WishlistedGame } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getGamesFromWishlist(
  id?: string
): Promise<WishlistedGame[]> {
  const userId = id ?? (await getServerUserId());

  return prisma.game.findMany({
    where: { userId, deletedAt: null, isWishlisted: true },
    orderBy: { updatedAt: "desc" as "asc" | "desc" },
  });
}
