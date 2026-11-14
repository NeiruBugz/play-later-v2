import { claimGather } from "@/entities/import-job/api/claim-gather.server";
import { recordGatherPlan } from "@/entities/import-job/api/record-gather-plan.server";
import { findLookupCandidates } from "@/entities/imported-game/api/find-lookup-candidates.server";
import { resolveImportedGamesFromCatalogue } from "@/entities/imported-game/api/resolve-imported-games-from-catalogue.server";
import { upsertImportedGamesBatch } from "@/entities/imported-game/api/upsert-imported-games-batch.server";
import type { SteamImportedGameInput } from "@/entities/imported-game/model/types";
import {
  fetchOwnedGames,
  type OwnedGame,
} from "@/shared/api/steam/steam-fetch";
import { createLogger } from "@/shared/lib";

import {
  MAX_IMPORTED_GAME_IDS_PER_CHUNK,
  type EnrichMessage,
  type GatherMessage,
} from "../model/messages";
import { getSyncQueue } from "./get-sync-queue";

const logger = createLogger({ service: "storefront-sync-gather" });

export async function runGatherMessage(args: {
  message: GatherMessage;
  receiveCount: number;
}): Promise<void> {
  const { message, receiveCount } = args;
  const job = await claimGather(message.jobId);
  if (!job) {
    logger.info(
      { jobId: message.jobId, receiveCount },
      "Dropping gather message for a job that is not gatherable"
    );
    return;
  }

  const ownedGames = await fetchOwnedGames(job.storefrontAccountId);
  await upsertImportedGamesBatch(
    job.userId,
    ownedGames.map(adaptOwnedGame),
    job.storefront
  );

  await resolveImportedGamesFromCatalogue(job.userId, job.storefront);
  const candidates = await findLookupCandidates(job.userId, job.storefront, {
    includeResolved: true,
  });
  const needsLookup = candidates.filter(
    (candidate) => candidate.gameId === null
  );
  const chunkedRows = job.addAllToLibrary ? candidates : needsLookup;
  const chunks = chunkRows(chunkedRows);

  const plan = await recordGatherPlan(job.id, {
    totalToLookUp: candidates.length,
    lookedUp: candidates.length - needsLookup.length,
    refreshedGames: 0,
    totalChunks: chunks.length,
  });
  if (!plan) {
    logger.info(
      { jobId: job.id, receiveCount },
      "Gather plan not recorded; the job left GATHERING"
    );
    return;
  }

  const queue = getSyncQueue();
  for (const [chunkIndex, rows] of chunks.entries()) {
    await queue.send("enrich", {
      v: 1,
      jobId: job.id,
      chunkIndex,
      importedGameIds: rows.map((row) => row.id),
      lookupCount: rows.filter((row) => row.gameId === null).length,
    } satisfies EnrichMessage);
  }
}

function chunkRows<Row>(rows: Row[]): Row[][] {
  const chunks: Row[][] = [];
  for (
    let start = 0;
    start < rows.length;
    start += MAX_IMPORTED_GAME_IDS_PER_CHUNK
  ) {
    chunks.push(rows.slice(start, start + MAX_IMPORTED_GAME_IDS_PER_CHUNK));
  }
  return chunks;
}

function adaptOwnedGame(game: OwnedGame): SteamImportedGameInput {
  return {
    storefrontGameId: String(game.appId),
    name: game.name,
    playtime: game.playtimeForever,
    playtimeWindows: game.playtimeWindows,
    playtimeMac: game.playtimeMac,
    playtimeLinux: game.playtimeLinux,
    lastPlayedAt:
      game.rtimeLastPlayed && game.rtimeLastPlayed > 0
        ? new Date(game.rtimeLastPlayed * 1000)
        : null,
    imgIconUrl: game.imgIconUrl,
    imgLogoUrl: game.imgLogoUrl,
  };
}
