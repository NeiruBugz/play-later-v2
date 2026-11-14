import { env } from "@env";

import { setGameSteamAppIds } from "@/entities/game/api/set-game-steam-app-ids.server";
import { upsertGamesFromIgdbBatch } from "@/entities/game/api/upsert-games-from-igdb-batch.server";
import { finalizeImportJobIfComplete } from "@/entities/import-job/api/finalize-import-job-if-complete.server";
import { recordChunkDone } from "@/entities/import-job/api/record-chunk-done.server";
import { applyLookupResults } from "@/entities/imported-game/api/apply-lookup-results.server";
import { findLookupCandidates } from "@/entities/imported-game/api/find-lookup-candidates.server";
import { matchSteamGamesByAppIds } from "@/shared/api/igdb/match-steam-games";
import { igdbPacer } from "@/shared/api/igdb/pacer";
import { createLogger } from "@/shared/lib";
import { prisma } from "@/shared/lib/db.server";

import type { EnrichMessage } from "../model/messages";

const logger = createLogger({ service: "storefront-sync-enrich" });

type LookupResult = { id: string; gameId: string | null };

export async function runEnrichMessage(args: {
  message: EnrichMessage;
  receiveCount: number;
}): Promise<void> {
  const { message, receiveCount } = args;
  const log = logger.child({ jobId: message.jobId, receiveCount });

  const job = await prisma.importJob.findUnique({
    where: { id: message.jobId },
    select: { status: true, userId: true, storefront: true },
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
  await recordChunkDone(message.jobId, message.chunkIndex, {
    lookupCount: message.lookupCount,
    added: 0,
  });
  await finalizeImportJobIfComplete(message.jobId);
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
