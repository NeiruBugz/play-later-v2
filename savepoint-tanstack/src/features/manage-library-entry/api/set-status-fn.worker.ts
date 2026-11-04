import { z } from "zod";

import {
  setLibraryItemStatus,
  type SetLibraryItemStatusUndo,
} from "@/entities/library-item/api/set-library-item-status.server";
import { libraryItemStatusSchema } from "@/entities/library-item/model";
import { UnauthorizedError } from "@/shared/lib/errors";

import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";

export const SET_STATUS_INPUT = z.object({
  id: z.number().int().positive(),
  to: libraryItemStatusSchema,
});

export type SetStatusResult = {
  status: LibraryItemStatus;
  upNextPosition: number | null;
  undo: SetLibraryItemStatusUndo;
};

export async function setStatusWorker(
  userId: string | undefined,
  data: unknown
): Promise<SetStatusResult> {
  if (!userId) throw new UnauthorizedError("Sign in required");

  const { id, to } = SET_STATUS_INPUT.parse(data);
  const { item, undo } = await setLibraryItemStatus(userId, id, to);

  return { status: item.status, upNextPosition: item.upNextPosition, undo };
}
