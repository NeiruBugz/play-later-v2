import { z } from "zod";

import {
  getGameByIgdbId,
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
  status: z.enum(["WISHLIST", "SHELF", "UP_NEXT", "PLAYING", "PLAYED"]),
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

const IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload";

function buildCoverUrl(imageId: string): string {
  return `${IGDB_IMAGE_BASE}/t_cover_big/${imageId}.jpg`;
}

/**
 * Worker for the combined "match + add to library" action.
 *
 * Mirrors canonical `features/steam-import/use-cases/import-game-to-library.ts`
 * but tightened to the throw-on-error AppError taxonomy.
 *
 * Flow:
 *  1. Two-step ownership read on the imported-game row.
 *  2. Resolve igdbId: `manualIgdbId` if provided, otherwise throw
 *     `NeedsManualMatchError` (the auto Steam→IGDB matcher port is a
 *     follow-up — see DIVERGENCES.md).
 *  3. Cache-or-fetch a local `Game` row by `igdbId` (inlined here because
 *     eslint-plugin-boundaries forbids feature→entity-other-than-its-own
 *     calls; the same inline lives in `addGameToLibrary`).
 *  4. Refuse if the user already has a LibraryItem for this game (throws
 *     `ConflictError`; the modal surfaces "already in library").
 *  5. Create the LibraryItem and flip `igdbMatchStatus: MATCHED`.
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

  let game = await prisma.game.findUnique({ where: { igdbId } });
  if (!game) {
    // Prefer the payload we already have from the auto-matcher; otherwise
    // fetch by id. Either way we end up writing a Game row keyed by igdbId.
    const remote = matchedRemote ?? (await getGameByIgdbId(igdbId));
    if (!remote) {
      throw new NotFoundError("Game not found in IGDB", { igdbId });
    }
    const releaseDate =
      typeof remote.first_release_date === "number"
        ? new Date(remote.first_release_date * 1000)
        : null;
    const coverImage = remote.cover?.image_id
      ? buildCoverUrl(remote.cover.image_id)
      : null;
    game = await prisma.game.create({
      data: {
        igdbId: remote.id,
        title: remote.name,
        slug: remote.slug,
        releaseDate,
        coverImage,
      },
    });
  }

  const existing = await prisma.libraryItem.findFirst({
    where: { userId, gameId: game.id },
  });
  if (existing) {
    // Still flip the imported-game status so the row leaves the
    // "needs work" tab — the import intent already succeeded once.
    await prisma.importedGame.update({
      where: { id: importedGameId },
      data: { igdbMatchStatus: "MATCHED" },
    });
    throw new ConflictError("Game is already in your library", {
      gameId: game.id,
    });
  }

  const libraryItem = await prisma.libraryItem.create({
    data: {
      userId,
      gameId: game.id,
      status,
      platform: "PC (Microsoft Windows)",
    },
  });

  await prisma.importedGame.update({
    where: { id: importedGameId },
    data: { igdbMatchStatus: "MATCHED" },
  });

  return {
    libraryItemId: libraryItem.id,
    gameId: game.id,
    gameSlug: game.slug,
  };
}
