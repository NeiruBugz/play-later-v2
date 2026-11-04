import { z } from "zod";

import { restoreLibraryItem } from "@/entities/library-item/api/restore-library-item.server";
import type { SetLibraryItemStatusUndo } from "@/entities/library-item/api/set-library-item-status.server";
import { UnauthorizedError } from "@/shared/lib/errors";

import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";

export const UNDO_STATUS_INPUT = z.object({
  id: z.number().int().positive(),
  undo: z.unknown(),
});

export type UndoStatusResult = {
  status: LibraryItemStatus;
  upNextPosition: number | null;
  queueRestored: boolean;
};

export async function undoStatusWorker(
  userId: string | undefined,
  data: unknown
): Promise<UndoStatusResult> {
  if (!userId) throw new UnauthorizedError("Sign in required");

  const { id, undo } = UNDO_STATUS_INPUT.parse(data);
  const { item, queueRestored } = await restoreLibraryItem(
    userId,
    id,
    undo as SetLibraryItemStatusUndo
  );

  return {
    status: item.status,
    upNextPosition: item.upNextPosition,
    queueRestored,
  };
}
