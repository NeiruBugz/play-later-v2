"use server";

import { getServerUserId } from "@/auth";
import { prisma } from "@/src/packages/prisma";
import { sessionErrorHandler } from "@/src/packages/utils";
import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

const LIBRARY_PATH = '/library?status="BACKLOG"';

export async function saveGameToLibrary(
  game: Omit<Prisma.GameCreateInput, "user">
) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      sessionErrorHandler();
      return;
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
        userId,
      },
    });
  } catch (e) {
    throw new Error("Couldn't save the game");
  } finally {
    revalidatePath(LIBRARY_PATH);
  }
}
