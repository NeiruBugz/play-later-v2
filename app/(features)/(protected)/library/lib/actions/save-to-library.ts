"use server";

import { revalidatePath } from "next/cache";
import { Game } from "@prisma/client";

import { getServerUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const LIBRARY_PATH = '/library?status="BACKLOG"';

export async function saveGameToLibrary(game: Omit<Game, "userId">) {
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
  }
}
