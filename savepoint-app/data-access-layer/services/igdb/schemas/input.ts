import { z } from "zod";

const positiveInt = (fieldName: string) =>
  z
    .number({
      error: `Valid ${fieldName} is required`,
    })
    .int({ error: `Valid ${fieldName} is required` })
    .positive({ error: `Valid ${fieldName} is required` });

const nonNegativeInt = z.number().int().nonnegative();

const nonEmptyString = (fieldName: string) =>
  z
    .string({
      error: `${fieldName} is required`,
    })
    .min(1, { error: `${fieldName} is required` });

export const GameSearchSchema = z.object({
  name: z
    .string({
      error: "Game name is required for search",
    })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, {
      message: "Game name is required for search",
    }),
  offset: nonNegativeInt.optional(),
  fields: z
    .object({
      platform: z.string().optional(),
      platforms: z.string().optional(),
    })
    .optional(),
});

export const GameDetailsSchema = z.object({
  gameId: positiveInt("game ID"),
});

export const GameDetailsBySlugSchema = z.object({
  slug: nonEmptyString("Game slug"),
});

export const GetGameBySteamAppIdSchema = z.object({
  steamAppId: positiveInt("Steam app ID"),
});

export const PlatformSearchSchema = z.object({
  platformName: z
    .string({
      error: "Platform name is required for search",
    })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, {
      message: "Platform name is required for search",
    }),
});

export const GameScreenshotsSchema = z.object({
  gameId: positiveInt("game ID"),
});

export const GameAggregatedRatingSchema = z.object({
  gameId: positiveInt("game ID"),
});

export const SimilarGamesSchema = z.object({
  gameId: positiveInt("game ID"),
});

export const GameGenresSchema = z.object({
  gameId: positiveInt("game ID"),
});

export const GetGameCompletionTimesSchema = z.object({
  gameId: positiveInt("game ID"),
});

export const GameExpansionsSchema = z.object({
  gameId: positiveInt("game ID"),
});

export const FranchiseGamesSchema = z.object({
  franchiseId: positiveInt("franchise ID"),
  currentGameId: positiveInt("current game ID"),
  limit: z.number().int().positive().optional(),
  offset: nonNegativeInt.optional(),
});

export const FranchiseDetailsSchema = z.object({
  franchiseId: positiveInt("franchise ID"),
});

export const GameArtworksSchema = z.object({
  gameId: positiveInt("game ID"),
});

export const UpcomingReleasesByIdsSchema = z.object({
  ids: z
    .array(
      z
        .number({
          error: "All game IDs must be valid positive integers",
        })
        .int({ error: "All game IDs must be valid positive integers" })
        .positive({ error: "All game IDs must be valid positive integers" }),
      {
        error: "At least one game ID is required",
      }
    )
    .min(1, { error: "At least one game ID is required" }),
});

export const EventLogoSchema = z.object({
  logoId: positiveInt("event logo ID"),
});

export const TimesToBeatSchema = z.object({
  igdbId: positiveInt("game ID"),
});

export const CollectionGamesByIdSchema = z.object({
  collectionId: positiveInt("collection ID"),
});
