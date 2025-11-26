"use client";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/ui";
import { LibraryStatusMapper } from "@/shared/lib/ui/enum-mappers";
import { LibraryItemStatus } from "@/shared/types";

import { useUpdateLibraryStatus } from "../hooks/use-update-library-status";
import type { LibraryCardActionBarProps } from "./library-card-action-bar.types";

const STATUS_OPTIONS: LibraryItemStatus[] = [
  LibraryItemStatus.WISHLIST,
  LibraryItemStatus.CURIOUS_ABOUT,
  LibraryItemStatus.CURRENTLY_EXPLORING,
  LibraryItemStatus.TOOK_A_BREAK,
  LibraryItemStatus.EXPERIENCED,
  LibraryItemStatus.REVISITING,
];

const STATUS_BUTTON_STYLES: Record<LibraryItemStatus, string> = {
  [LibraryItemStatus.WISHLIST]:
    "bg-[var(--status-wishlist)]/90 text-[var(--status-wishlist-foreground)] hover:bg-[var(--status-wishlist)]",
  [LibraryItemStatus.CURIOUS_ABOUT]:
    "bg-[var(--status-curious)]/90 text-[var(--status-curious-foreground)] hover:bg-[var(--status-curious)]",
  [LibraryItemStatus.CURRENTLY_EXPLORING]:
    "bg-[var(--status-playing)]/90 text-[var(--status-playing-foreground)] hover:bg-[var(--status-playing)]",
  [LibraryItemStatus.TOOK_A_BREAK]:
    "bg-[var(--status-break)]/90 text-[var(--status-break-foreground)] hover:bg-[var(--status-break)]",
  [LibraryItemStatus.EXPERIENCED]:
    "bg-[var(--status-experienced)]/90 text-[var(--status-experienced-foreground)] hover:bg-[var(--status-experienced)]",
  [LibraryItemStatus.REVISITING]:
    "bg-[var(--status-revisiting)]/90 text-[var(--status-revisiting-foreground)] hover:bg-[var(--status-revisiting)]",
};

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
      <div className="p-lg pt-3xl pointer-events-auto rounded-b-md bg-gradient-to-t from-black/80 via-black/70 to-transparent backdrop-blur-sm">
        <div className="gap-sm flex flex-wrap">
          {availableStatuses.map((status) => {
            const isDisabled =
              status === LibraryItemStatus.WISHLIST &&
              currentStatus !== LibraryItemStatus.WISHLIST;
            return (
              <Button
                key={status}
                variant="secondary"
                size="sm"
                className={cn(
                  "caption px-md h-7 rounded-md border-none font-medium shadow-sm transition-all",
                  "hover:scale-105 hover:shadow-md focus-visible:scale-105",
                  "disabled:opacity-40 disabled:hover:scale-100",
                  STATUS_BUTTON_STYLES[status]
                )}
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
