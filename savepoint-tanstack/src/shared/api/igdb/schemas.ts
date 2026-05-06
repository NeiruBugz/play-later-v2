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

export const SearchResponseItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  cover: CoverSchema.nullable().optional(),
  first_release_date: z.number().optional(),
  platforms: z.array(PlatformSchema).optional(),
  release_dates: z.array(ReleaseDateSchema).optional(),
  game_type: z.union([z.number(), GameTypeSchema]).optional(),
});

export type SearchResponseItem = z.infer<typeof SearchResponseItemSchema>;
