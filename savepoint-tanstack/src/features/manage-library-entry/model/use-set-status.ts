import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";
import {
  changeStatusWithUndo,
  type DisplayedStatus,
} from "./change-status-with-undo";

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
  const [override, setOverride] = useState<DisplayedStatus | null>(null);
  const [isPending, setIsPending] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    setOverride(null);
  }, [status, upNextPosition]);

  const displayed: DisplayedStatus = override ?? { status, upNextPosition };

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

  const setStatus = (to: LibraryItemStatus) =>
    runSerialized(async () => {
      if (to === displayed.status) return false;
      return changeStatusWithUndo({
        id,
        gameTitle,
        to,
        previous: displayed,
        onPending: setOverride,
        onDisplay: setOverride,
        runUndo: runSerialized,
      });
    });

  return {
    status: displayed.status,
    upNextPosition: displayed.upNextPosition,
    setStatus,
    isPending,
  };
}
