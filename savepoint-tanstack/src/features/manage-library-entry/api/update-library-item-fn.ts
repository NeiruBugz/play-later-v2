import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { updateLibraryItem } from "@/entities/library-item/api";
import { requireUserId } from "@/entities/session/api/require-user-id";

import type { LibraryItem } from "../../../../shared/lib/prisma/client.ts";

/**
 * Zod schema for the `updateLibraryItemFn` payload.
 *
 * - `itemId` is a Prisma autoincrement `Int`, NOT a string.
 * - Status enum literals must mirror the Prisma `LibraryItemStatus` enum.
 *   Hardcoded here (rather than imported) so the Prisma client doesn't get
 *   dragged into the client bundle — same precedent as
 *   `add-game-to-library-fn.ts`.
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
  status: z
    .enum(["WISHLIST", "SHELF", "UP_NEXT", "PLAYING", "PLAYED"])
    .optional(),
  rating: z.number().int().min(1).max(10).nullable().optional(),
  platform: z.string().min(1).nullable().optional(),
  startedAt: z.coerce.date().nullable().optional(),
  completedAt: z.coerce.date().nullable().optional(),
});

export const updateLibraryItemFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => UPDATE_LIBRARY_ITEM_INPUT.parse(data))
  .handler(async ({ data }): Promise<LibraryItem> => {
    // Auth gate first: unauthenticated callers get `UnauthorizedError`
    // before any Zod parsing (matches `addGameToLibraryFn` / `connectSteamFn`).
    const userId = await requireUserId();

    // Re-parse server-side: inputValidator runs only on cross-network calls;
    // programmatic callers (other server fns, tests) bypass it. See
    // CLAUDE.md "Validate twice".
    const parsed = UPDATE_LIBRARY_ITEM_INPUT.parse(data);
    const { itemId, ...input } = parsed;

    return updateLibraryItem(userId, itemId, input);
  });
