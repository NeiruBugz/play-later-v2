import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { addGameToLibrary } from "@/entities/library-item/api/add-game-to-library.server";
import { requireUserId } from "@/entities/session/api/require-user-id";

/**
 * Quick-add a searched IGDB game straight to the user's "Up Next" queue from
 * the command palette — mirrors canonical's `quickAddToLibraryAction`
 * (`useQuickAddFromPalette`). The status is fixed to `UP_NEXT`; the palette
 * never offers a status picker for this affordance.
 *
 * Returns the created (or pre-existing) library item id so the caller can
 * offer an undo that removes it.
 */
const QUICK_ADD_INPUT = z.object({
  igdbId: z.number().int().positive(),
});

export const quickAddToLibraryFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => QUICK_ADD_INPUT.parse(data))
  .handler(async ({ data }): Promise<{ id: number }> => {
    const { igdbId } = QUICK_ADD_INPUT.parse(data);

    const userId = await requireUserId();

    const item = await addGameToLibrary(userId, {
      igdbId,
      status: "UP_NEXT",
    });

    return { id: item.id };
  });
