"use client";

import type { LibraryItemStatus } from "@prisma/client";
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

import { updateLibraryStatusAction } from "../server-actions";

type QuickActionButtonsProps = {
  igdbId: number;
  gameTitle: string;
  currentStatus?: LibraryItemStatus;
};

const STATUS_CONFIG: Record<
  LibraryItemStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    ariaLabel: string;
  }
> = {
  CURIOUS_ABOUT: {
    label: "Curious",
    icon: SparklesIcon,
    ariaLabel: "Mark as Curious About",
  },
  CURRENTLY_EXPLORING: {
    label: "Playing",
    icon: GamepadIcon,
    ariaLabel: "Mark as Currently Exploring",
  },
  TOOK_A_BREAK: {
    label: "Break",
    icon: PauseIcon,
    ariaLabel: "Mark as Taking a Break",
  },
  EXPERIENCED: {
    label: "Finished",
    icon: HeartIcon,
    ariaLabel: "Mark as Experienced",
  },
  WISHLIST: {
    label: "Wishlist",
    icon: BookmarkIcon,
    ariaLabel: "Add to Wishlist",
  },
  REVISITING: {
    label: "Replay",
    icon: ClockIcon,
    ariaLabel: "Mark as Revisiting",
  },
};

const STATUS_ORDER: LibraryItemStatus[] = [
  "CURIOUS_ABOUT",
  "CURRENTLY_EXPLORING",
  "TOOK_A_BREAK",
  "EXPERIENCED",
  "WISHLIST",
  "REVISITING",
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
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Screen reader announcement for status changes */}
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {announcement}
        </div>
        <div
          className="grid grid-cols-2 gap-2"
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
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="flex h-auto flex-col gap-1 py-3 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() => handleStatusChange(status)}
                disabled={isPending}
                aria-label={config.ariaLabel}
                aria-pressed={isActive}
              >
                <Icon
                  className={`h-5 w-5 ${isActive ? "text-primary-foreground" : "text-primary"}`}
                  aria-hidden="true"
                />
                <span className="text-xs">{config.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
