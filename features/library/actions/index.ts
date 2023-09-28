"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { GamePlatform, GameStatus, type Game } from "@prisma/client"
import { HowLongToBeatService, type HowLongToBeatEntry } from "howlongtobeat"

import { getServerUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type GameEntity = HowLongToBeatEntry & Game

export async function getGames(platformCriteria?: string) {
  const userId = await getServerUserId()

  const platformFilter =
    platformCriteria !== " "
      ? { platform: platformCriteria as GamePlatform }
      : {}
  const games: Game[] = await prisma.game.findMany({
    where: {
      userId,
      deletedAt: null,
      ...platformFilter,
    },
    orderBy: { updatedAt: "desc" },
  })

  return {
    abandoned: games.filter((game) => game.status === GameStatus.ABANDONED),
    backlogged: games.filter((game) => game.status === GameStatus.BACKLOG),
    completed: games.filter((game) => game.status === GameStatus.COMPLETED),
    inprogress: games.filter((game) => game.status === GameStatus.INPROGRESS),
  }
}

export async function addGame(game: Omit<Game, "userId">) {
  const userId = await getServerUserId()

  const result = await prisma.game.create({ data: { ...game, userId } })

  revalidatePath("/library")

  return result
}

export async function getGame(id: Game["id"]) {
  const userId = await getServerUserId()
  const game = await prisma.game.findUnique({
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

  return {} as GameEntity
}

export async function updateStatus(id: Game["id"], status: GameStatus) {
  const userId = await getServerUserId()

  await prisma.game.update({
    data: {
      status,
      updatedAt: new Date(),
    },
    where: { id, userId },
  })

  revalidatePath("/library/[id]")
  revalidatePath("/library")
}

export async function deleteGame(id: Game["id"]) {
  const userId = await getServerUserId()

  await prisma.game.delete({
    where: { id, userId },
  })

  revalidatePath("/library")
  redirect("/library")
}
