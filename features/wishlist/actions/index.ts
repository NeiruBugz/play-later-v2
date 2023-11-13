"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  Game,
  GamePlatform,
  GameStatus,
  PurchaseType,
  type WishlistedGame,
} from "@prisma/client"
import { HowLongToBeatEntry, HowLongToBeatService } from "howlongtobeat"
import { nanoid } from "nanoid"

import { getServerUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type WishlistEntity = HowLongToBeatEntry &
  WishlistedGame & { platform?: null; purchaseType?: null }

export async function getWishlistedGames(id?: string) {
  const userId = id ?? (await getServerUserId())

  const games: WishlistedGame[] = await prisma.wishlistedGame.findMany({
    where: { userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  })

  return games
}

export async function addToWishlist(game: HowLongToBeatEntry) {
  const userId = await getServerUserId()

  await prisma.wishlistedGame.create({
    data: {
      title: game.name,
      imageUrl: game.imageUrl,
      howLongToBeatId: game.id,
      userId,
    },
  })

  revalidatePath("/search")
  redirect("/wishlist")
}

export async function getWishlistedGame(id: WishlistedGame["id"]) {
  const userId = await getServerUserId()

  const game = await prisma.wishlistedGame.findUnique({
    where: {
      id,
      userId,
    },
  })

  if (game && game.howLongToBeatId) {
    const howLongToBeatService = new HowLongToBeatService()
    const gameDetails = await howLongToBeatService.detail(game.howLongToBeatId)
    return { ...gameDetails, ...game }
  }

  return {} as WishlistEntity
}

export async function deleteWishlistedGame(id: WishlistedGame["id"]) {
  const userId = await getServerUserId()

  await prisma.wishlistedGame.update({
    data: { deletedAt: new Date() },
    where: { id, userId },
  })

  revalidatePath("/wishlist")
  redirect("/wishlist")
}

export async function moveToLibrary(
  id: WishlistedGame["id"],
  platform: GamePlatform,
  purchaseType: PurchaseType,
  status: GameStatus
) {
  const userId = await getServerUserId()
  const gameData = await getWishlistedGame(id)

  if (!gameData) {
    throw new Error("No game found")
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
    updatedAt: new Date(),
    deletedAt: null,
  }

  await prisma.game.create({
    data: gamePayload,
  })
  await deleteWishlistedGame(id)
  revalidatePath("/wishlist")
}
