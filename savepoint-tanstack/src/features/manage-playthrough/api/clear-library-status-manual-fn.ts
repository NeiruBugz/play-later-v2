import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { clearLibraryStatusManual } from "@/entities/playthrough/api/clear-library-status-manual.server";
import { requireUserId } from "@/entities/session/api/require-user-id";

import type { LibraryItem } from "../../../../shared/lib/prisma/client.ts";

export const CLEAR_LIBRARY_STATUS_MANUAL_INPUT = z.object({
  libraryItemId: z.number().int(),
});

export const clearLibraryStatusManualFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    CLEAR_LIBRARY_STATUS_MANUAL_INPUT.parse(data)
  )
  .handler(async ({ data }): Promise<LibraryItem> => {
    const userId = await requireUserId();
    const parsed = CLEAR_LIBRARY_STATUS_MANUAL_INPUT.parse(data);
    return clearLibraryStatusManual(userId, parsed.libraryItemId);
  });
