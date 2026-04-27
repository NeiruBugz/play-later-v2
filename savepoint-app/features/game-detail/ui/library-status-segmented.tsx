"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { updateLibraryStatusAction } from "@/features/manage-library-entry/server-actions";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/shared/components/ui/segmented-control";
import { LIBRARY_STATUS_CONFIG } from "@/shared/lib/library-status";
import type { LibraryItemStatus } from "@/shared/types";

export interface LibraryStatusSegmentedProps {
  currentStatus: LibraryItemStatus | undefined;
  igdbId: number;
}

export function LibraryStatusSegmented({
  currentStatus,
  igdbId,
}: LibraryStatusSegmentedProps) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);
  const [, startTransition] = useTransition();

  const handleChange = (next: string) => {
    const nextStatus = next as LibraryItemStatus;
    const previous = optimisticStatus;

    startTransition(async () => {
      setOptimisticStatus(nextStatus);

      try {
        const result = await updateLibraryStatusAction({
          igdbId,
          status: nextStatus,
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

  return (
    <SegmentedControl
      value={optimisticStatus ?? ""}
      onValueChange={handleChange}
      ariaLabel="Library status"
      scrollable
    >
      {LIBRARY_STATUS_CONFIG.map((config) => (
        <SegmentedControlItem
          key={config.value}
          value={config.value}
          icon={<config.icon className="h-3.5 w-3.5" />}
          aria-label={config.ariaLabel}
        >
          {config.label}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}
