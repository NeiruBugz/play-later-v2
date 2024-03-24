"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Game,
  GameStatus,
  PurchaseType,
  type WishlistedGame,
} from "@prisma/client";
import { HowLongToBeatEntry, HowLongToBeatService } from "howlongtobeat";
import { nanoid } from "nanoid";

import { getServerUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type WishlistEntity = HowLongToBeatEntry &
  WishlistedGame & { platform?: null; purchaseType?: null };

export async function getGamesFromWishlist(
  id?: string
): Promise<WishlistedGame[]> {
  const userId = id ?? (await getServerUserId());

  return prisma.game.findMany({
    where: { userId, deletedAt: null, isWishlisted: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getGameFromWishlist(id: WishlistedGame["id"]) {
  const userId = await getServerUserId();

  const game = await prisma.wishlistedGame.findUnique({
    where: {
      id,
      userId,
    },
  });

  if (game && game.howLongToBeatId) {
    const howLongToBeatService = new HowLongToBeatService();
    const gameDetails = await howLongToBeatService.detail(game.howLongToBeatId);
    return { ...gameDetails, ...game };
  }

  return {} as WishlistEntity;
}

export async function deleteGameFromWishlist(id: WishlistedGame["id"]) {
  const userId = await getServerUserId();

  await prisma.wishlistedGame.update({
    data: { deletedAt: new Date() },
    where: { id, userId },
  });

  revalidatePath("/wishlist");
  redirect("/wishlist");
}

export async function moveToLibrary(
  id: WishlistedGame["id"],
  platform: string,
  purchaseType: PurchaseType,
  status: GameStatus
) {
  const userId = await getServerUserId();
  const gameData = await getGameFromWishlist(id);

  if (!gameData) {
    throw new Error("No game found");
  }

  const gamePayload: Game = {
    id: nanoid(),
    title: gameData.title,
    platform,
    status,
    purchaseType,
    rating: null,
    review: null,
    userId,
    imageUrl: gameData.imageUrl,
    howLongToBeatId: gameData.howLongToBeatId,
    createdAt: gameData.createdAt,
    gameplayTime: gameData.gameplayMain,
    updatedAt: new Date(),
    deletedAt: null,
    listId: null,
    isWishlisted: false,
  };

  const promises = [
    prisma.game.create({
      data: gamePayload,
    }),
    deleteGameFromWishlist(id),
  ];
  await Promise.all(promises);
  revalidatePath("/wishlist");
}
