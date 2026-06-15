import { z } from "zod";

/**
 * Zod schema for the create/edit playthrough form.
 *
 * - `libraryItemId` matches the `LibraryItem.id` Prisma `Int` (autoincrement).
 * - `playtimeHours` is the UI unit — converted ×60 → `playtimeMinutes` in the
 *   worker before the entity query.
 * - `rating` is the 1–10 integer scale (shown as 0–5 half-stars in UI).
 * - `startedAt` / `finishedAt` use `z.coerce.date().nullish()` so the form
 *   can pass ISO strings or Date instances.
 * - The PLAYING ⇒ finishedAt-must-be-null rule is enforced via `.refine()` at
 *   the schema level so Zod carries it into `.inputValidator` and the worker
 *   re-parse without extra imperative checks.
 */
export const playthroughFormSchema = z
  .object({
    libraryItemId: z.number().int(),
    kind: z.enum(["FIRST", "REPLAY"]).optional(),
    platform: z.string().nullish(),
    status: z.enum(["PLAYING", "FINISHED", "ABANDONED"]),
    startedAt: z.coerce.date().nullish(),
    finishedAt: z.coerce.date().nullish(),
    playtimeHours: z.number().min(0),
    rating: z.number().int().min(1).max(10).nullish(),
    completion: z.string().nullish(),
    notes: z.string().nullish(),
  })
  .refine((data) => !(data.status === "PLAYING" && data.finishedAt != null), {
    message: "finishedAt must be null when status is PLAYING",
    path: ["finishedAt"],
  });

export type PlaythroughFormValues = z.infer<typeof playthroughFormSchema>;

/**
 * Schema for the update playthrough server fn — mirrors the form schema fields
 * but adds the run id and makes all form fields optional (partial patch).
 * Defined independently (not via `.extend()`) because Zod v4 forbids extending
 * schemas that carry `.refine()` checks.
 */
export const updatePlaythroughSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(["FIRST", "REPLAY"]).optional(),
    platform: z.string().nullish(),
    status: z.enum(["PLAYING", "FINISHED", "ABANDONED"]).optional(),
    startedAt: z.coerce.date().nullish(),
    finishedAt: z.coerce.date().nullish(),
    playtimeHours: z.number().min(0).optional(),
    rating: z.number().int().min(1).max(10).nullish(),
    completion: z.string().nullish(),
    notes: z.string().nullish(),
  })
  .refine((data) => !(data.status === "PLAYING" && data.finishedAt != null), {
    message: "finishedAt must be null when status is PLAYING",
    path: ["finishedAt"],
  });

export type UpdatePlaythroughValues = z.infer<typeof updatePlaythroughSchema>;
