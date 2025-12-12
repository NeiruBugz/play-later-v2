import { z } from "zod";

const CoverSchema = z.object({
  id: z.number().optional(),
  image_id: z.string(),
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

const GenreSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const ThemeSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const GameModeSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const CompanySchema = z.object({
  id: z.number(),
  name: z.string(),
});

const InvolvedCompanySchema = z.object({
  id: z.number(),
  company: CompanySchema,
  developer: z.boolean(),
  publisher: z.boolean(),
});

const ExternalGameSchema = z.object({
  id: z.number(),
  category: z.number().optional(),
  name: z.string().optional(),
  url: z.string().optional(),
});

const ScreenshotSchema = z.object({
  id: z.number(),
  image_id: z.string(),
});

const WebsiteSchema = z.object({
  id: z.number(),
  url: z.string(),
  category: z.number().optional(),
  trusted: z.boolean().optional(),
});

const FranchiseSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
});

const CollectionSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
});

const GameEngineSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
});

const PlayerPerspectiveSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
});

const SimilarGameSchema = z.object({
  id: z.number(),
  name: z.string(),
  cover: CoverSchema.optional(),
  release_dates: z.array(ReleaseDateSchema).optional(),
  first_release_date: z.number().optional(),
});

export const SearchResponseItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  cover: CoverSchema,
  first_release_date: z.number().optional(),
  platforms: z.array(PlatformSchema).optional(),
  release_dates: z.array(ReleaseDateSchema).optional(),
  game_type: z.number(),
});

export const FullGameInfoResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  summary: z.string().optional(),
  aggregated_rating: z.number().optional(),
  first_release_date: z.number().optional(),
  cover: CoverSchema,
  genres: z.array(GenreSchema).optional(),
  platforms: z.array(PlatformSchema).optional(),
  release_dates: z.array(ReleaseDateSchema).optional(),
  screenshots: z.array(ScreenshotSchema).optional(),
  themes: z.array(ThemeSchema).optional(),
  game_modes: z.array(GameModeSchema).optional(),
  game_engines: z.array(GameEngineSchema).optional(),
  player_perspectives: z.array(PlayerPerspectiveSchema).optional(),
  involved_companies: z.array(InvolvedCompanySchema).optional(),
  external_games: z.array(ExternalGameSchema).optional(),
  websites: z.array(WebsiteSchema).optional(),
  similar_games: z.array(SimilarGameSchema).optional(),
  franchise: z.union([z.number(), FranchiseSchema]).optional(),
  franchises: z.array(z.number()).optional(),
  game_type: z.number(),
  collections: z.array(CollectionSchema).optional(),
});

export const PlatformItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  abbreviation: z.string().optional(),
});

export const ScreenshotItemSchema = z.object({
  id: z.number(),
  game: z.number(),
  image_id: z.string(),
  url: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const GameWithRatingSchema = z.object({
  id: z.number(),
  aggregated_rating: z.number().optional(),
  aggregated_rating_count: z.number().optional(),
});

export const GameWithSimilarSchema = z.object({
  id: z.number(),
  similar_games: z.array(z.number()).optional(),
});

export const GameWithGenresSchema = z.object({
  id: z.number(),
  genres: z.array(GenreSchema).optional(),
});

export const GameCompletionTimesItemSchema = z.object({
  id: z.number(),
  game_id: z.number().optional(),
  gameplay_main: z.number().optional(),
  gameplay_main_extra: z.number().optional(),
  gameplay_completionist: z.number().optional(),
  completeness: z.number().optional(),
  created_at: z.number().optional(),
});

export const ExpansionSchema = z.object({
  id: z.number(),
  name: z.string(),
  cover: CoverSchema.optional(),
  release_dates: z.array(ReleaseDateSchema).optional(),
});

export const GameWithExpansionsSchema = z.object({
  id: z.number(),
  expansions: z.array(ExpansionSchema).optional(),
});

export const FranchiseGameItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  cover: z.object({ image_id: z.string() }).optional(),
});

export const FranchiseItemSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const ArtworkItemSchema = z.object({
  id: z.number(),
  alpha_channel: z.boolean().optional(),
  animated: z.boolean().optional(),
  checksum: z.string(),
  game: z.number(),
  height: z.number().optional(),
  image_id: z.string(),
  url: z.string().optional(),
  width: z.number().optional(),
});

export const UpcomingReleaseItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  cover: z
    .object({ id: z.number().optional(), image_id: z.string() })
    .optional(),
  first_release_date: z.number(),
  release_dates: z.array(ReleaseDateSchema).optional(),
});

export const EventItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  checksum: z.string().optional(),
  created_at: z.number().optional(),
  description: z.string().optional(),
  end_time: z.number().optional(),
  event_logo: z.union([z.number(), z.object({ id: z.number() })]).optional(),
  event_networks: z.array(z.number()).optional(),
  games: z.array(z.number()).optional(),
  live_stream_url: z.string().optional(),
  slug: z.string().optional(),
  start_time: z.number(),
  time_zone: z.string().optional(),
  updated_at: z.number().optional(),
  videos: z.array(z.number()).optional(),
});

export const EventLogoItemSchema = z.object({
  id: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  image_id: z.string(),
});

export const TimesToBeatItemSchema = z.object({
  id: z.number(),
  normally: z.number().optional(),
  completely: z.number().optional(),
});

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

export const TopRatedGameItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  aggregated_rating: z.number().optional(),
  cover: z.object({ image_id: z.string() }).optional(),
});

export const GameBySteamAppIdItemSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const TwitchTokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
});
