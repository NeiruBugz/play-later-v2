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

export const CollectionRefSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type CollectionRef = z.infer<typeof CollectionRefSchema>;

export const GameCollectionsResponseItemSchema = z.object({
  id: z.number(),
  collections: z.array(CollectionRefSchema).optional(),
});

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
