"use client";

import type { LibraryItemStatus } from "@/data-access-layer/domain/library";

import { Button } from "@/shared/components/ui/button";
import { LIBRARY_STATUS_CONFIG } from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui";

import { useUpdateLibraryStatus } from "../hooks/use-update-library-status";
import type { LibraryCardActionBarProps } from "./library-card-action-bar.types";

const STATUS_BUTTON_STYLES: Record<string, string> = {
  wantToPlay:
    "bg-[var(--status-wantToPlay)]/90 text-[var(--status-wantToPlay-foreground)] hover:bg-[var(--status-wantToPlay)]",
  owned:
    "bg-[var(--status-owned)]/90 text-[var(--status-owned-foreground)] hover:bg-[var(--status-owned)]",
  playing:
    "bg-[var(--status-playing)]/90 text-[var(--status-playing-foreground)] hover:bg-[var(--status-playing)]",
  played:
    "bg-[var(--status-played)]/90 text-[var(--status-played-foreground)] hover:bg-[var(--status-played)]",
};

export function LibraryCardActionBar({
  libraryItemId,
  currentStatus,
}: LibraryCardActionBarProps) {
  const updateStatus = useUpdateLibraryStatus();
  const handleStatusChange = (status: LibraryItemStatus) => {
    updateStatus.mutate({
      libraryItemId,
      status,
    });
  };

  const availableStatuses = LIBRARY_STATUS_CONFIG.filter(
    (config) => config.value !== currentStatus
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
          {availableStatuses.map((config) => {
            return (
              <Button
                key={config.value}
                variant="secondary"
                size="sm"
                className={cn(
                  "caption px-md h-7 rounded-md border-none font-medium shadow-sm transition-all",
                  "hover:scale-105 hover:shadow-md focus-visible:scale-105",
                  "disabled:opacity-40 disabled:hover:scale-100",
                  STATUS_BUTTON_STYLES[config.badgeVariant]
                )}
                disabled={updateStatus.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStatusChange(config.value);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                aria-label={config.ariaLabel}
                title={config.label}
              >
                {config.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
