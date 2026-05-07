/**
 * IGDB response schemas for the search worker. Mirrors the canonical
 * `savepoint-app/data-access-layer/services/igdb/schemas/output.ts`
 * SearchResponseItemSchema, but with `cover` and its `image_id` made nullable /
 * optional. The canonical schema requires `image_id`; in tanstack we tolerate
 * missing/null covers because the upstream filter (`cover.image_id != null`)
 * is best-effort and downstream consumers already guard for missing covers.
 */
import { z } from "zod";

const CoverSchema = z.object({
  id: z.number().optional(),
  image_id: z.string().optional(),
  url: z.string().optional(),
});

const PlatformSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string().optional(),
  abbreviation: z.string().optional(),
  alternative_name: z.string().optional(),
  generation: z.number().optional(),
  platform_family: z.number().optional(),
  platform_type: z.number().optional(),
});

const PlatformWithReleaseDateSchema = z.object({
  id: z.number(),
  name: z.string(),
  human: z.string().optional(),
});

const ReleaseDateSchema = z.object({
  id: z.number(),
  human: z.string().optional(),
  platform: PlatformWithReleaseDateSchema.optional(),
});

const GameTypeSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
});

/**
 * Collection-ref shape (`{ id, name }`) used by the deferred phase-2
 * related-games fetch (`getGameCollectionsByIgdbId`). NO LONGER part of
 * `SearchResponseItemSchema` — the body GAME_FIELDS list dropped
 * `collections.*` so that cache-hit and cache-miss reads of `getGameDetails`
 * behave symmetrically.
 */
export const CollectionRefSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type CollectionRef = z.infer<typeof CollectionRefSchema>;

/**
 * Schema for an item returned by IGDB `POST /games` when only collection
 * refs are requested. Mirrors `getGameCollectionsByIgdbId`'s expected shape.
 */
export const GameCollectionsResponseItemSchema = z.object({
  id: z.number(),
  collections: z.array(CollectionRefSchema).optional(),
});

/**
 * Schema for an item returned by IGDB `POST /game_time_to_beats`. Mirrors
 * the canonical `TimesToBeatItemSchema` — both `normally` and `completely`
 * are optional (IGDB can return either or neither). Values are seconds.
 */
export const TimesToBeatItemSchema = z.object({
  id: z.number().optional(),
  normally: z.number().optional(),
  completely: z.number().optional(),
});

export const SearchResponseItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  cover: CoverSchema.nullable().optional(),
  first_release_date: z.number().nullable().optional(),
  platforms: z.array(PlatformSchema).optional(),
  release_dates: z.array(ReleaseDateSchema).optional(),
  game_type: z.union([z.number(), GameTypeSchema]).optional(),
});

export type SearchResponseItem = z.infer<typeof SearchResponseItemSchema>;

/**
 * IGDB `/collections` response item shape. Mirrors the canonical
 * `CollectionWithGamesSchema` in
 * `savepoint-app/data-access-layer/services/igdb/schemas/output.ts`.
 *
 * `cover.image_id` and `game_type` are optional — IGDB returns games without
 * covers or with no explicit type. The worker treats `game_type === undefined`
 * as MAIN_GAME (allowed).
 */
export const CollectionGameItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  cover: z.object({ image_id: z.string() }).optional(),
  game_type: z.number().optional(),
});

export const CollectionWithGamesSchema = z.object({
  id: z.number(),
  name: z.string(),
  games: z.array(CollectionGameItemSchema),
});

export type CollectionGameItem = z.infer<typeof CollectionGameItemSchema>;
export type CollectionWithGames = z.infer<typeof CollectionWithGamesSchema>;
