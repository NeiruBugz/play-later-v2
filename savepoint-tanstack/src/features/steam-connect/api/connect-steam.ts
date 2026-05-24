import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  CONNECT_STEAM_INPUT,
  connectSteamWorker,
} from "./connect-steam.worker";

export const connectSteamFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CONNECT_STEAM_INPUT.parse(data))
  .handler(async ({ data }): Promise<{ steamId: string }> => {
    const userId = await requireUserId();
    return connectSteamWorker(userId, data);
  });
