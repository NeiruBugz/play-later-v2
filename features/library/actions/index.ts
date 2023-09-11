"use server"

import { revalidatePath } from "next/cache"
import { GameStatus, type Game } from "@prisma/client"
import { HowLongToBeatEntry, HowLongToBeatService } from "howlongtobeat"

import { getServerUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getGames() {
  const userId = await getServerUserId()

  const games: Game[] = await prisma.game.findMany({
    where: { userId },
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

type GameEntity = HowLongToBeatEntry & Game

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
