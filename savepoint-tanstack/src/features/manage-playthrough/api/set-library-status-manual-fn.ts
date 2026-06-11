import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { libraryItemStatusSchema } from "@/entities/library-item/model";
import { setLibraryStatusManual } from "@/entities/playthrough/api/set-library-status-manual.server";
import { requireUserId } from "@/entities/session/api/require-user-id";

import type { LibraryItem } from "../../../../shared/lib/prisma/client.ts";

export const SET_LIBRARY_STATUS_MANUAL_INPUT = z.object({
  libraryItemId: z.number().int(),
  status: libraryItemStatusSchema,
});

export const setLibraryStatusManualFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    SET_LIBRARY_STATUS_MANUAL_INPUT.parse(data)
  )
  .handler(async ({ data }): Promise<LibraryItem> => {
    const userId = await requireUserId();
    const parsed = SET_LIBRARY_STATUS_MANUAL_INPUT.parse(data);
    return setLibraryStatusManual(userId, parsed.libraryItemId, parsed.status);
  });
