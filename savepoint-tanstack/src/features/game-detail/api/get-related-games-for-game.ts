import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getGameCollectionsByIgdbId } from "@/entities/game/api/get-game-collections.server";
import {
  getRelatedGames,
  type GetRelatedGamesResult,
} from "@/entities/game/api/get-related-games.server";
import { createLogger } from "@/shared/lib";

const logger = createLogger({ service: "get-related-games-for-game" });

const inputSchema = z.object({
  igdbId: z.number().int().positive(),
});

const RELATED_GAMES_PAGE_SIZE = 6;

export type RelatedCollectionSection = {
  collectionId: number;
  collectionName: string;
  pageSize: number;
  firstPage: GetRelatedGamesResult;
};

export const getRelatedGamesForGameFn = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => inputSchema.parse(value))
  .handler(async ({ data }): Promise<RelatedCollectionSection[]> => {
    const { igdbId } = inputSchema.parse(data);

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
  });
