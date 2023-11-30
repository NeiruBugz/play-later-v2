"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { GamePlatform, GameStatus, type Game } from "@prisma/client"
import { HowLongToBeatService, type HowLongToBeatEntry } from "howlongtobeat"

import { getServerUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const LIBRARY_PATH = "/library"

export type GameEntity = HowLongToBeatEntry & Game

async function getUserId() {
  return await getServerUserId()
}

export async function getGames(platformCriteria?: string) {
  const userId = await getUserId()

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
    fullCompletion: games.filter(
      (game) => game.status === GameStatus.FULL_COMPLETION
    ),
  }
}

export async function addGame(game: Omit<Game, "userId">) {
  const userId = await getUserId()

  await prisma.game.create({ data: { ...game, userId } })

  revalidatePath(LIBRARY_PATH)
  redirect(LIBRARY_PATH)
}

export async function getGame(id: Game["id"]) {
  const userId = await getUserId()
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
  const userId = await getUserId()

  await prisma.game.update({
    data: {
      status,
      updatedAt: new Date(),
    },
    where: { id, userId },
  })

  revalidatePath(`${LIBRARY_PATH}/${id}`)
  revalidatePath(LIBRARY_PATH)
}

export async function deleteGame(id: Game["id"]) {
  const userId = await getUserId()

  await prisma.game.update({
    data: {
      deletedAt: new Date(),
    },
    where: { id, userId },
  })

  revalidatePath(LIBRARY_PATH)
  redirect(LIBRARY_PATH)
}
