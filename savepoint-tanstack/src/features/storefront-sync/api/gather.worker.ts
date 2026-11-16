import { claimGather } from "@/entities/import-job/api/claim-gather.server";
import { failImportJob } from "@/entities/import-job/api/fail-import-job.server";
import { recordGatherPlan } from "@/entities/import-job/api/record-gather-plan.server";
import type { ImportFailureCode } from "@/entities/import-job/model";
import { countRefreshedImportedGames } from "@/entities/imported-game/api/count-refreshed-imported-games.server";
import { findLookupCandidates } from "@/entities/imported-game/api/find-lookup-candidates.server";
import { resolveImportedGamesFromCatalogue } from "@/entities/imported-game/api/resolve-imported-games-from-catalogue.server";
import { upsertImportedGamesBatch } from "@/entities/imported-game/api/upsert-imported-games-batch.server";
import type { SteamImportedGameInput } from "@/entities/imported-game/model/types";
import type { SyncQueue } from "@/shared/api/queue";
import {
  SteamApiUnavailableError,
  SteamProfilePrivateError,
  SteamRateLimitError,
} from "@/shared/api/steam/errors";
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

const logger = createLogger({ service: "storefront-sync-gather" });

export async function runGatherMessage(args: {
  message: GatherMessage;
  receiveCount: number;
  queue: SyncQueue;
}): Promise<void> {
  const { message, receiveCount, queue } = args;
  const job = await claimGather(message.jobId);
  if (!job) {
    logger.info(
      { jobId: message.jobId, receiveCount },
      "Dropping gather message for a job that is not gatherable"
    );
    return;
  }

  const refreshedGames = await countRefreshedImportedGames(
    job.userId,
    job.storefront,
    job.createdAt
  );

  const ownedGames = await fetchOwnedGamesOrFailJob(job);
  if (!ownedGames) {
    return;
  }

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
    refreshedGames,
    totalChunks: chunks.length,
  });
  if (!plan) {
    logger.info(
      { jobId: job.id, receiveCount },
      "Gather plan not recorded; the job left GATHERING"
    );
    return;
  }

  const messages = chunks.map(
    (rows, chunkIndex) =>
      ({
        v: 1,
        jobId: job.id,
        chunkIndex,
        importedGameIds: rows.map((row) => row.id),
        lookupCount: rows.filter((row) => row.gameId === null).length,
      }) satisfies EnrichMessage
  );
  await queue.sendBatch("enrich", messages);
}

async function fetchOwnedGamesOrFailJob(job: {
  id: string;
  storefrontAccountId: string;
}): Promise<OwnedGame[] | null> {
  try {
    const ownedGames = await fetchOwnedGames(job.storefrontAccountId);
    if (ownedGames.length > 0) {
      return ownedGames;
    }
    await failImportJob(job.id, "PROFILE_PRIVATE");
    return null;
  } catch (error) {
    const failureCode = toFailureCode(error);
    if (failureCode === "UNKNOWN") {
      logger.error(
        { jobId: job.id, error },
        "Unexpected error while fetching owned games"
      );
    }
    await failImportJob(job.id, failureCode);
    return null;
  }
}

function toFailureCode(error: unknown): ImportFailureCode {
  if (error instanceof SteamProfilePrivateError) {
    return "PROFILE_PRIVATE";
  }
  if (error instanceof SteamApiUnavailableError) {
    return "STEAM_UNAVAILABLE";
  }
  if (error instanceof SteamRateLimitError) {
    return "RATE_LIMITED";
  }
  return "UNKNOWN";
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
