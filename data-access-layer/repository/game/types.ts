import { z } from "zod";

export const GameSchema = z.object({
  igdbId: z.union([
    z.string().min(1),
    z.number().transform((val) => String(val)),
  ]),
  title: z.string().min(1),
  coverImage: z.string().nullable().optional(),
  hltbId: z.string().nullable().optional(),
  mainExtra: z
    .union([
      z.number(),
      z.string().transform((val) => (val ? Number(val) : null)),
    ])
    .nullable()
    .optional(),
  mainStory: z
    .union([
      z.number(),
      z.string().transform((val) => (val ? Number(val) : null)),
    ])
    .nullable()
    .optional(),
  completionist: z
    .union([
      z.number(),
      z.string().transform((val) => (val ? Number(val) : null)),
    ])
    .nullable()
    .optional(),
  releaseDate: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const CreateGameSchema = z.object({
  game: GameSchema,
});

export type CreateGameInput = z.infer<typeof CreateGameSchema>;
export type GameInput = z.infer<typeof GameSchema>;
