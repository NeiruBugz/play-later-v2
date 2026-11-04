import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  ADD_GAME_INPUT,
  addGameWorker,
  type AddGameResult,
} from "./add-game.worker";

export type { AddGameResult };

export const addGameFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ADD_GAME_INPUT.parse(data))
  .handler(async ({ data }): Promise<AddGameResult> => {
    const userId = await requireUserId();
    return addGameWorker(userId, data);
  });
