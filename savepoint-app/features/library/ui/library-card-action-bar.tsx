"use client";

import type { LibraryItemStatus } from "@prisma/client";

import { Button } from "@/shared/components/ui/button";
import { LibraryStatusMapper } from "@/shared/lib/ui/enum-mappers";

import { useUpdateLibraryStatus } from "../hooks/use-update-library-status";

type LibraryCardActionBarProps = {
  libraryItemId: number;
  currentStatus: LibraryItemStatus;
};

/**
 * Status options in display order
 */
const STATUS_OPTIONS: LibraryItemStatus[] = [
  "WISHLIST",
  "CURIOUS_ABOUT",
  "CURRENTLY_EXPLORING",
  "TOOK_A_BREAK",
  "EXPERIENCED",
  "REVISITING",
];

/**
 * Bottom action bar variant for library cards (Variant B)
 *
 * Features:
 * - Full-width action bar at the bottom of the card
 * - Fades in on card hover (stays within card bounds)
 * - Shows status options as clickable chips/pills
 * - Semi-transparent background with backdrop blur
 * - Same business logic as quick actions (no Wishlist backwards transition)
 * - Optimistic updates with automatic rollback on error
 * - Loading state during mutation
 * - Toast notifications for success/error
 *
 * @param libraryItemId - The ID of the library item to update
 * @param currentStatus - The current status of the library item
 *
 * @example
 * ```tsx
 * <LibraryCardActionBar
 *   libraryItemId={item.id}
 *   currentStatus={item.status}
 * />
 * ```
 */
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

  // Determine which status options to show and which to disable
  const availableStatuses = STATUS_OPTIONS.filter(
    (status) => status !== currentStatus
  );

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
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
            // Disable Wishlist option if current status is not Wishlist (enforce transition rule)
            const isDisabled =
              status === "WISHLIST" && currentStatus !== "WISHLIST";

            return (
              <Button
                key={status}
                variant="secondary"
                size="sm"
                className="h-7 rounded-md border border-white/10 bg-white/10 px-2.5 text-xs font-medium text-white shadow-sm transition-all hover:scale-105 hover:border-white/20 hover:bg-white/20 hover:shadow-md disabled:opacity-40 disabled:hover:scale-100"
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
