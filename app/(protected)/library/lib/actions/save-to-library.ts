"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const LIBRARY_PATH = '/library?status="BACKLOG"';

export async function saveGameToLibrary(
  game: Omit<Prisma.GameCreateInput, "user">
) {
  try {
    const userId = await auth();
    if (!userId?.user || !userId.user.id) {
      throw new Error("You must be logged in to save a game");
    }

    const {
      id,
      igdbId,
      howLongToBeatId,
      status,
      updatedAt,
      imageUrl,
      deletedAt,
      review,
      rating,
      createdAt,
      title,
      isWishlisted,
      gameplayTime,
      purchaseType,
    } = game;
    await prisma.game.create({
      data: {
        id,
        igdbId,
        howLongToBeatId,
        status,
        updatedAt,
        imageUrl,
        deletedAt,
        review,
        rating,
        createdAt,
        title,
        isWishlisted,
        gameplayTime,
        purchaseType,
        userId: userId.user?.id,
      },
    });
  } catch (e) {
    throw new Error("Couldn't save the game");
  } finally {
    revalidatePath(LIBRARY_PATH);
  }
}
