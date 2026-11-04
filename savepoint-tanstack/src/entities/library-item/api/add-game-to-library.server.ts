import { prisma } from "@/shared/lib/db.server";

import type {
  LibraryItem,
  LibraryItemStatus,
} from "../../../../shared/lib/prisma/client.ts";

export interface AddGameToLibraryInput {
  gameId: string;
  status?: LibraryItemStatus;
  platform?: string;
}

export async function addGameToLibrary(
  userId: string,
  input: AddGameToLibraryInput
): Promise<LibraryItem> {
  const existingItem = await prisma.libraryItem.findFirst({
    where: { userId, gameId: input.gameId },
  });
  if (existingItem) {
    return existingItem;
  }

  return prisma.libraryItem.create({
    data: {
      userId,
      gameId: input.gameId,
      status: input.status ?? "WANT",
      platform: input.platform ?? null,
    },
  });
}
