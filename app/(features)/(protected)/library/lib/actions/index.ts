"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { GameStatus, List, type Game } from "@prisma/client";

import { getServerUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FilterKeys } from "@/lib/types/library";

import { prepareResponse } from "@/app/(features)/(protected)/library/lib/helpers";

const LIBRARY_PATH = "/library";

async function getUserId() {
  return await getServerUserId();
}

export async function getAllGames(): Promise<Game[]> {
  const userId = await getUserId();

  return prisma.game.findMany({
    where: {
      userId,
      deletedAt: null,
    },
  });
}

export async function getGames(
  filters: Record<FilterKeys, string | undefined>
) {
  const userId = await getUserId();

  const sortState = {
    key: filters.sortBy || "updatedAt",
    order: filters.order || "desc",
  };

  let platform: string | undefined;

  if (filters.platform === "" || filters.platform === " ") {
    platform = undefined;
  } else {
    platform = filters.platform;
  }
  const games: Game[] = await prisma.game.findMany({
    where: {
      title: {
        contains: filters.search || "",
      },
      userId,
      deletedAt: null,
      platform: { contains: platform },
    },
    orderBy: {
      [sortState.key as keyof Game]: sortState.order as "asc" | "desc",
    },
  });

  return {
    abandoned: games.filter((game) => game.status === GameStatus.ABANDONED),
    backlogged: games.filter((game) => game.status === GameStatus.BACKLOG),
    completed: games.filter((game) => game.status === GameStatus.COMPLETED),
    inprogress: games.filter((game) => game.status === GameStatus.INPROGRESS),
    fullCompletion: games.filter(
      (game) => game.status === GameStatus.FULL_COMPLETION
    ),
  };
}

export async function addGame(game: Omit<Game, "userId">) {
  const userId = await getServerUserId();
  const {
    id,
    igdbId,
    howLongToBeatId,
    status,
    updatedAt,
    imageUrl,
    platform,
    listId,
    deletedAt,
    review,
    rating,
    createdAt,
    title,
    isWishlisted,
    gameplayTime,
    purchaseType,
  } = game;
  try {
    await prisma.game.create({
      data: {
        id,
        igdbId,
        howLongToBeatId,
        status,
        updatedAt,
        imageUrl,
        platform,
        listId,
        deletedAt,
        review,
        rating,
        createdAt,
        title,
        isWishlisted,
        gameplayTime,
        purchaseType,
        userId: userId,
      },
    });
  } catch (e) {
    throw new Error("Couldn't save the game");
  } finally {
    revalidatePath(LIBRARY_PATH);
    redirect(LIBRARY_PATH);
  }
}

export async function getGame(id: Game["id"]) {
  const userId = await getUserId();
  const game = await prisma.game.findUnique({
    where: {
      id,
      userId,
    },
  });

  return await prepareResponse({ game: game as Game });
}

export async function getGameFromWishlist(id: Game["id"]) {
  const userId = await getUserId();
  const game = await prisma.game.findUnique({
    where: {
      id,
      userId,
      isWishlisted: true,
    },
  });

  return await prepareResponse({ game: game as Game });
}

export async function updateStatus(id: Game["id"], status: Game["status"]) {
  const userId = await getUserId();

  await prisma.game.update({
    data: {
      status: status,
    },
    where: {
      id,
      userId,
    },
  });

  revalidatePath(`${LIBRARY_PATH}/${id}`);
  revalidatePath(LIBRARY_PATH);
}

export async function deleteGame(id: Game["id"]) {
  const userId = await getUserId();

  await prisma.game.update({
    data: {
      deletedAt: new Date(),
    },
    where: { id, userId },
  });

  revalidatePath(LIBRARY_PATH);
  redirect(LIBRARY_PATH);
}

export async function updateGame(
  id: Game["id"],
  gameKey: keyof Game,
  value: Game[keyof Game],
  updatedAt?: Date
) {
  const userId = await getUserId();
  await prisma.game.update({
    data: {
      [gameKey]: value,
      updatedAt,
    },
    where: { id, userId },
  });
  revalidatePath(LIBRARY_PATH);
}

export async function addGameReview({
  id,
  review,
  rating,
}: {
  id: Game["id"];
  review: string;
  rating: number;
}) {
  const userId = await getUserId();
  await prisma.game.update({
    data: {
      rating: rating === 0 ? undefined : rating,
      review: review,
    },
    where: {
      id,
      userId,
    },
  });
  revalidatePath(`${LIBRARY_PATH}/${id}`);
}

export async function getRandomGames() {
  const userId = await getUserId();
  const games = await prisma.game.findMany({
    where: {
      userId,
      deletedAt: null,
    },
  });

  return games.sort(() => Math.random() - 0.5).slice(0, 20);
}

export async function getListGames(id: List["id"]) {
  const userId = await getUserId();
  return prisma.game.findMany({
    where: {
      userId,
      deletedAt: null,
      listId: id,
    },
  });
}

export async function getListGamesArtworks(id: List["id"]) {
  const userId = await getUserId();
  const games = await prisma.game.findMany({
    where: {
      userId,
      deletedAt: null,
      listId: id,
    },
  });

  return games.map((game) => ({
    id: game.id,
    artwork: game.imageUrl,
    game: game.title,
  }));
}

export async function addGameToList({
  gameId,
  listId,
}: {
  gameId: Game["id"];
  listId: List["id"];
}) {
  const userId = await getServerUserId();
  await prisma.game.update({
    data: {
      listId,
    },
    where: {
      id: gameId,
      userId,
    },
  });
  revalidatePath(`/list/${listId}`);
}

export async function getAllUserPlatforms() {
  const userId = await getServerUserId();

  return prisma.game.findMany({
    distinct: ["platform"],
    where: {
      userId: userId,
    },
    select: {
      platform: true,
    },
  });
}
