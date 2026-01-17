"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { LIBRARY_STATUS_CONFIG } from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";
import type { LibraryItemStatus } from "@/shared/types";

import { quickAddToLibraryAction } from "../server-actions";
import type { QuickAddPopoverProps } from "./quick-add-popover.types";

export function QuickAddPopover({
  igdbId,
  gameTitle,
  trigger,
  onSuccess,
}: QuickAddPopoverProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleStatusSelect = (status: LibraryItemStatus) => {
    if (isPending) return;

    startTransition(async () => {
      const result = await quickAddToLibraryAction({ igdbId, status });

      if (result.success) {
        const config = LIBRARY_STATUS_CONFIG.find((c) => c.value === status);
        const statusLabel = config?.label ?? "Unknown";

        toast.success(`Added to ${statusLabel}`, {
          description: gameTitle,
        });

        setOpen(false);
        onSuccess?.();
      } else {
        toast.error("Failed to add game", {
          description: result.error || "Please try again",
        });
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="p-xs w-64" align="start">
        <div className="space-y-xs">
          <h3 className="caption text-muted-foreground mb-sm px-xs">
            Add to library
          </h3>
          <div className="gap-xs flex flex-col">
            {LIBRARY_STATUS_CONFIG.map((config) => {
              const Icon = config.icon;

              return (
                <Button
                  key={config.value}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-sm hover:bg-muted justify-start",
                    "duration-normal ease-out-expo transition-all"
                  )}
                  onClick={() => handleStatusSelect(config.value)}
                  disabled={isPending}
                  aria-label={config.ariaLabel}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="caption">{config.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
