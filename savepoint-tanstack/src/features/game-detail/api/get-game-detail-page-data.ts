import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import {
  getGameCollectionsByIgdbId,
  getGameDetails,
  getRelatedGames,
  getTimesToBeat,
  type GameDetails,
  type GetRelatedGamesResult,
  type TimesToBeat,
} from "@/entities/game/api";
import { getServerUserId } from "@/entities/session/api/get-session.server";
import { createLogger } from "@/shared/lib";

const logger = createLogger({ service: "get-game-detail-page-data" });

const inputSchema = z.object({
  slug: z.string().min(1),
});

const RELATED_GAMES_PAGE_SIZE = 6;

export type RelatedCollectionSection = {
  collectionId: number;
  collectionName: string;
  pageSize: number;
  firstPage: GetRelatedGamesResult;
};

export type DeferredRelatedGames = Promise<RelatedCollectionSection[]>;
export type DeferredTimesToBeat = Promise<TimesToBeat | null>;

export type GameDetailPageView = {
  data: GameDetails;
  viewerUserId: string | null;
  /** Bare promise — consume via `<Await promise={...}>` inside `<Suspense>`. */
  deferredRelatedGames: DeferredRelatedGames;
  /** Bare promise — consume via `<Await promise={...}>` inside `<Suspense>`. */
  deferredTimesToBeat: DeferredTimesToBeat;
};

async function loadRelatedGamesSections(
  igdbId: number
): Promise<RelatedCollectionSection[]> {
  const collections = await getGameCollectionsByIgdbId({ igdbId });
  if (collections.length === 0) return [];

  const settled = await Promise.allSettled(
    collections.map(async (collection) => {
      const firstPage = await getRelatedGames({
        collectionId: collection.id,
        page: 1,
        pageSize: RELATED_GAMES_PAGE_SIZE,
      });
      return {
        collectionId: collection.id,
        collectionName: collection.name,
        pageSize: RELATED_GAMES_PAGE_SIZE,
        firstPage,
      } satisfies RelatedCollectionSection;
    })
  );

  const sections: RelatedCollectionSection[] = [];
  let failedAll = true;
  for (const result of settled) {
    if (result.status === "fulfilled") {
      sections.push(result.value);
      failedAll = false;
    } else {
      failedAll = failedAll && true;
      logger.warn(
        { error: result.reason, igdbId },
        "Related-games per-collection fetch failed — skipping"
      );
    }
  }

  if (failedAll) {
    throw new Error("All related-games collection fetches failed");
  }

  return sections;
}

export const getGameDetailPageDataFn = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => inputSchema.parse(value))
  .handler(async ({ data }): Promise<GameDetailPageView> => {
    const { slug } = inputSchema.parse(data);
    const request = getRequest();
    const userId = await getServerUserId(request);
    const details = await getGameDetails({ slug, userId });

    const deferredRelatedGames: DeferredRelatedGames = loadRelatedGamesSections(
      details.game.igdbId
    );

    const deferredTimesToBeat: DeferredTimesToBeat = getTimesToBeat({
      igdbId: details.game.igdbId,
    });

    return {
      data: details,
      viewerUserId: userId ?? null,
      deferredRelatedGames,
      deferredTimesToBeat,
    };
  });
