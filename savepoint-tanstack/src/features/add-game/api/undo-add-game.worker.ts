import { z } from "zod";

import { undoAddGame } from "@/entities/library-item/api/undo-add-game.server";

export const UNDO_ADD_GAME_INPUT = z.object({
  libraryItemId: z.number().int().positive(),
});

export async function undoAddGameWorker(
  userId: string,
  data: unknown
): Promise<Record<string, never>> {
  const { libraryItemId } = UNDO_ADD_GAME_INPUT.parse(data);
  await undoAddGame(userId, libraryItemId);
  return {};
}
