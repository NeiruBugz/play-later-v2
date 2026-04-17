import { Archive, Bookmark, CheckCircle, Gamepad2, Star } from "lucide-react";
import type { FC } from "react";

import { LibraryItemStatus } from "@/shared/types/library";

export type StatusBadgeVariant =
  | "wishlist"
  | "shelf"
  | "upNext"
  | "playing"
  | "played";

export interface StatusConfig {
  value: LibraryItemStatus;
  label: string;
  description: string;
  badgeVariant: StatusBadgeVariant;
  icon: FC<{ className?: string }>;
  ariaLabel: string;
}

export const LIBRARY_STATUS_CONFIG: readonly StatusConfig[] = [
  {
    value: LibraryItemStatus.UP_NEXT,
    label: "Up Next",
    description: "Queued to play next",
    badgeVariant: "upNext",
    icon: Star,
    ariaLabel: "Up Next",
  },
  {
    value: LibraryItemStatus.PLAYING,
    label: "Playing",
    description: "Playing it now",
    badgeVariant: "playing",
    icon: Gamepad2,
    ariaLabel: "Playing",
  },
  {
    value: LibraryItemStatus.SHELF,
    label: "Shelf",
    description: "On your shelf",
    badgeVariant: "shelf",
    icon: Archive,
    ariaLabel: "On the shelf",
  },
  {
    value: LibraryItemStatus.PLAYED,
    label: "Played",
    description: "Set down, for now or forever",
    badgeVariant: "played",
    icon: CheckCircle,
    ariaLabel: "Played",
  },
  {
    value: LibraryItemStatus.WISHLIST,
    label: "Wishlist",
    description: "Want it someday",
    badgeVariant: "wishlist",
    icon: Bookmark,
    ariaLabel: "Wishlisted",
  },
] as const;

export const LIBRARY_STATUS_MAP = new Map(
  LIBRARY_STATUS_CONFIG.map((config) => [config.value, config])
);

export function getStatusConfig(status: LibraryItemStatus): StatusConfig {
  const config = LIBRARY_STATUS_MAP.get(status);
  if (!config) {
    throw new Error(`Unknown library status: ${status}`);
  }
  return config;
}

export function getStatusLabel(status: LibraryItemStatus): string {
  return getStatusConfig(status).label;
}

export function getStatusIcon(
  status: LibraryItemStatus
): FC<{ className?: string }> {
  return getStatusConfig(status).icon;
}

export function getStatusVariant(
  status: LibraryItemStatus
): StatusBadgeVariant {
  return getStatusConfig(status).badgeVariant;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function shouldShowBadge(_status: LibraryItemStatus): boolean {
  return true;
}

export function getUpNextLabel(hasBeenPlayed: boolean): string {
  return hasBeenPlayed ? "Replay" : "Up Next";
}

export type StatusAction = {
  targetStatus: LibraryItemStatus;
  label: string;
  icon: FC<{ className?: string }>;
};

export function getStatusActions(
  currentStatus: LibraryItemStatus,
  hasBeenPlayed: boolean
): StatusAction[] {
  switch (currentStatus) {
    case LibraryItemStatus.SHELF:
      return [
        {
          targetStatus: LibraryItemStatus.UP_NEXT,
          label: "Queue it",
          icon: Star,
        },
        {
          targetStatus: LibraryItemStatus.PLAYED,
          label: "Mark as played",
          icon: CheckCircle,
        },
      ];
    case LibraryItemStatus.UP_NEXT:
      if (hasBeenPlayed) {
        return [
          {
            targetStatus: LibraryItemStatus.PLAYING,
            label: "Start playing",
            icon: Gamepad2,
          },
          {
            targetStatus: LibraryItemStatus.PLAYED,
            label: "Set it down",
            icon: CheckCircle,
          },
        ];
      }
      return [
        {
          targetStatus: LibraryItemStatus.PLAYING,
          label: "Start playing",
          icon: Gamepad2,
        },
        {
          targetStatus: LibraryItemStatus.SHELF,
          label: "Back to the shelf",
          icon: Archive,
        },
      ];
    case LibraryItemStatus.PLAYING:
      return [
        {
          targetStatus: LibraryItemStatus.PLAYED,
          label: "Set it down",
          icon: CheckCircle,
        },
        {
          targetStatus: LibraryItemStatus.UP_NEXT,
          label: "Pause for now",
          icon: Star,
        },
      ];
    case LibraryItemStatus.PLAYED:
      return [
        {
          targetStatus: LibraryItemStatus.UP_NEXT,
          label: "Queue a replay",
          icon: Star,
        },
        {
          targetStatus: LibraryItemStatus.SHELF,
          label: "Back to the shelf",
          icon: Archive,
        },
      ];
    case LibraryItemStatus.WISHLIST:
      return [
        {
          targetStatus: LibraryItemStatus.SHELF,
          label: "Put on the shelf",
          icon: Archive,
        },
      ];
    default:
      return [];
  }
}
