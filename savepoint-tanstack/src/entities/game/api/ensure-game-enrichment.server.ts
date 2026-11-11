import { createLogger } from "@/shared/lib";
import { prisma } from "@/shared/lib/db.server";

import type { Game } from "../../../../shared/lib/prisma/client.ts";
import { getTimesToBeatForGames } from "./get-times-to-beat.server";

const logger = createLogger({ service: "ensure-game-enrichment" });

const TIMES_REFRESH_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
const TIMES_BATCH_SIZE = 10;

export type EnrichableGame = Pick<
  Game,
  | "id"
  | "igdbId"
  | "timeToCreditsSeconds"
  | "timeToCompleteSeconds"
  | "timesToBeatFetchedAt"
>;

export type GameEnrichment = Pick<
  Game,
  "timeToCreditsSeconds" | "timeToCompleteSeconds" | "timesToBeatFetchedAt"
>;

function needsTimes(game: EnrichableGame, now: number): boolean {
  return (
    game.timesToBeatFetchedAt === null ||
    now - game.timesToBeatFetchedAt.getTime() > TIMES_REFRESH_AFTER_MS
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size));
  }
  return chunks;
}

async function refreshTimes(
  batch: EnrichableGame[],
  enrichments: Map<string, GameEnrichment>
): Promise<void> {
  let timesByIgdbId: Awaited<ReturnType<typeof getTimesToBeatForGames>>;
  try {
    timesByIgdbId = await getTimesToBeatForGames(
      batch.map((game) => game.igdbId)
    );
  } catch (error) {
    logger.warn(
      { error, gameIds: batch.map((game) => game.id) },
      "Times-to-beat enrichment failed; will retry on a later view"
    );
    return;
  }

  for (const game of batch) {
    const times = timesByIgdbId.get(game.igdbId);
    const timesFields: GameEnrichment = {
      timeToCreditsSeconds: times?.timeToCreditsSeconds ?? null,
      timeToCompleteSeconds: times?.timeToCompleteSeconds ?? null,
      timesToBeatFetchedAt: new Date(),
    };
    // Slice 5 hue step: merge cover tint fields into the same update below.
    try {
      await prisma.game.update({ where: { id: game.id }, data: timesFields });
      enrichments.set(game.id, timesFields);
    } catch (error) {
      logger.warn({ error, gameId: game.id }, "Enrichment write failed");
    }
  }
}

export async function ensureGamesEnrichment(
  games: EnrichableGame[]
): Promise<Map<string, GameEnrichment>> {
  const enrichments = new Map<string, GameEnrichment>();
  const now = Date.now();
  const needingTimes = games.filter((game) => needsTimes(game, now));
  for (const batch of chunk(needingTimes, TIMES_BATCH_SIZE)) {
    await refreshTimes(batch, enrichments);
  }
  return enrichments;
}

export async function ensureGameEnrichment(
  game: EnrichableGame
): Promise<GameEnrichment> {
  const enrichments = await ensureGamesEnrichment([game]);
  return enrichments.get(game.id) ?? game;
}
