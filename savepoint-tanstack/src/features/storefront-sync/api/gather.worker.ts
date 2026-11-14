import { claimGather } from "@/entities/import-job/api/claim-gather.server";
import { recordGatherPlan } from "@/entities/import-job/api/record-gather-plan.server";
import { upsertImportedGamesBatch } from "@/entities/imported-game/api/upsert-imported-games-batch.server";
import type { SteamImportedGameInput } from "@/entities/imported-game/model/types";
import {
  fetchOwnedGames,
  type OwnedGame,
} from "@/shared/api/steam/steam-fetch";
import { createLogger } from "@/shared/lib";

import type { GatherMessage } from "../model/messages";

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

  await recordGatherPlan(job.id, {
    totalToLookUp: 0,
    lookedUp: 0,
    refreshedGames: 0,
    totalChunks: 0,
  });
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
