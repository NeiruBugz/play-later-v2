import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { upsertGameFromIgdb } from "@/entities/game/api/upsert-game.server";
import { addGameToLibrary } from "@/entities/library-item/api/add-game-to-library.server";
import { requireUserId } from "@/entities/session/api/require-user-id";

import type { LibraryItem } from "../../../../shared/lib/prisma/client.ts";

const ADD_GAME_INPUT = z.object({
  igdbId: z.number().int().positive(),
  status: z
    .enum(["WISHLIST", "SHELF", "UP_NEXT", "PLAYING", "PLAYED"])
    .optional(),
  platform: z.string().min(1).max(64).optional(),
});

export const addGameToLibraryFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ADD_GAME_INPUT.parse(data))
  .handler(async ({ data }): Promise<LibraryItem> => {
    const parsed = ADD_GAME_INPUT.parse(data);

    const userId = await requireUserId();

    const game = await upsertGameFromIgdb(parsed.igdbId);

    return addGameToLibrary(userId, {
      gameId: game.id,
      status: parsed.status,
      platform: parsed.platform,
    });
  });
