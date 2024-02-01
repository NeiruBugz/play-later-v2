"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { GamePlatform, GameStatus, List, type Game } from "@prisma/client"
import { HowLongToBeatService, type HowLongToBeatEntry } from "howlongtobeat"

import { getServerUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const LIBRARY_PATH = "/library"

export type GameEntity = HowLongToBeatEntry & Game

async function getUserId() {
  return await getServerUserId()
}

type FilterKeys = "platform" | "sortBy" | "order" | "search"

export async function getAllGames() {
  const userId = await getUserId()

  return await prisma.game.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    orderBy: {
      title: "asc",
    },
  })
}

export async function getGames(
  filters: Record<FilterKeys, string | undefined>
) {
  const userId = await getUserId()

  const sortState = {
    key: filters.sortBy || "updatedAt",
    order: filters.order || "desc",
  }

  let platform: string | undefined = " "

  if (filters.platform === "" || filters.platform === " ") {
    platform = undefined
  } else {
    platform = filters.platform as GamePlatform
  }
  const games: Game[] = await prisma.game.findMany({
    where: {
      title: {
        contains: filters.search || "",
      },
      userId,
      deletedAt: null,
      platform: platform as GamePlatform,
    },
    orderBy: { [sortState.key]: sortState.order },
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

export async function updateGame(
  id: Game["id"],
  gameKey: keyof Game,
  value: Game[keyof Game],
  updatedAt?: Date
) {
  const userId = await getUserId()
  await prisma.game.update({
    data: {
      [gameKey]: value,
      updatedAt,
    },
    where: { id, userId },
  })
  revalidatePath(LIBRARY_PATH)
}

export async function addGameReview({
  id,
  review,
  rating,
}: {
  id: Game["id"]
  review: string
  rating: number
}) {
  const userId = await getUserId()
  await prisma.game.update({
    data: {
      rating: rating === 0 ? undefined : rating,
      review: review,
    },
    where: {
      id,
      userId,
    },
  })
  revalidatePath(`${LIBRARY_PATH}/${id}`)
}

export async function getRandomGames() {
  const userId = await getUserId()
  const games = await prisma.game.findMany({
    where: {
      userId,
      deletedAt: null,
    },
  })

  return games.sort(() => Math.random() - 0.5).slice(0, 20)
}

export async function getListGames(id: List["id"]) {
  const userId = await getUserId()
  const games = await prisma.game.findMany({
    where: {
      userId,
      deletedAt: null,
      listId: id,
    },
  })

  return games
}

export async function getListGamesArtworks(id: List["id"]) {
  const userId = await getUserId()
  const games = await prisma.game.findMany({
    where: {
      userId,
      deletedAt: null,
      listId: id,
    },
  })

  return games.map((game) => ({
    id: game.id,
    artwork: game.imageUrl,
    game: game.title,
  }))
}

export async function searchLibrary({ search }: { search: string }) {
  const userId = await getServerUserId()

  return await prisma.game.findMany({
    where: {
      userId,
      title: {
        contains: search,
      },
    },
  })
}

export async function addGameToList({
  gameId,
  listId,
}: {
  gameId: Game["id"]
  listId: List["id"]
}) {
  const userId = await getServerUserId()
  await prisma.game.update({
    data: {
      listId,
    },
    where: {
      id: gameId,
      userId,
    },
  })
  revalidatePath(`/list/${listId}`)
}
