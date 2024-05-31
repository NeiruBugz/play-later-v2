"use server";

import type { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { getServerUserId } from "@/auth";

import { db } from "@/src/shared/api";
import { sessionErrorHandler } from "@/src/shared/lib/error-handlers";

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
      status,
      title,
      updatedAt,
    } = game;

    await db.game.create({
      data: {
        createdAt,
        deletedAt,
        gameplayTime,
        howLongToBeatId,
        id: id || nanoid(),
        igdbId,
        imageUrl,
        isWishlisted,
        ownagePlatform: [],
        purchaseType,
        rating,
        review: undefined,
        status,
        title,
        updatedAt,
        userId,
      },
    });
  } catch (e) {
    console.error(e);
    throw new Error("Couldn't save the game");
  } finally {
    revalidatePath(LIBRARY_PATH);
  }
}
