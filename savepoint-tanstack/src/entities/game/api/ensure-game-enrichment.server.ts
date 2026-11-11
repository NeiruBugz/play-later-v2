import jpeg from "jpeg-js";

import { createLogger } from "@/shared/lib";
import { extractCoverTint } from "@/shared/lib/cover-tint";
import { prisma } from "@/shared/lib/db.server";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";

import type { Game } from "../../../../shared/lib/prisma/client.ts";
import { getTimesToBeatForGames } from "./get-times-to-beat.server";

const logger = createLogger({ service: "ensure-game-enrichment" });

const TIMES_REFRESH_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
const TIMES_BATCH_SIZE = 10;
const COVER_TINT_CONCURRENCY = 4;

export type EnrichableGame = Pick<
  Game,
  | "id"
  | "igdbId"
  | "timeToCreditsSeconds"
  | "timeToCompleteSeconds"
  | "timesToBeatFetchedAt"
  | "coverImage"
  | "coverHue"
  | "coverChroma"
  | "coverTintComputedAt"
>;

export type GameEnrichment = Pick<
  Game,
  | "timeToCreditsSeconds"
  | "timeToCompleteSeconds"
  | "timesToBeatFetchedAt"
  | "coverHue"
  | "coverChroma"
  | "coverTintComputedAt"
>;

type TimesFields = Pick<
  GameEnrichment,
  "timeToCreditsSeconds" | "timeToCompleteSeconds" | "timesToBeatFetchedAt"
>;
type TintFields = Pick<
  GameEnrichment,
  "coverHue" | "coverChroma" | "coverTintComputedAt"
>;

function needsTimes(game: EnrichableGame, now: number): boolean {
  return (
    game.timesToBeatFetchedAt === null ||
    now - game.timesToBeatFetchedAt.getTime() > TIMES_REFRESH_AFTER_MS
  );
}

function needsTint(game: EnrichableGame): boolean {
  return game.coverImage !== null && game.coverTintComputedAt === null;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size));
  }
  return chunks;
}

async function fetchTimes(
  batch: EnrichableGame[]
): Promise<Map<string, TimesFields>> {
  const timesByGameId = new Map<string, TimesFields>();
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
    return timesByGameId;
  }

  for (const game of batch) {
    const times = timesByIgdbId.get(game.igdbId);
    timesByGameId.set(game.id, {
      timeToCreditsSeconds: times?.timeToCreditsSeconds ?? null,
      timeToCompleteSeconds: times?.timeToCompleteSeconds ?? null,
      timesToBeatFetchedAt: new Date(),
    });
  }
  return timesByGameId;
}

async function fetchTint(game: EnrichableGame): Promise<TintFields | null> {
  try {
    const response = await fetch(
      buildCoverImageUrl(game.coverImage, "t_thumb")!
    );
    if (!response.ok) {
      throw new Error(`Cover request failed with status ${response.status}`);
    }
    const { data } = jpeg.decode(new Uint8Array(await response.arrayBuffer()), {
      useTArray: true,
    });
    const tint = extractCoverTint(data);
    return {
      coverHue: tint?.hue ?? null,
      coverChroma: tint?.chroma ?? null,
      coverTintComputedAt: new Date(),
    };
  } catch (error) {
    logger.warn(
      { error, gameId: game.id },
      "Cover tint enrichment failed; will retry on a later view"
    );
    return null;
  }
}

async function fetchTints(
  games: EnrichableGame[]
): Promise<Map<string, TintFields>> {
  const tintsByGameId = new Map<string, TintFields>();
  for (const group of chunk(games, COVER_TINT_CONCURRENCY)) {
    const tints = await Promise.all(group.map(fetchTint));
    group.forEach((game, index) => {
      const tint = tints[index];
      if (tint) tintsByGameId.set(game.id, tint);
    });
  }
  return tintsByGameId;
}

export async function ensureGamesEnrichment(
  games: EnrichableGame[]
): Promise<Map<string, GameEnrichment>> {
  const enrichments = new Map<string, GameEnrichment>();
  const now = Date.now();

  const timesByGameId = new Map<string, TimesFields>();
  for (const batch of chunk(
    games.filter((game) => needsTimes(game, now)),
    TIMES_BATCH_SIZE
  )) {
    for (const [gameId, times] of await fetchTimes(batch)) {
      timesByGameId.set(gameId, times);
    }
  }
  const tintsByGameId = await fetchTints(games.filter(needsTint));

  for (const game of games) {
    const times = timesByGameId.get(game.id);
    const tint = tintsByGameId.get(game.id);
    if (!times && !tint) continue;
    const fields = { ...game, ...times, ...tint };
    try {
      await prisma.game.update({
        where: { id: game.id },
        data: { ...times, ...tint },
      });
      enrichments.set(game.id, {
        timeToCreditsSeconds: fields.timeToCreditsSeconds,
        timeToCompleteSeconds: fields.timeToCompleteSeconds,
        timesToBeatFetchedAt: fields.timesToBeatFetchedAt,
        coverHue: fields.coverHue,
        coverChroma: fields.coverChroma,
        coverTintComputedAt: fields.coverTintComputedAt,
      });
    } catch (error) {
      logger.warn({ error, gameId: game.id }, "Enrichment write failed");
    }
  }
  return enrichments;
}

export async function ensureGameEnrichment(
  game: EnrichableGame
): Promise<GameEnrichment> {
  const enrichments = await ensureGamesEnrichment([game]);
  return enrichments.get(game.id) ?? game;
}
