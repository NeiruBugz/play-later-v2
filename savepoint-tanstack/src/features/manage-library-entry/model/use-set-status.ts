import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { getStatusLabel } from "@/entities/library-item/model";
import { getUserFacingErrorMessage } from "@/shared/lib/user-facing-error";
import { showUndoToast } from "@/shared/ui/undo-toast";

import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";
import { setStatusFn } from "../api/set-status-fn";
import type { SetStatusResult } from "../api/set-status-fn.worker";
import { undoStatusFn } from "../api/undo-status-fn";

export type UseSetStatusArgs = {
  id: number;
  gameTitle: string;
  status: LibraryItemStatus;
  upNextPosition: number | null;
};

export type UseSetStatusResult = {
  status: LibraryItemStatus;
  upNextPosition: number | null;
  setStatus: (to: LibraryItemStatus) => Promise<void>;
  isPending: boolean;
};

type Displayed = {
  status: LibraryItemStatus;
  upNextPosition: number | null;
};

/**
 * Optimistic status change with a 5 s Undo toast. Changes for one game are
 * serialized: taps while a change (or undo) is in flight are ignored.
 */
export function useSetStatus({
  id,
  gameTitle,
  status,
  upNextPosition,
}: UseSetStatusArgs): UseSetStatusResult {
  const router = useRouter();
  const [override, setOverride] = useState<Displayed | null>(null);
  const [isPending, setIsPending] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    setOverride(null);
  }, [status, upNextPosition]);

  const displayed: Displayed = override ?? { status, upNextPosition };

  const runSerialized = async (task: () => Promise<boolean>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsPending(true);
    let serverChanged = false;
    try {
      serverChanged = await task();
    } finally {
      inFlight.current = false;
      setIsPending(false);
    }
    if (serverChanged) await router.invalidate();
  };

  const undo = (
    previous: Displayed,
    current: Displayed,
    undoPayload: SetStatusResult["undo"]
  ) =>
    runSerialized(async () => {
      setOverride(previous);
      try {
        const restored = await undoStatusFn({
          data: { id, undo: undoPayload },
        });
        setOverride({
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
        setOverride(current);
        toast.error(getUserFacingErrorMessage(error));
        return false;
      }
    });

  const setStatus = (to: LibraryItemStatus) =>
    runSerialized(async () => {
      const previous = displayed;
      if (to === previous.status) return false;
      setOverride({ status: to, upNextPosition: previous.upNextPosition });
      try {
        const result = await setStatusFn({ data: { id, to } });
        const current = {
          status: result.status,
          upNextPosition: result.upNextPosition,
        };
        setOverride(current);
        showUndoToast({
          message: `${gameTitle} is now ${getStatusLabel(result.status)}`,
          onUndo: () => {
            void undo(previous, current, result.undo);
          },
        });
        return true;
      } catch (error) {
        setOverride(null);
        toast.error(getUserFacingErrorMessage(error));
        return false;
      }
    });

  return {
    status: displayed.status,
    upNextPosition: displayed.upNextPosition,
    setStatus,
    isPending,
  };
}
