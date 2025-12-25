"use client";

import { useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  getStatusConfig,
  LIBRARY_STATUS_CONFIG,
} from "@/shared/lib/library-status";
import { LibraryItemStatus } from "@/shared/types";

import { useUpdateLibraryStatus } from "../hooks/use-update-library-status";
import type { LibraryCardInteractiveBadgeProps } from "./library-card-interactive-badge.types";

export function LibraryCardInteractiveBadge({
  libraryItemId,
  currentStatus,
}: LibraryCardInteractiveBadgeProps) {
  const [open, setOpen] = useState(false);
  const updateStatus = useUpdateLibraryStatus();

  const currentConfig = getStatusConfig(currentStatus);

  const handleStatusChange = (newStatus: LibraryItemStatus) => {
    updateStatus.mutate({
      libraryItemId,
      status: newStatus,
    });
    setOpen(false);
  };

  const availableStatuses = LIBRARY_STATUS_CONFIG.filter(
    (config) => config.value !== currentStatus
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="focus-visible:ring-ring transition-all duration-200 hover:scale-105 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          disabled={updateStatus.isPending}
          aria-label={currentConfig.ariaLabel}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Badge
            variant={currentConfig.badgeVariant}
            className="cursor-pointer"
            data-library-interactive
          >
            {currentConfig.label}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-md w-56"
        align="start"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="space-y-xs">
          <p className="caption text-muted-foreground mb-md font-medium">
            Change status
          </p>
          {availableStatuses.map((statusConfig) => (
            <Button
              key={statusConfig.value}
              variant="ghost"
              className="body-sm w-full justify-start"
              disabled={updateStatus.isPending}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleStatusChange(statusConfig.value);
              }}
              aria-label={statusConfig.ariaLabel}
            >
              {statusConfig.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
