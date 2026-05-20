import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  DISMISS_IMPORTED_GAME_INPUT,
  dismissImportedGameWorker,
} from "./dismiss-imported-game.worker";

/**
 * Server-fn wrapper for the imported-game dismissal.
 *
 * Validate-twice per `createServerFn` convention — the worker re-parses with
 * the same schema to cover programmatic callers. NO `.server.ts` suffix per
 * foot-gun #1.
 */
export const dismissImportedGameFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => DISMISS_IMPORTED_GAME_INPUT.parse(data))
  .handler(async ({ data }): Promise<void> => {
    const userId = await requireUserId();
    await dismissImportedGameWorker(userId, data);
  });
