import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { deleteLibraryItem } from "@/entities/library-item/api/delete-library-item.server";
import { requireUserId } from "@/entities/session/api/require-user-id";

/**
 * Removes a library item — the undo side of the palette quick-add flow
 * (mirrors canonical's `deleteLibraryItemAction` call inside
 * `useQuickAddFromPalette`'s undo handler). Lives in the command-palette
 * feature so the palette never imports another feature's server fn.
 *
 * `itemId` is a Prisma autoincrement `Int`, not a string.
 */
const REMOVE_LIBRARY_ITEM_INPUT = z.object({
  itemId: z.number().int().positive(),
});

export const removeLibraryItemFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => REMOVE_LIBRARY_ITEM_INPUT.parse(data))
  .handler(async ({ data }): Promise<void> => {
    const { itemId } = REMOVE_LIBRARY_ITEM_INPUT.parse(data);

    const userId = await requireUserId();

    await deleteLibraryItem(userId, itemId);
  });
