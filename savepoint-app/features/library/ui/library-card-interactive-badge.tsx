"use client";

import { LibraryItemStatus } from "@/shared/types";
import { useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { LibraryStatusMapper } from "@/shared/lib/ui/enum-mappers";

import { useUpdateLibraryStatus } from "../hooks/use-update-library-status";
import type { LibraryCardInteractiveBadgeProps } from "./library-card-interactive-badge.types";

const STATUS_OPTIONS: LibraryItemStatus[] = [
  LibraryItemStatus.WISHLIST,
  LibraryItemStatus.CURIOUS_ABOUT,
  LibraryItemStatus.CURRENTLY_EXPLORING,
  LibraryItemStatus.TOOK_A_BREAK,
  LibraryItemStatus.EXPERIENCED,
  LibraryItemStatus.REVISITING,
];

export function LibraryCardInteractiveBadge({
  libraryItemId,
  currentStatus,
  statusVariant,
}: LibraryCardInteractiveBadgeProps) {
  const [open, setOpen] = useState(false);
  const updateStatus = useUpdateLibraryStatus();
  const handleStatusChange = (newStatus: LibraryItemStatus) => {
    updateStatus.mutate({
      libraryItemId,
      status: newStatus,
    });
    setOpen(false);
  };

  const availableStatuses = STATUS_OPTIONS.filter(
    (status) => status !== currentStatus
  );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="focus-visible:ring-ring transition-all duration-200 hover:scale-105 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          disabled={updateStatus.isPending}
          aria-label="Change status"
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
            variant={statusVariant}
            className="cursor-pointer"
            data-library-interactive
          >
            {LibraryStatusMapper[currentStatus]}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-md"
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
          {availableStatuses.map((status) => {
            const isDisabled =
              status === LibraryItemStatus.WISHLIST &&
              currentStatus !== LibraryItemStatus.WISHLIST;
            return (
              <Button
                key={status}
                variant="ghost"
                className="body-sm w-full justify-start"
                disabled={isDisabled || updateStatus.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStatusChange(status);
                }}
              >
                {LibraryStatusMapper[status]}
                {isDisabled && (
                  <span className="caption text-muted-foreground ml-auto">
                    (cannot move back)
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
