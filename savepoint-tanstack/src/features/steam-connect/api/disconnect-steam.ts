import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireUserId } from "@/entities/session/api/require-user-id";

import { disconnectSteamWorker } from "./disconnect-steam.worker";

// Empty-object input — the call envelope `disconnectSteamFn({ data: {} })`
// is locked by the component-test contract. Zod's `.passthrough()` ensures
// trailing props are tolerated if a future caller adds them.
const DISCONNECT_STEAM_INPUT = z.object({}).passthrough();

/**
 * Server-fn wrapper for the Steam disconnect mutation.
 *
 * No input — the authed session is the only signal needed. The empty-object
 * call envelope (`disconnectSteamFn({ data: {} })`) is locked by the
 * component-test contract.
 *
 * NO `.server.ts` suffix per foot-gun #1.
 */
export const disconnectSteamFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => DISCONNECT_STEAM_INPUT.parse(data))
  .handler(async (): Promise<void> => {
    const userId = await requireUserId();
    await disconnectSteamWorker(userId);
  });
