"use client";

import type { LibraryItemStatus } from "@prisma/client";

import { Button } from "@/shared/components/ui/button";
import { LibraryStatusMapper } from "@/shared/lib/ui/enum-mappers";

import { useUpdateLibraryStatus } from "../hooks/use-update-library-status";
import type { LibraryCardActionBarProps } from "./library-card-action-bar.types";

const STATUS_OPTIONS: LibraryItemStatus[] = [
  "WISHLIST",
  "CURIOUS_ABOUT",
  "CURRENTLY_EXPLORING",
  "TOOK_A_BREAK",
  "EXPERIENCED",
  "REVISITING",
];

export function LibraryCardActionBar({
  libraryItemId,
  currentStatus,
}: LibraryCardActionBarProps) {
  const updateStatus = useUpdateLibraryStatus();
  const handleStatusChange = (newStatus: LibraryItemStatus) => {
    updateStatus.mutate({
      libraryItemId,
      status: newStatus,
    });
  };

  const availableStatuses = STATUS_OPTIONS.filter(
    (status) => status !== currentStatus
  );
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100"
      role="toolbar"
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
      <div className="pointer-events-auto rounded-b-md bg-gradient-to-t from-black/80 via-black/70 to-transparent p-3 pt-8 backdrop-blur-sm">
        <div className="flex flex-wrap gap-1.5">
          {availableStatuses.map((status) => {
            const isDisabled =
              status === "WISHLIST" && currentStatus !== "WISHLIST";
            return (
              <Button
                key={status}
                variant="secondary"
                size="sm"
                className="h-7 rounded-md border border-white/10 bg-white/10 px-2.5 text-xs font-medium text-white shadow-sm transition-all hover:scale-105 hover:border-white/20 hover:bg-white/20 hover:shadow-md focus-visible:scale-105 focus-visible:border-white/30 focus-visible:bg-white/30 disabled:opacity-40 disabled:hover:scale-100"
                disabled={isDisabled || updateStatus.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStatusChange(status);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                aria-label={
                  isDisabled
                    ? `${LibraryStatusMapper[status]} - Cannot move back to Wishlist`
                    : `Change status to ${LibraryStatusMapper[status]}`
                }
                title={
                  isDisabled
                    ? "Cannot move back to Wishlist"
                    : `Change to ${LibraryStatusMapper[status]}`
                }
              >
                {LibraryStatusMapper[status]}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
