"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { type WishlistedGame } from "@prisma/client"
import { HowLongToBeatEntry, HowLongToBeatService } from "howlongtobeat"

import { getServerUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type WishlistEntity = HowLongToBeatEntry & WishlistedGame

export async function getWishlistedGames() {
  const userId = await getServerUserId()

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

  await prisma.wishlistedGame.delete({
    where: { id, userId },
  })

  revalidatePath("/wishlist")
  redirect("/wishlist")
}
