"use client";

import { Button } from "@/shared/components/ui/button";
import {
  getStatusActions,
  getStatusVariant,
} from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";
import type { LibraryItemStatus } from "@/shared/types/library";

import { useUpdateLibraryStatus } from "../hooks/use-update-library-status";

interface LibraryCardMobileActionsProps {
  libraryItemId: number;
  currentStatus: LibraryItemStatus;
  hasBeenPlayed: boolean;
}

const STATUS_BUTTON_STYLES: Record<string, string> = {
  wishlist:
    "bg-[var(--status-wishlist)] text-[var(--status-wishlist-foreground)]",
  shelf: "bg-[var(--status-shelf)] text-[var(--status-shelf-foreground)]",
  upNext: "bg-[var(--status-upNext)] text-[var(--status-upNext-foreground)]",
  playing: "bg-[var(--status-playing)] text-[var(--status-playing-foreground)]",
  played: "bg-[var(--status-played)] text-[var(--status-played-foreground)]",
};

export function LibraryCardMobileActions({
  libraryItemId,
  currentStatus,
  hasBeenPlayed,
}: LibraryCardMobileActionsProps) {
  const updateStatus = useUpdateLibraryStatus();
  const handleStatusChange = (status: LibraryItemStatus) => {
    if (updateStatus.isPending) return;
    updateStatus.mutate({
      libraryItemId,
      status,
    });
  };

  const actions = getStatusActions(currentStatus, hasBeenPlayed);

  return (
    <div className="flex h-full w-full flex-col gap-1 bg-gradient-to-l from-black/90 via-black/80 to-transparent pr-2">
      {actions.map((action) => {
        const Icon = action.icon;
        const variant = getStatusVariant(action.targetStatus);
        return (
          <Button
            key={action.targetStatus}
            variant="secondary"
            size="sm"
            className={cn(
              "flex h-[calc(50%-0.25rem)] min-h-[44px] w-full flex-col items-center justify-center gap-0.5 rounded-md p-1 shadow-sm",
              "disabled:opacity-40",
              STATUS_BUTTON_STYLES[variant]
            )}
            disabled={updateStatus.isPending}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleStatusChange(action.targetStatus);
            }}
            aria-label={action.label}
            data-library-interactive
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="text-[10px] leading-none font-semibold">
              {action.label.split(" ")[0]}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
