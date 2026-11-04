import { createServerFn } from "@tanstack/react-start";

import type { LoggableGame } from "@/entities/library-item/api/get-loggable-games.server";
import { requireUserId } from "@/entities/session/api/require-user-id";

import { getLoggableGamesWorker } from "./get-loggable-games.worker";

export const getLoggableGamesFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<LoggableGame[]> => {
    const userId = await requireUserId();
    return getLoggableGamesWorker(userId);
  }
);
