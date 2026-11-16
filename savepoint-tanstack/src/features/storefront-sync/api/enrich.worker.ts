import { env } from "@env";

import { setGameSteamAppIds } from "@/entities/game/api/set-game-steam-app-ids.server";
import { upsertGamesFromIgdbBatch } from "@/entities/game/api/upsert-games-from-igdb-batch.server";
import { finalizeImportJobIfComplete } from "@/entities/import-job/api/finalize-import-job-if-complete.server";
import { recordChunkDone } from "@/entities/import-job/api/record-chunk-done.server";
import { calculateSmartStatus } from "@/entities/imported-game";
import { applyLookupResults } from "@/entities/imported-game/api/apply-lookup-results.server";
import { countMatchedImportedGames } from "@/entities/imported-game/api/count-matched-imported-games.server";
import {
  findImportableRowsInChunk,
  type ImportableRow,
} from "@/entities/imported-game/api/find-importable-rows-in-chunk.server";
import { findLookupCandidates } from "@/entities/imported-game/api/find-lookup-candidates.server";
import { markImportedGameMatchedInTx } from "@/entities/imported-game/api/mark-imported-game-matched.server";
import { createWantLibraryItem } from "@/entities/library-item/api/add-game-to-library.server";
import { setLibraryItemStatusInTx } from "@/entities/library-item/api/set-library-item-status.server";
import { matchSteamGamesByAppIds } from "@/shared/api/igdb/match-steam-games";
import { igdbPacer } from "@/shared/api/igdb/pacer";
import { createLogger } from "@/shared/lib";
import { prisma } from "@/shared/lib/db.server";
import { isUniqueViolationOn } from "@/shared/lib/prisma";

import type { EnrichMessage } from "../model/messages";

const logger = createLogger({ service: "storefront-sync-enrich" });

const STEAM_LIBRARY_PLATFORM = "PC (Microsoft Windows)";
const USER_GAME_UNIQUE_FIELDS = ["userId", "gameId"];

type LookupResult = { id: string; gameId: string | null };

export async function runEnrichMessage(args: {
  message: EnrichMessage;
  receiveCount: number;
}): Promise<void> {
  const { message, receiveCount } = args;
  const log = logger.child({ jobId: message.jobId, receiveCount });

  const job = await prisma.importJob.findUnique({
    where: { id: message.jobId },
    select: {
      status: true,
      userId: true,
      storefront: true,
      addAllToLibrary: true,
    },
  });
  if (job?.status !== "LOOKING_UP") {
    log.info("Dropping enrich message for a job that is not looking up");
    return;
  }

  const chunkIds = new Set(message.importedGameIds);
  const rowsNeedingLookup = (
    await findLookupCandidates(job.userId, job.storefront, {
      includeResolved: false,
    })
  ).filter((row) => chunkIds.has(row.id));

  const isFinalAttempt = receiveCount >= env.SYNC_MAX_RECEIVE_COUNT;
  const results = isFinalAttempt
    ? rowsNeedingLookup.map((row) => ({ id: row.id, gameId: null }))
    : await lookUpInIgdb(rowsNeedingLookup);
  if (isFinalAttempt) {
    log.warn(
      { rows: rowsNeedingLookup.length },
      "Final delivery attempt: marking the chunk as needing a match"
    );
  }

  await applyLookupResults(results);

  let added = 0;
  if (job.addAllToLibrary) {
    await addFoundGamesToLibrary(job.userId, message.importedGameIds);
    added = await countMatchedImportedGames(
      job.userId,
      message.importedGameIds
    );
  }

  await recordChunkDone(message.jobId, message.chunkIndex, {
    lookupCount: message.lookupCount,
    added,
  });
  await finalizeImportJobIfComplete(message.jobId);
}

async function addFoundGamesToLibrary(
  userId: string,
  importedGameIds: string[]
): Promise<void> {
  const rows = await findImportableRowsInChunk(userId, importedGameIds);
  for (const row of rows) {
    await addGameInOwnTransaction(userId, row);
  }
}

async function addGameInOwnTransaction(
  userId: string,
  row: ImportableRow
): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.libraryItem.findUnique({
        where: { userId_gameId: { userId, gameId: row.gameId } },
        select: { id: true },
      });
      if (existing) return;

      const item = await createWantLibraryItem(tx, userId, row.gameId, {
        platform: STEAM_LIBRARY_PLATFORM,
      });
      if (calculateSmartStatus(row) === "PLAYING") {
        await setLibraryItemStatusInTx(tx, userId, item.id, "PLAYING");
      }
      await markImportedGameMatchedInTx(tx, row.id);
    });
  } catch (error) {
    if (!isUniqueViolationOn(error, USER_GAME_UNIQUE_FIELDS)) throw error;
    logger.info(
      { importedGameId: row.id },
      "Another writer added the game first; skipping it"
    );
  }
}

async function lookUpInIgdb(
  rows: { id: string; storefrontGameId: string | null }[]
): Promise<LookupResult[]> {
  const appIds = [
    ...new Set(
      rows.map((row) => row.storefrontGameId).filter((id) => id !== null)
    ),
  ];
  if (appIds.length === 0)
    return rows.map((row) => ({ id: row.id, gameId: null }));

  await igdbPacer.waitForTurn();
  const matches = await matchSteamGamesByAppIds(appIds);
  const gameIdByIgdbId = await upsertGamesFromIgdbBatch([...matches.values()]);

  const gameIdByAppId = new Map<string, string>();
  for (const [appId, igdbGame] of matches) {
    const gameId = gameIdByIgdbId.get(igdbGame.id);
    if (gameId) gameIdByAppId.set(appId, gameId);
  }
  await setGameSteamAppIds(
    [...gameIdByAppId].map(([appId, gameId]) => ({
      gameId,
      steamAppId: Number(appId),
    }))
  );

  return rows.map((row) => ({
    id: row.id,
    gameId:
      (row.storefrontGameId && gameIdByAppId.get(row.storefrontGameId)) || null,
  }));
}
