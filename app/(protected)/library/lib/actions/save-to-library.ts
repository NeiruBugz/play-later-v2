"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

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
      createdAt,
      deletedAt,
      gameplayTime,
      howLongToBeatId,
      id,
      igdbId,
      imageUrl,
      isWishlisted,
      purchaseType,
      rating,
      review,
      status,
      title,
      updatedAt,
    } = game;

    await prisma.game.create({
      data: {
        createdAt,
        deletedAt,
        gameplayTime,
        howLongToBeatId,
        id: id || nanoid(),
        igdbId,
        imageUrl,
        isWishlisted,
        purchaseType,
        rating,
        review,
        status,
        title,
        updatedAt,
        userId: userId.user?.id,
      },
    });
  } catch (e) {
    throw new Error("Couldn't save the game");
  } finally {
    revalidatePath(LIBRARY_PATH);
  }
}
