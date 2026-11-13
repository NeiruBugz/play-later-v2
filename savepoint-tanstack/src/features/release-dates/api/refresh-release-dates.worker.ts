import {
  applyReleaseChecks,
  type ReleaseCheckWrite,
} from "@/entities/game/api/apply-release-checks.server";
import { getGamesDueReleaseCheck } from "@/entities/game/api/get-games-due-release-check.server";
import { applyReleaseCheck } from "@/entities/game/model/release-check";
import {
  getGamesReleaseInfoByIgdbIds,
  mapIgdbReleaseDate,
  type GameReleaseInfo,
} from "@/shared/api/igdb";
import { UnauthorizedError, UpstreamError } from "@/shared/lib/errors";
import { createLogger } from "@/shared/lib/logger";

const log = createLogger({ scope: "refresh-release-dates" });

export type RefreshReleaseDatesResult = { checked: number; updated: number };

const NOTHING_REFRESHED: RefreshReleaseDatesResult = {
  checked: 0,
  updated: 0,
};

async function fetchReleaseInfoOrNothing(
  igdbIds: number[]
): Promise<Map<number, GameReleaseInfo> | null> {
  try {
    return await getGamesReleaseInfoByIgdbIds(igdbIds);
  } catch (error) {
    if (!(error instanceof UpstreamError)) throw error;
    log.warn({ err: error }, "IGDB release check failed, nothing stamped");
    return null;
  }
}

export async function refreshReleaseDatesWorker(
  userId: string | undefined
): Promise<RefreshReleaseDatesResult> {
  if (!userId) throw new UnauthorizedError("Sign in required");

  const now = new Date();
  const dueGames = await getGamesDueReleaseCheck(userId, now);
  if (dueGames.length === 0) return NOTHING_REFRESHED;

  const releaseInfoByIgdbId = await fetchReleaseInfoOrNothing(
    dueGames.map((game) => game.igdbId)
  );
  if (!releaseInfoByIgdbId) return NOTHING_REFRESHED;

  const writes: ReleaseCheckWrite[] = dueGames.map((game) => {
    const releaseInfo = releaseInfoByIgdbId.get(game.igdbId);
    return {
      gameId: game.id,
      stored: {
        releaseDate: game.releaseDate,
        releaseDatePrecision: game.releaseDatePrecision,
      },
      data: applyReleaseCheck(
        game,
        releaseInfo ? mapIgdbReleaseDate(releaseInfo) : "unknown",
        now
      ),
    };
  });

  const updated = await applyReleaseChecks(writes);
  return { checked: writes.length, updated };
}
