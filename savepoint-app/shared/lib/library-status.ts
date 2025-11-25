import type { LibraryItemStatus } from "@prisma/client";

export type StatusBadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "curious"
  | "playing"
  | "break"
  | "experienced"
  | "wishlist"
  | "revisiting";

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
    badgeVariant: "curious",
  },
  {
    value: "CURRENTLY_EXPLORING",
    label: "Currently Exploring",
    description: "Actively playing this game",
    badgeVariant: "playing",
  },
  {
    value: "TOOK_A_BREAK",
    label: "Taking a Break",
    description: "Paused but plan to return",
    badgeVariant: "break",
  },
  {
    value: "EXPERIENCED",
    label: "Experienced",
    description: "Finished or completed this game",
    badgeVariant: "experienced",
  },
  {
    value: "WISHLIST",
    label: "Wishlist",
    description: "Want to play in the future",
    badgeVariant: "wishlist",
  },
  {
    value: "REVISITING",
    label: "Revisiting",
    description: "Playing again after a break",
    badgeVariant: "revisiting",
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
  CURIOUS_ABOUT: "curious",
  CURRENTLY_EXPLORING: "playing",
  TOOK_A_BREAK: "break",
  EXPERIENCED: "experienced",
  WISHLIST: "wishlist",
  REVISITING: "revisiting",
};

export function getStatusLabel(status: LibraryItemStatus): string {
  return LIBRARY_STATUS_LABELS[status];
}

export function getStatusVariant(
  status: LibraryItemStatus
): StatusBadgeVariant {
  return LIBRARY_STATUS_VARIANTS[status];
}
