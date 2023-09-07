"use server"

import { revalidatePath } from "next/cache"
import { GameStatus, type Game } from "@prisma/client"
import { HowLongToBeatEntry, HowLongToBeatService } from "howlongtobeat"

import { getServerUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getGames() {
  const userId = await getServerUserId()

  const games: Game[] = await prisma.game.findMany({
    where: { userId: userId },
  })

  return {
    backlogged: games.filter((game) => game.status === GameStatus.BACKLOG),
    inprogress: games.filter((game) => game.status === GameStatus.INPROGRESS),
    completed: games.filter((game) => game.status === GameStatus.COMPLETED),
    abandoned: games.filter((game) => game.status === GameStatus.ABANDONED),
  }
}

export async function addGame(game: Omit<Game, "userId">) {
  const userId = await getServerUserId()

  const result = await prisma.game.create({ data: { ...game, userId: userId } })

  revalidatePath("/library")

  return result
}

type GameEntity = HowLongToBeatEntry & Game

export async function getGame(id: Game["id"]) {
  const userId = await getServerUserId()
  const game = await prisma.game.findUnique({
    where: {
      userId: userId,
      id: id,
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
    where: { userId: userId, id: id },
    data: {
      status,
      updatedAt: new Date(),
    },
  })

  revalidatePath("/library/[id]")
  revalidatePath("/library")
}
