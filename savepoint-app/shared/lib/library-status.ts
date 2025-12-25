import { LibraryItemStatus } from "@/data-access-layer/domain/library";
import {
  BookmarkIcon,
  BoxIcon,
  CheckCircleIcon,
  GamepadIcon,
} from "lucide-react";
import type { FC } from "react";

export type StatusBadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "wantToPlay"
  | "owned"
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
    value: LibraryItemStatus.WANT_TO_PLAY,
    label: "Want to Play",
    description: "On your radar, haven't started",
    badgeVariant: "wantToPlay",
    icon: BookmarkIcon,
    ariaLabel: "Mark as Want to Play",
  },
  {
    value: LibraryItemStatus.OWNED,
    label: "Owned",
    description: "In your library, haven't started",
    badgeVariant: "owned",
    icon: BoxIcon,
    ariaLabel: "Mark as Owned",
  },
  {
    value: LibraryItemStatus.PLAYING,
    label: "Playing",
    description: "Currently engaged",
    badgeVariant: "playing",
    icon: GamepadIcon,
    ariaLabel: "Mark as Playing",
  },
  {
    value: LibraryItemStatus.PLAYED,
    label: "Played",
    description: "Have experienced it",
    badgeVariant: "played",
    icon: CheckCircleIcon,
    ariaLabel: "Mark as Played",
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
