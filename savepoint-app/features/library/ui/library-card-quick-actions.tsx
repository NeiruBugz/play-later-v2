"use client";
import type { LibraryItemStatus } from "@prisma/client";
import { MoreVertical } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/shared/components/ui/select";
import { LibraryStatusMapper } from "@/shared/lib/ui/enum-mappers";
import { useUpdateLibraryStatus } from "../hooks/use-update-library-status";
type LibraryCardQuickActionsProps = {
  libraryItemId: number;
  currentStatus: LibraryItemStatus;
};

const STATUS_OPTIONS: LibraryItemStatus[] = [
  "WISHLIST",
  "CURIOUS_ABOUT",
  "CURRENTLY_EXPLORING",
  "TOOK_A_BREAK",
  "EXPERIENCED",
  "REVISITING",
];

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
  // Determine which status options to show and which to disable
  const availableStatuses = STATUS_OPTIONS.filter(
    (status) => status !== currentStatus
  );
  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 rounded-md shadow-lg backdrop-blur">
      <Select
        value={currentStatus}
        onValueChange={handleStatusChange}
        disabled={updateStatus.isPending}
      >
        <SelectTrigger
          className="hover:bg-muted/20 h-8 w-8 border-none bg-transparent p-0 shadow-none"
          aria-label={`Change status from ${LibraryStatusMapper[currentStatus]}`}
        >
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </SelectTrigger>
        <SelectContent>
          {availableStatuses.map((status) => {
            // Disable Wishlist option if current status is not Wishlist (enforce transition rule)
            const isDisabled =
              status === "WISHLIST" && currentStatus !== "WISHLIST";
            return (
              <SelectItem
                key={status}
                value={status}
                disabled={isDisabled}
                className={isDisabled ? "opacity-50" : ""}
                aria-label={
                  isDisabled
                    ? `${LibraryStatusMapper[status]} - Cannot move back to Wishlist once progressed`
                    : `Change status to ${LibraryStatusMapper[status]}`
                }
              >
                {LibraryStatusMapper[status]}
                {isDisabled && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    (cannot move back)
                  </span>
                )}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
