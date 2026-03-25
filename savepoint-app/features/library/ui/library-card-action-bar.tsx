"use client";

import type { LibraryItemStatus } from "@/shared/types/library";

import { Button } from "@/shared/components/ui/button";
import {
  getStatusActions,
  getStatusVariant,
} from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";

import { useUpdateLibraryStatus } from "../hooks/use-update-library-status";
import type { LibraryCardActionBarProps } from "./library-card-action-bar.types";

const STATUS_BUTTON_STYLES: Record<string, string> = {
  wishlist:
    "bg-[var(--status-wishlist)]/90 text-[var(--status-wishlist-foreground)] hover:bg-[var(--status-wishlist)]",
  shelf:
    "bg-[var(--status-shelf)]/90 text-[var(--status-shelf-foreground)] hover:bg-[var(--status-shelf)]",
  upNext:
    "bg-[var(--status-upNext)]/90 text-[var(--status-upNext-foreground)] hover:bg-[var(--status-upNext)]",
  playing:
    "bg-[var(--status-playing)]/90 text-[var(--status-playing-foreground)] hover:bg-[var(--status-playing)]",
  played:
    "bg-[var(--status-played)]/90 text-[var(--status-played-foreground)] hover:bg-[var(--status-played)]",
};

export function LibraryCardActionBar({
  libraryItemId,
  currentStatus,
  hasBeenPlayed,
}: LibraryCardActionBarProps) {
  const updateStatus = useUpdateLibraryStatus();
  const handleStatusChange = (status: LibraryItemStatus) => {
    updateStatus.mutate({
      libraryItemId,
      status,
    });
  };

  const actions = getStatusActions(currentStatus, hasBeenPlayed);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100"
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
          {actions.map((action) => {
            const Icon = action.icon;
            const variant = getStatusVariant(action.targetStatus);
            return (
              <Button
                key={action.targetStatus}
                variant="secondary"
                size="sm"
                className={cn(
                  "caption px-md h-7 rounded-md border-none font-medium shadow-sm transition-all",
                  "hover:scale-105 hover:shadow-md focus-visible:scale-105",
                  "disabled:opacity-40 disabled:hover:scale-100",
                  STATUS_BUTTON_STYLES[variant]
                )}
                disabled={updateStatus.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStatusChange(action.targetStatus);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                aria-label={action.label}
                title={action.label}
              >
                <Icon className="mr-1 h-3 w-3" aria-hidden="true" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
