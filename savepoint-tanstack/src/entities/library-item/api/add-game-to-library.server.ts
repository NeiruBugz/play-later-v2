import { prisma } from "@/shared/lib/db.server";
import { isUniqueViolationOn } from "@/shared/lib/prisma";

import type { LibraryItem } from "../../../../shared/lib/prisma/client.ts";

export interface AddGameToLibraryOptions {
  platform?: string;
}

export interface AddGameToLibraryResult {
  item: LibraryItem;
  created: boolean;
}

const USER_GAME_UNIQUE_FIELDS = ["userId", "gameId"];

export async function addGameToLibrary(
  userId: string,
  gameId: string,
  options: AddGameToLibraryOptions = {}
): Promise<AddGameToLibraryResult> {
  try {
    const item = await prisma.libraryItem.create({
      data: {
        userId,
        gameId,
        status: "WANT",
        isOwned: true,
        platform: options.platform ?? null,
      },
    });
    return { item, created: true };
  } catch (error) {
    if (!isUniqueViolationOn(error, USER_GAME_UNIQUE_FIELDS)) throw error;
    const item = await prisma.libraryItem.findUniqueOrThrow({
      where: { userId_gameId: { userId, gameId } },
    });
    return { item, created: false };
  }
}
