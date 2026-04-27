"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { updateLibraryStatusAction } from "@/features/manage-library-entry/server-actions";
import type { LibraryItemStatus } from "@/shared/types";

export interface UseOptimisticLibraryStatusResult {
  optimisticStatus: LibraryItemStatus | undefined;
  setStatus: (next: LibraryItemStatus) => void;
}

export function useOptimisticLibraryStatus(
  igdbId: number,
  currentStatus: LibraryItemStatus | undefined
): UseOptimisticLibraryStatusResult {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);
  const [, startTransition] = useTransition();

  const setStatus = (next: LibraryItemStatus) => {
    const previous = optimisticStatus;

    startTransition(async () => {
      setOptimisticStatus(next);

      try {
        const result = await updateLibraryStatusAction({
          igdbId,
          status: next,
        });

        if (!result || !result.success) {
          setOptimisticStatus(previous);
          toast.error("Failed to update library status");
        }
      } catch {
        setOptimisticStatus(previous);
        toast.error("Failed to update library status");
      }
    });
  };

  return { optimisticStatus, setStatus };
}
