import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  IMPORT_GAME_TO_LIBRARY_INPUT,
  importGameToLibraryWorker,
  type ImportGameToLibraryResult,
} from "./import-game-to-library.worker";

export const importGameToLibraryFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => IMPORT_GAME_TO_LIBRARY_INPUT.parse(data))
  .handler(async ({ data }): Promise<ImportGameToLibraryResult> => {
    const userId = await requireUserId();
    return importGameToLibraryWorker(userId, data);
  });
