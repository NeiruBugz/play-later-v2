"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateLibraryStatusAction } from "@/features/manage-library-entry/server-actions";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { LIBRARY_STATUS_CONFIG } from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";
import { LibraryItemStatus } from "@/shared/types";

import type { QuickActionButtonsProps } from "./quick-action-buttons.types";

interface OptimisticStatusState {
  status: LibraryItemStatus | undefined;
  isOptimistic: boolean;
}
export const QuickActionButtons = ({
  igdbId,
  gameTitle,
  currentStatus,
}: QuickActionButtonsProps) => {
  const [isPending, startTransition] = useTransition();
  const [announcement, setAnnouncement] = useState<string>("");

  // Optimistic state management
  const [optimisticStatus, setOptimisticStatus] = useOptimistic<
    OptimisticStatusState,
    LibraryItemStatus
  >({ status: currentStatus, isOptimistic: false }, (_, newStatus) => ({
    status: newStatus,
    isOptimistic: true,
  }));
  const handleStatusChange = (status: LibraryItemStatus) => {
    if (isPending) return;

    startTransition(async () => {
      setOptimisticStatus(status);
      const result = await updateLibraryStatusAction({ igdbId, status });
      if (result.success) {
        const config = LIBRARY_STATUS_CONFIG.find((c) => c.value === status);
        const statusLabel = config?.label ?? "Unknown";
        const message = `Status updated to ${statusLabel}`;
        setAnnouncement(message);
        toast.success(message, {
          description: gameTitle,
        });
      } else {
        // React automatically reverts optimistic state on error
        const errorMessage = "Failed to update status";
        setAnnouncement(errorMessage);
        toast.error(errorMessage, {
          description: result.error || "Please try again",
        });
      }
    });
  };
  return (
    <Card
      className="animate-fade-in w-full"
      style={{ animationDelay: "100ms" }}
    >
      <CardHeader className="pb-lg">
        <CardTitle className="font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        {}
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {announcement}
        </div>
        <div
          className="gap-md grid grid-cols-2"
          role="group"
          aria-label="Journey status quick actions"
        >
          {LIBRARY_STATUS_CONFIG.map((config) => {
            const Icon = config.icon;
            const isActive = optimisticStatus.status === config.value;
            const isOptimisticActive =
              isActive && optimisticStatus.isOptimistic;

            const activeClass = `bg-[var(--status-${config.value.toLowerCase().replace(/_/g, "-")})] text-[var(--status-${config.value.toLowerCase().replace(/_/g, "-")}-foreground)] hover:bg-[var(--status-${config.value.toLowerCase().replace(/_/g, "-")})]/90`;

            return (
              <Button
                key={config.value}
                variant="outline"
                size="sm"
                className={cn(
                  "focus-visible:ring-ring gap-xs py-lg flex h-auto flex-col border focus-visible:ring-2 focus-visible:ring-offset-2",
                  "duration-normal ease-out-expo transition-all",
                  isActive && activeClass,
                  isOptimisticActive && "opacity-80"
                )}
                onClick={() => handleStatusChange(config.value)}
                disabled={isPending}
                aria-label={config.ariaLabel}
                aria-pressed={isActive}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isOptimisticActive && "animate-pulse"
                  )}
                  aria-hidden="true"
                />
                <span className="caption">{config.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
