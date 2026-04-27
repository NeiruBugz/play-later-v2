"use client";

import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/shared/components/ui/segmented-control";
import { LIBRARY_STATUS_CONFIG } from "@/shared/lib/library-status";
import type { LibraryItemStatus } from "@/shared/types";

import { useOptimisticLibraryStatus } from "../hooks/use-optimistic-library-status";

export interface LibraryStatusSegmentedProps {
  currentStatus: LibraryItemStatus | undefined;
  igdbId: number;
}

export function LibraryStatusSegmented({
  currentStatus,
  igdbId,
}: LibraryStatusSegmentedProps) {
  const { optimisticStatus, setStatus } = useOptimisticLibraryStatus(
    igdbId,
    currentStatus
  );

  const handleChange = (next: string) => {
    setStatus(next as LibraryItemStatus);
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
