import type { LibraryItemStatus } from "@prisma/client";

export type StatusBadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive";

export type StatusConfig = {
  value: LibraryItemStatus;
  label: string;
  description: string;
  badgeVariant: StatusBadgeVariant;
};

export const LIBRARY_STATUS_CONFIG: readonly StatusConfig[] = [
  {
    value: "CURIOUS_ABOUT",
    label: "Curious About",
    description: "Interested in trying this game",
    badgeVariant: "outline",
  },
  {
    value: "CURRENTLY_EXPLORING",
    label: "Currently Exploring",
    description: "Actively playing this game",
    badgeVariant: "default",
  },
  {
    value: "TOOK_A_BREAK",
    label: "Taking a Break",
    description: "Paused but plan to return",
    badgeVariant: "secondary",
  },
  {
    value: "EXPERIENCED",
    label: "Experienced",
    description: "Finished or completed this game",
    badgeVariant: "secondary",
  },
  {
    value: "WISHLIST",
    label: "Wishlist",
    description: "Want to play in the future",
    badgeVariant: "outline",
  },
  {
    value: "REVISITING",
    label: "Revisiting",
    description: "Playing again after a break",
    badgeVariant: "default",
  },
] as const;

export const LIBRARY_STATUS_LABELS: Record<LibraryItemStatus, string> = {
  CURIOUS_ABOUT: "Curious About",
  CURRENTLY_EXPLORING: "Currently Exploring",
  TOOK_A_BREAK: "Taking a Break",
  EXPERIENCED: "Experienced",
  WISHLIST: "Wishlist",
  REVISITING: "Revisiting",
};

export const LIBRARY_STATUS_VARIANTS: Record<
  LibraryItemStatus,
  StatusBadgeVariant
> = {
  CURIOUS_ABOUT: "outline",
  CURRENTLY_EXPLORING: "default",
  TOOK_A_BREAK: "secondary",
  EXPERIENCED: "secondary",
  WISHLIST: "outline",
  REVISITING: "default",
};

export function getStatusLabel(status: LibraryItemStatus): string {
  return LIBRARY_STATUS_LABELS[status];
}

export function getStatusVariant(
  status: LibraryItemStatus
): StatusBadgeVariant {
  return LIBRARY_STATUS_VARIANTS[status];
}
