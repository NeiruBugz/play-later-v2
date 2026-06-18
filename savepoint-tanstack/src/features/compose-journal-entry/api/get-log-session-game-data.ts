import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  GET_LOG_SESSION_GAME_DATA_INPUT,
  getLogSessionGameDataWorker,
  type GetLogSessionGameDataResult,
} from "./get-log-session-game-data.worker";

export const getLogSessionGameDataFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    GET_LOG_SESSION_GAME_DATA_INPUT.parse(data)
  )
  .handler(async ({ data }): Promise<GetLogSessionGameDataResult> => {
    const userId = await requireUserId();
    return getLogSessionGameDataWorker(userId, data);
  });
