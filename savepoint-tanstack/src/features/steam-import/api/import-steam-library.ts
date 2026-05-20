import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import { importSteamLibraryWorker } from "./import-steam-library.worker";

/**
 * Server-fn wrapper for the Steam library import.
 *
 * No input — the authed session + the user's stored `steamId64` are the only
 * signals needed. NO `.server.ts` suffix per foot-gun #1.
 */
export const importSteamLibraryFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ imported: number; total: number }> => {
    const userId = await requireUserId();
    return importSteamLibraryWorker(userId);
  }
);
