import { prisma } from "@/shared/lib/db.server";
import { isUniqueViolationOn } from "@/shared/lib/prisma";

import type {
  LibraryItem,
  Prisma,
} from "../../../../shared/lib/prisma/client.ts";

export interface AddGameToLibraryOptions {
  platform?: string;
}

export interface AddGameToLibraryResult {
  item: LibraryItem;
  created: boolean;
}

const USER_GAME_UNIQUE_FIELDS = ["userId", "gameId"];

/**
 * Inserts the WANT row. The caller guarantees none exists for (userId, gameId);
 * a racing insert surfaces as a unique violation and, inside a transaction,
 * rolls the whole unit back.
 */
export function createWantLibraryItem(
  tx: Prisma.TransactionClient,
  userId: string,
  gameId: string,
  options: AddGameToLibraryOptions = {}
): Promise<LibraryItem> {
  return tx.libraryItem.create({
    data: {
      userId,
      gameId,
      status: "WANT",
      isOwned: true,
      platform: options.platform ?? null,
    },
  });
}

export async function addGameToLibrary(
  userId: string,
  gameId: string,
  options: AddGameToLibraryOptions = {}
): Promise<AddGameToLibraryResult> {
  try {
    const item = await createWantLibraryItem(prisma, userId, gameId, options);
    return { item, created: true };
  } catch (error) {
    if (!isUniqueViolationOn(error, USER_GAME_UNIQUE_FIELDS)) throw error;
    const item = await prisma.libraryItem.findUniqueOrThrow({
      where: { userId_gameId: { userId, gameId } },
    });
    return { item, created: false };
  }
}
