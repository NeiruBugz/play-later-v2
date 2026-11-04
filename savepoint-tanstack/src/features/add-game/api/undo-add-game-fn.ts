import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import { UNDO_ADD_GAME_INPUT, undoAddGameWorker } from "./undo-add-game.worker";

export const undoAddGameFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => UNDO_ADD_GAME_INPUT.parse(data))
  .handler(async ({ data }): Promise<Record<string, never>> => {
    const userId = await requireUserId();
    return undoAddGameWorker(userId, data);
  });
