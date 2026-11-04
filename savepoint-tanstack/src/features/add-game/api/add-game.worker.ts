import { z } from "zod";

import { upsertGameFromIgdb } from "@/entities/game/api/upsert-game.server";
import { addGameToLibrary } from "@/entities/library-item/api/add-game-to-library.server";
import type { LibraryItemStatus } from "@/entities/library-item/model";

export const ADD_GAME_INPUT = z.object({
  igdbId: z.number().int().positive(),
});

export interface AddGameResult {
  libraryItemId: number;
  created: boolean;
  status: LibraryItemStatus;
  upNextPosition: number | null;
}

export async function addGameWorker(
  userId: string,
  data: unknown
): Promise<AddGameResult> {
  const { igdbId } = ADD_GAME_INPUT.parse(data);
  const game = await upsertGameFromIgdb(igdbId);
  const { item, created } = await addGameToLibrary(userId, game.id);
  return {
    libraryItemId: item.id,
    created,
    status: item.status,
    upNextPosition: item.upNextPosition,
  };
}
