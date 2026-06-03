import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { updateLibraryItem } from "@/entities/library-item/api/update-library-item.server";
import { libraryItemStatusSchema } from "@/entities/library-item/model";
import { requireUserId } from "@/entities/session/api/require-user-id";

import type { LibraryItem } from "../../../../shared/lib/prisma/client.ts";

/**
 * Zod schema for the `updateLibraryItemFn` payload.
 *
 * - `itemId` is a Prisma autoincrement `Int`, NOT a string.
 * - `status` reuses `libraryItemStatusSchema` from the library-item entity
 *   model — the single canonical source for the status taxonomy.
 * - `rating`, `platform`, `startedAt`, `completedAt` are nullable: explicit
 *   `null` clears the column at the entity layer; `undefined` leaves it
 *   untouched.
 * - `z.coerce.date()` accepts ISO strings or `Date` instances so the form
 *   can serialise either shape.
 * - 1–10 rating bound is enforced here at the feature/Zod layer, not in the
 *   entity layer (per RED contract).
 */
const UPDATE_LIBRARY_ITEM_INPUT = z.object({
  itemId: z.number().int().positive(),
  status: libraryItemStatusSchema.optional(),
  rating: z.number().int().min(1).max(10).nullable().optional(),
  platform: z.string().min(1).nullable().optional(),
  startedAt: z.coerce.date().nullable().optional(),
  completedAt: z.coerce.date().nullable().optional(),
});

export const updateLibraryItemFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => UPDATE_LIBRARY_ITEM_INPUT.parse(data))
  .handler(async ({ data }): Promise<LibraryItem> => {
    const userId = await requireUserId();
    const parsed = UPDATE_LIBRARY_ITEM_INPUT.parse(data);
    const { itemId, ...input } = parsed;

    return updateLibraryItem(userId, itemId, input);
  });
