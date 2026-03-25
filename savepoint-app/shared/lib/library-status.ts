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
    description: "Want to play or replay",
    badgeVariant: "upNext",
    icon: Star,
    ariaLabel: "Up Next",
  },
  {
    value: LibraryItemStatus.PLAYING,
    label: "Playing",
    description: "Actively engaged",
    badgeVariant: "playing",
    icon: Gamepad2,
    ariaLabel: "Playing",
  },
  {
    value: LibraryItemStatus.SHELF,
    label: "Shelf",
    description: "Own it, sitting there",
    badgeVariant: "shelf",
    icon: Archive,
    ariaLabel: "On Shelf",
  },
  {
    value: LibraryItemStatus.PLAYED,
    label: "Played",
    description: "Have experienced",
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
          label: "Up Next",
          icon: Star,
        },
        {
          targetStatus: LibraryItemStatus.PLAYED,
          label: "Played",
          icon: CheckCircle,
        },
      ];
    case LibraryItemStatus.UP_NEXT:
      if (hasBeenPlayed) {
        return [
          {
            targetStatus: LibraryItemStatus.PLAYING,
            label: "Playing",
            icon: Gamepad2,
          },
          {
            targetStatus: LibraryItemStatus.PLAYED,
            label: "Played",
            icon: CheckCircle,
          },
        ];
      }
      return [
        {
          targetStatus: LibraryItemStatus.PLAYING,
          label: "Playing",
          icon: Gamepad2,
        },
        {
          targetStatus: LibraryItemStatus.SHELF,
          label: "Back to Shelf",
          icon: Archive,
        },
      ];
    case LibraryItemStatus.PLAYING:
      return [
        {
          targetStatus: LibraryItemStatus.PLAYED,
          label: "Played",
          icon: CheckCircle,
        },
        { targetStatus: LibraryItemStatus.UP_NEXT, label: "Pause", icon: Star },
      ];
    case LibraryItemStatus.PLAYED:
      return [
        {
          targetStatus: LibraryItemStatus.UP_NEXT,
          label: "Replay",
          icon: Star,
        },
        {
          targetStatus: LibraryItemStatus.SHELF,
          label: "Back to Shelf",
          icon: Archive,
        },
      ];
    case LibraryItemStatus.WISHLIST:
      return [
        {
          targetStatus: LibraryItemStatus.SHELF,
          label: "Move to Shelf",
          icon: Archive,
        },
      ];
    default:
      return [];
  }
}
