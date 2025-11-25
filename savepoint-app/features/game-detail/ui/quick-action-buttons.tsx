"use client";

import { LibraryItemStatus } from "@/shared/types";
import {
  BookmarkIcon,
  ClockIcon,
  GamepadIcon,
  HeartIcon,
  PauseIcon,
  SparklesIcon,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/ui";

import { updateLibraryStatusAction } from "../server-actions";
import type { QuickActionButtonsProps } from "./quick-action-buttons.types";

const STATUS_CONFIG: Record<
  LibraryItemStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    ariaLabel: string;
    activeClass: string;
  }
> = {
  [LibraryItemStatus.CURIOUS_ABOUT]: {
    label: "Curious",
    icon: SparklesIcon,
    ariaLabel: "Mark as Curious About",
    activeClass:
      "bg-[var(--status-curious)] text-[var(--status-curious-foreground)] hover:bg-[var(--status-curious)]/90",
  },
  [LibraryItemStatus.CURRENTLY_EXPLORING]: {
    label: "Playing",
    icon: GamepadIcon,
    ariaLabel: "Mark as Currently Exploring",
    activeClass:
      "bg-[var(--status-playing)] text-[var(--status-playing-foreground)] hover:bg-[var(--status-playing)]/90",
  },
  [LibraryItemStatus.TOOK_A_BREAK]: {
    label: "Break",
    icon: PauseIcon,
    ariaLabel: "Mark as Taking a Break",
    activeClass:
      "bg-[var(--status-break)] text-[var(--status-break-foreground)] hover:bg-[var(--status-break)]/90",
  },
  [LibraryItemStatus.EXPERIENCED]: {
    label: "Finished",
    icon: HeartIcon,
    ariaLabel: "Mark as Experienced",
    activeClass:
      "bg-[var(--status-experienced)] text-[var(--status-experienced-foreground)] hover:bg-[var(--status-experienced)]/90",
  },
  [LibraryItemStatus.WISHLIST]: {
    label: "Wishlist",
    icon: BookmarkIcon,
    ariaLabel: "Add to Wishlist",
    activeClass:
      "bg-[var(--status-wishlist)] text-[var(--status-wishlist-foreground)] hover:bg-[var(--status-wishlist)]/90",
  },
  [LibraryItemStatus.REVISITING]: {
    label: "Replay",
    icon: ClockIcon,
    ariaLabel: "Mark as Revisiting",
    activeClass:
      "bg-[var(--status-revisiting)] text-[var(--status-revisiting-foreground)] hover:bg-[var(--status-revisiting)]/90",
  },
};
const STATUS_ORDER: LibraryItemStatus[] = [
  LibraryItemStatus.CURIOUS_ABOUT,
  LibraryItemStatus.CURRENTLY_EXPLORING,
  LibraryItemStatus.TOOK_A_BREAK,
  LibraryItemStatus.EXPERIENCED,
  LibraryItemStatus.WISHLIST,
  LibraryItemStatus.REVISITING,
];
export const QuickActionButtons = ({
  igdbId,
  gameTitle,
  currentStatus,
}: QuickActionButtonsProps) => {
  const [isPending, startTransition] = useTransition();
  const [activeStatus, setActiveStatus] = useState<
    LibraryItemStatus | undefined
  >(currentStatus);
  const [announcement, setAnnouncement] = useState<string>("");
  const handleStatusChange = (status: LibraryItemStatus) => {
    if (isPending) return;
    startTransition(async () => {
      const result = await updateLibraryStatusAction({ igdbId, status });
      if (result.success) {
        setActiveStatus(status);
        const statusLabel = STATUS_CONFIG[status].label;
        const message = `Status updated to ${statusLabel}`;
        setAnnouncement(message);
        toast.success(message, {
          description: gameTitle,
        });
      } else {
        const errorMessage = "Failed to update status";
        setAnnouncement(errorMessage);
        toast.error(errorMessage, {
          description: result.error || "Please try again",
        });
      }
    });
  };
  return (
    <Card className="animate-fade-in w-full" style={{ animationDelay: "100ms" }}>
      <CardHeader className="pb-lg">
        <CardTitle className="font-serif">Quick Actions</CardTitle>
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
          className="grid grid-cols-2 gap-md"
          role="group"
          aria-label="Journey status quick actions"
        >
          {STATUS_ORDER.map((status) => {
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;
            const isActive = activeStatus === status;
            return (
              <Button
                key={status}
                variant="outline"
                size="sm"
                className={cn(
                  "focus-visible:ring-ring flex h-auto flex-col gap-xs border py-lg focus-visible:ring-2 focus-visible:ring-offset-2",
                  "duration-normal transition-all ease-out-expo",
                  isActive && config.activeClass
                )}
                onClick={() => handleStatusChange(status)}
                disabled={isPending}
                aria-label={config.ariaLabel}
                aria-pressed={isActive}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="caption">{config.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
