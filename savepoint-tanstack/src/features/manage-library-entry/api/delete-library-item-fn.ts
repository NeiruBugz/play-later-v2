import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { deleteLibraryItem } from "@/entities/library-item/api";
import { requireUserId } from "@/entities/session/api/require-user-id";

/**
 * Zod schema for the `deleteLibraryItemFn` payload.
 *
 * `itemId` is a Prisma autoincrement `Int`, NOT a string.
 */
const DELETE_LIBRARY_ITEM_INPUT = z.object({
  itemId: z.number().int().positive(),
});

export const deleteLibraryItemFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => DELETE_LIBRARY_ITEM_INPUT.parse(data))
  .handler(async ({ data }): Promise<void> => {
    // Auth gate first: unauthenticated callers get `UnauthorizedError`
    // before any Zod parsing (matches `addGameToLibraryFn` / `connectSteamFn`).
    const userId = await requireUserId();

    // Re-parse server-side: inputValidator runs only on cross-network calls;
    // programmatic callers (other server fns, tests) bypass it.
    const { itemId } = DELETE_LIBRARY_ITEM_INPUT.parse(data);

    await deleteLibraryItem(userId, itemId);
  });
