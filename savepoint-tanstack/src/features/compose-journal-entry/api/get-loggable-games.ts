import { createServerFn } from "@tanstack/react-start";

import type { GetLibraryResult } from "@/entities/library-item/api/get-library.server";
import { requireUserId } from "@/entities/session/api/require-user-id";

import { getLoggableGamesWorker } from "./get-loggable-games.worker";

export const getLoggableGamesFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<GetLibraryResult> => {
    const userId = await requireUserId();
    return getLoggableGamesWorker(userId);
  }
);
