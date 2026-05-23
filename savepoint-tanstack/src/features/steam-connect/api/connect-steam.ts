import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  CONNECT_STEAM_INPUT,
  connectSteamWorker,
} from "./connect-steam.worker";

/**
 * Server-fn wrapper for the Steam connect mutation.
 *
 * Validate-twice per the createServerFn convention: `inputValidator` runs
 * only on cross-network calls; the worker re-parses with the same Zod schema
 * to cover programmatic callers.
 *
 * NO `.server.ts` suffix per foot-gun #1 — the file is intentionally
 * client-importable (the bundler stubs the handler body on the client).
 */
export const connectSteamFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CONNECT_STEAM_INPUT.parse(data))
  .handler(async ({ data }): Promise<{ steamId: string }> => {
    const userId = await requireUserId();
    return connectSteamWorker(userId, data);
  });
