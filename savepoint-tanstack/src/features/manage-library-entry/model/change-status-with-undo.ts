import { toast } from "sonner";

import { getStatusLabel } from "@/entities/library-item/model";
import { getUserFacingErrorMessage } from "@/shared/lib/user-facing-error";
import { showUndoToast } from "@/shared/ui/undo-toast";

import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";
import { setStatusFn } from "../api/set-status-fn";
import type { SetStatusResult } from "../api/set-status-fn.worker";
import { undoStatusFn } from "../api/undo-status-fn";

export type DisplayedStatus = {
  status: LibraryItemStatus;
  upNextPosition: number | null;
};

export type ChangeStatusWithUndoArgs = {
  id: number;
  gameTitle: string;
  to: LibraryItemStatus;
  previous: DisplayedStatus;
  onDisplay: (displayed: DisplayedStatus) => void;
  onPending?: (displayed: DisplayedStatus) => void;
  runUndo: (task: () => Promise<boolean>) => Promise<void>;
};

/**
 * Changes a status and offers a 5 s Undo. Resolves true when the server
 * changed, so the caller refreshes page data only after success. `runUndo`
 * wraps the undo task (true = server changed) so the caller can serialize it
 * and refresh afterwards.
 */
export async function changeStatusWithUndo({
  id,
  gameTitle,
  to,
  previous,
  onDisplay,
  onPending,
  runUndo,
}: ChangeStatusWithUndoArgs): Promise<boolean> {
  const undo = (
    current: DisplayedStatus,
    undoPayload: SetStatusResult["undo"]
  ) =>
    runUndo(async () => {
      onPending?.(previous);
      try {
        const restored = await undoStatusFn({
          data: { id, undo: undoPayload },
        });
        onDisplay({
          status: restored.status,
          upNextPosition: restored.upNextPosition,
        });
        if (!restored.queueRestored) {
          toast(
            `Up Next is full, so ${gameTitle} wasn't put back in the queue.`
          );
        }
        return true;
      } catch (error) {
        onDisplay(current);
        toast.error(getUserFacingErrorMessage(error));
        return false;
      }
    });

  onPending?.({ status: to, upNextPosition: previous.upNextPosition });
  try {
    const result = await setStatusFn({ data: { id, to } });
    const current = {
      status: result.status,
      upNextPosition: result.upNextPosition,
    };
    onDisplay(current);
    showUndoToast({
      message: `${gameTitle} is now ${getStatusLabel(result.status)}`,
      onUndo: () => {
        void undo(current, result.undo);
      },
    });
    return true;
  } catch (error) {
    onDisplay(previous);
    toast.error(getUserFacingErrorMessage(error));
    return false;
  }
}
