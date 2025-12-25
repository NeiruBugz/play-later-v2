"use client";

import type { LibraryItemStatus } from "@/data-access-layer/domain/library";
import { MoreVertical } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/shared/components/ui/select";
import {
  getStatusLabel,
  LIBRARY_STATUS_CONFIG,
} from "@/shared/lib/library-status";

import { useUpdateLibraryStatus } from "../hooks/use-update-library-status";
import type { LibraryCardQuickActionsProps } from "./library-card-quick-actions.types";

export function LibraryCardQuickActions({
  libraryItemId,
  currentStatus,
}: LibraryCardQuickActionsProps) {
  const updateStatus = useUpdateLibraryStatus();
  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate({
      libraryItemId,
      status: newStatus as LibraryItemStatus,
    });
  };

  const availableStatuses = LIBRARY_STATUS_CONFIG.filter(
    (config) => config.value !== currentStatus
  );

  const currentStatusLabel = getStatusLabel(currentStatus);

  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 rounded-md shadow-lg backdrop-blur">
      <Select
        value={currentStatus}
        onValueChange={handleStatusChange}
        disabled={updateStatus.isPending}
      >
        <SelectTrigger
          className="hover:bg-muted/20 h-8 w-8 border-none bg-transparent p-0 shadow-none"
          aria-label={`Change status from ${currentStatusLabel}`}
        >
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </SelectTrigger>
        <SelectContent>
          {availableStatuses.map((config) => (
            <SelectItem
              key={config.value}
              value={config.value}
              aria-label={config.ariaLabel}
            >
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
