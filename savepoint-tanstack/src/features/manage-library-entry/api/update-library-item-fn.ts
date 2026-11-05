import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { updateLibraryItem } from "@/entities/library-item/api/update-library-item.server";
import { requireUserId } from "@/entities/session/api/require-user-id";

import type { LibraryItem } from "../../../../shared/lib/prisma/client.ts";

/**
 * Zod schema for the `updateLibraryItemFn` payload. Status moves go through
 * `setStatusFn`; this fn only edits rating and platform.
 *
 * - `itemId` is a Prisma autoincrement `Int`, NOT a string.
 * - Explicit `null` clears the column at the entity layer; `undefined` leaves
 *   it untouched.
 */
export const UPDATE_LIBRARY_ITEM_INPUT = z.object({
  itemId: z.number().int().positive(),
  rating: z.number().int().min(1).max(10).nullable().optional(),
  platform: z.string().min(1).max(64).nullable().optional(),
});

export const updateLibraryItemFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => UPDATE_LIBRARY_ITEM_INPUT.parse(data))
  .handler(async ({ data }): Promise<LibraryItem> => {
    const userId = await requireUserId();
    const parsed = UPDATE_LIBRARY_ITEM_INPUT.parse(data);
    const { itemId, ...input } = parsed;

    return updateLibraryItem(userId, itemId, input);
  });
