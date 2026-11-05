import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  UNDO_STATUS_INPUT,
  undoStatusWorker,
  type UndoStatusResult,
} from "./undo-status-fn.worker";

export const undoStatusFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => UNDO_STATUS_INPUT.parse(data))
  .handler(async ({ data }): Promise<UndoStatusResult> => {
    const userId = await requireUserId();
    return undoStatusWorker(userId, data);
  });
