"use client";

import type { LibraryItemStatus } from "@/data-access-layer/domain/library";

import { Button } from "@/shared/components/ui/button";
import { LIBRARY_STATUS_CONFIG } from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";

import { useUpdateLibraryStatus } from "../hooks/use-update-library-status";

interface LibraryCardMobileActionsProps {
  libraryItemId: number;
  currentStatus: LibraryItemStatus;
}

const STATUS_BUTTON_STYLES: Record<string, string> = {
  wantToPlay:
    "bg-[var(--status-wantToPlay)] text-[var(--status-wantToPlay-foreground)]",
  owned: "bg-[var(--status-owned)] text-[var(--status-owned-foreground)]",
  playing: "bg-[var(--status-playing)] text-[var(--status-playing-foreground)]",
  played: "bg-[var(--status-played)] text-[var(--status-played-foreground)]",
};

export function LibraryCardMobileActions({
  libraryItemId,
  currentStatus,
}: LibraryCardMobileActionsProps) {
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
    <div className="flex h-full w-full flex-col gap-1 bg-gradient-to-l from-black/90 via-black/80 to-transparent pr-2">
      {availableStatuses.map((config) => {
        const Icon = config.icon;
        return (
          <Button
            key={config.value}
            variant="secondary"
            size="sm"
            className={cn(
              "flex h-[calc(25%-0.25rem)] min-h-[44px] w-full flex-col items-center justify-center gap-0.5 rounded-md p-1 shadow-sm",
              "disabled:opacity-40",
              STATUS_BUTTON_STYLES[config.badgeVariant]
            )}
            disabled={updateStatus.isPending}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleStatusChange(config.value);
            }}
            aria-label={config.ariaLabel}
            data-library-interactive
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="text-[10px] leading-none font-semibold">
              {config.label.split(" ")[0]}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
