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

/**
 * Loader-only server fn for `/games/$slug`.
 *
 * Phase 1 (awaited): `getGameDetails` (DB-only Game row + viewer-scoped
 * LibraryItem + journal teaser) plus the resolved `viewerUserId`.
 *
 * Phase 2 (NOT awaited — streamed via bare promises in the loader return value):
 *   - `deferredRelatedGames` — collection refs + page-1 of each collection's
 *     games. Multi-collection: returns ALL collections, not just the first.
 *   - `deferredTimesToBeat` — IGDB community times-to-beat (raw seconds).
 *
 * The loader does NOT await phase 2; the route component renders each section
 * inside a `<Suspense>` + `<Await>` per-section error boundary so that one
 * section's failure / latency doesn't block the other.
 *
 * `userId` is read from the request session — never from URL params.
 */

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

/**
 * Build the related-games section list. Returns ALL collections in stacked
 * order. Per-collection failures are tolerated via `Promise.allSettled` —
 * if some collections succeed and others fail, only the successes surface.
 *
 * Throws (so the section's `<Await>` error boundary fires) when:
 *   - the collections fetch itself throws (e.g. UpstreamError on transport),
 *   - OR every collection's page-1 fetch fails.
 *
 * Returns `[]` (so the UI omits the section) when:
 *   - the game has no collections in IGDB.
 */
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

  // If every collection failed AND there were collections to try, surface
  // failure to the UI's error boundary; otherwise return what we have
  // (possibly an empty list — but only when collections.length === 0 was
  // already handled above; here we always had at least one settled entry).
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

    // Phase 2 — kick off both promises WITHOUT awaiting. They will be
    // serialized to the client by TanStack Start's deferred-promise plumbing
    // and resumed under <Await/> + <Suspense/> in the route component.
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
