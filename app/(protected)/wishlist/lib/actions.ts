"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

// export async function getGameFromWishlist(id: WishlistedGame["id"]) {
//   const userId = await getServerUserId();
//
//   const game = await prisma.game.findUnique({
//     where: {
//       id,
//       userId,
//     },
//   });
//
//   if (game && game.howLongToBeatId) {
//     const howLongToBeatService = new HowLongToBeatService();
//     const gameDetails = await howLongToBeatService.detail(game.howLongToBeatId);
//     return { ...gameDetails, ...game };
//   }
//
//   return {} as WishlistEntity;
// }

export async function deleteGameFromWishlist(id: WishlistedGame["id"]) {
  const userId = await getServerUserId();

  await prisma.wishlistedGame.update({
    data: { deletedAt: new Date() },
    where: { id, userId },
  });

  revalidatePath("/wishlist");
  redirect("/");
}

// export async function moveToLibrary(
//   id: WishlistedGame["id"],
//   platform: string,
//   purchaseType: Game["purchaseType"],
//   status: Game["status"]
// ) {
//   const userId = await getServerUserId();
//   const gameData = await getGameFromWishlist(id);
//
//   if (!gameData) {
//     throw new Error("No game found");
//   }
//
//   await prisma.game.update({
//     data: {
//       isWishlisted: false,
//       platform,
//       purchaseType,
//       status,
//     },
//     where: {
//       id: id,
//       userId: userId,
//     },
//   });
//
//   revalidatePath("/wishlist");
//   revalidatePath("/library");
// }
