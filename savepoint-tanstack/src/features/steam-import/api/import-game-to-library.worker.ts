import { z } from "zod";

import {
  upsertGameFromIgdb,
  upsertGameFromIgdbPayload,
} from "@/entities/game/api/upsert-game.server";
import { createWantLibraryItem } from "@/entities/library-item/api/add-game-to-library.server";
import { setLibraryItemStatusInTx } from "@/entities/library-item/api/set-library-item-status.server";
import { lockUserQueue } from "@/entities/library-item/api/up-next-queue.server";
import { libraryItemStatusSchema } from "@/entities/library-item/model";
import {
  matchSteamGameByAppId,
  type SearchResponseItem,
} from "@/shared/api/igdb";
import { prisma } from "@/shared/lib/db.server";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "@/shared/lib/errors";

import { NeedsManualMatchError } from "./errors";

export const IMPORT_GAME_TO_LIBRARY_INPUT = z.object({
  importedGameId: z.string().min(1),
  status: libraryItemStatusSchema,
  manualIgdbId: z.number().int().positive().optional(),
});

export type ImportGameToLibraryInput = z.infer<
  typeof IMPORT_GAME_TO_LIBRARY_INPUT
>;

export type ImportGameToLibraryResult = {
  libraryItemId: number;
  gameId: string;
  gameSlug: string;
};

/**
 * Worker for the combined "match + add to library" action.
 *
 * Flow:
 *  1. Two-step ownership read on the imported-game row.
 *  2. Resolve igdbId: `manualIgdbId` if provided, otherwise throw
 *     `NeedsManualMatchError`.
 *  3. Cache-or-fetch a local `Game` row by `igdbId` via entities/game.
 *  4. In one transaction: refuse if the user already has a LibraryItem for
 *     this game (throws `ConflictError` after flipping MATCHED; the modal
 *     surfaces "already in library"); otherwise create the LibraryItem (WANT),
 *     move it to the chosen status through `setLibraryItemStatusInTx` (so a
 *     PLAYING import opens a play), and flip `igdbMatchStatus: MATCHED`.
 */
export async function importGameToLibraryWorker(
  userId: string | undefined,
  data: unknown
): Promise<ImportGameToLibraryResult> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required to import games");
  }

  const parsed = IMPORT_GAME_TO_LIBRARY_INPUT.parse(data);
  const { importedGameId, status, manualIgdbId } = parsed;

  const importedGame = await prisma.importedGame.findUnique({
    where: { id: importedGameId },
  });
  if (
    !importedGame ||
    importedGame.userId !== userId ||
    importedGame.deletedAt !== null
  ) {
    throw new NotFoundError("Imported game not found", { importedGameId });
  }

  // Resolve igdbId. Three sources, in order:
  //   1. Caller-supplied manualIgdbId (user picked from search).
  //   2. Auto-match via Steam App ID → IGDB external_games join.
  //   3. NeedsManualMatchError so the UI falls back to manual search.
  let igdbId: number;
  let matchedRemote: SearchResponseItem | null = null;
  if (manualIgdbId !== undefined) {
    igdbId = manualIgdbId;
  } else {
    if (!importedGame.storefrontGameId) {
      throw new NeedsManualMatchError(
        "Imported game has no Steam app id — pick the IGDB entry manually.",
        { importedGameId }
      );
    }
    const match = await matchSteamGameByAppId(importedGame.storefrontGameId);
    if (!match) {
      // Persist UNMATCHED so the row surfaces in the filter, then signal
      // the modal to switch to manual search.
      await prisma.importedGame.update({
        where: { id: importedGameId },
        data: { igdbMatchStatus: "UNMATCHED" },
      });
      throw new NeedsManualMatchError(
        "No IGDB match found for this Steam game — pick manually.",
        { importedGameId, steamAppId: importedGame.storefrontGameId }
      );
    }
    igdbId = match.id;
    matchedRemote = match;
  }

  // Delegate caching and URL generation cleanly to entities/game
  const game = matchedRemote
    ? await upsertGameFromIgdbPayload(matchedRemote)
    : await upsertGameFromIgdb(igdbId);

  // One transaction: library item, status change and MATCHED flip commit or
  // roll back together, so a retry after a failure starts from a clean slate.
  // The per-user advisory lock (shared with status changes) serialises
  // concurrent imports of the same game.
  const outcome = await prisma.$transaction(async (tx) => {
    await lockUserQueue(tx, userId);

    const existing = await tx.libraryItem.findUnique({
      where: { userId_gameId: { userId, gameId: game.id } },
      select: { id: true },
    });
    // Flip the imported-game status either way so the row leaves the
    // "needs work" tab — the import intent already succeeded once.
    await tx.importedGame.update({
      where: { id: importedGameId },
      data: { igdbMatchStatus: "MATCHED" },
    });
    if (existing) return { alreadyInLibrary: true } as const;

    let item = await createWantLibraryItem(tx, userId, game.id, {
      platform: "PC (Microsoft Windows)",
    });
    if (status !== item.status) {
      ({ item } = await setLibraryItemStatusInTx(tx, userId, item.id, status));
    }
    return { alreadyInLibrary: false, libraryItemId: item.id } as const;
  });

  if (outcome.alreadyInLibrary) {
    throw new ConflictError("Game is already in your library", {
      gameId: game.id,
    });
  }

  return {
    libraryItemId: outcome.libraryItemId,
    gameId: game.id,
    gameSlug: game.slug,
  };
}
