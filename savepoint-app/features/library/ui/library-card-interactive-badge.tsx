"use client";

import type { LibraryItemStatus } from "@prisma/client";
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
  "WISHLIST",
  "CURIOUS_ABOUT",
  "CURRENTLY_EXPLORING",
  "TOOK_A_BREAK",
  "EXPERIENCED",
  "REVISITING",
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
        className="w-56 p-2"
        align="start"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="space-y-1">
          <p className="text-muted-foreground mb-2 text-xs font-medium">
            Change status
          </p>
          {availableStatuses.map((status) => {
            const isDisabled =
              status === "WISHLIST" && currentStatus !== "WISHLIST";
            return (
              <Button
                key={status}
                variant="ghost"
                className="w-full justify-start text-sm"
                disabled={isDisabled || updateStatus.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStatusChange(status);
                }}
              >
                {LibraryStatusMapper[status]}
                {isDisabled && (
                  <span className="text-muted-foreground ml-auto text-xs">
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
