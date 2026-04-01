import { z } from "zod";

const positiveInt = (fieldName: string) =>
  z
    .number({
      error: `Valid ${fieldName} is required`,
    })
    .int({ error: `Valid ${fieldName} is required` })
    .positive({ error: `Valid ${fieldName} is required` });

const nonNegativeInt = z.number().int().nonnegative();

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
  slug: z
    .string({
      error: "Game slug is required",
    })
    .min(1, { error: "Game slug is required" }),
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

export const TimesToBeatSchema = z.object({
  igdbId: positiveInt("game ID"),
});

export const CollectionGamesByIdSchema = z.object({
  collectionId: positiveInt("collection ID"),
});
