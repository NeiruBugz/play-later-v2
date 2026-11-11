import { prisma } from "@/shared/lib/db.server";

import { ensureGamesEnrichment } from "./ensure-game-enrichment.server";

const REQUEST_SIZE = 10;
const DEFAULT_DELAY_BETWEEN_REQUESTS_MS = 300;

export type EnrichmentCoverage = {
  totalGames: number;
  gamesWithCreditsTime: number;
};

type BackfillOptions = { delayBetweenRequestsMs?: number };

function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function countCoverage(): Promise<EnrichmentCoverage> {
  const [totalGames, gamesWithCreditsTime] = await Promise.all([
    prisma.game.count(),
    prisma.game.count({ where: { timeToCreditsSeconds: { not: null } } }),
  ]);
  return { totalGames, gamesWithCreditsTime };
}

export async function backfillGameEnrichment({
  delayBetweenRequestsMs = DEFAULT_DELAY_BETWEEN_REQUESTS_MS,
}: BackfillOptions = {}): Promise<EnrichmentCoverage> {
  const unenrichedGames = await prisma.game.findMany({
    where: { timesToBeatFetchedAt: null },
    select: {
      id: true,
      igdbId: true,
      timeToCreditsSeconds: true,
      timeToCompleteSeconds: true,
      timesToBeatFetchedAt: true,
    },
    orderBy: { id: "asc" },
  });

  for (let start = 0; start < unenrichedGames.length; start += REQUEST_SIZE) {
    if (start > 0) await pause(delayBetweenRequestsMs);
    await ensureGamesEnrichment(
      unenrichedGames.slice(start, start + REQUEST_SIZE)
    );
  }

  return countCoverage();
}
