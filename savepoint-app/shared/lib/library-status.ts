import { LibraryItemStatus } from "@/data-access-layer/domain/library";

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
    value: LibraryItemStatus.CURIOUS_ABOUT,
    label: "Curious About",
    description: "Interested in trying this game",
    badgeVariant: "curious",
  },
  {
    value: LibraryItemStatus.CURRENTLY_EXPLORING,
    label: "Currently Exploring",
    description: "Actively playing this game",
    badgeVariant: "playing",
  },
  {
    value: LibraryItemStatus.TOOK_A_BREAK,
    label: "Taking a Break",
    description: "Paused but plan to return",
    badgeVariant: "break",
  },
  {
    value: LibraryItemStatus.EXPERIENCED,
    label: "Experienced",
    description: "Finished or completed this game",
    badgeVariant: "experienced",
  },
  {
    value: LibraryItemStatus.WISHLIST,
    label: "Wishlist",
    description: "Want to play in the future",
    badgeVariant: "wishlist",
  },
  {
    value: LibraryItemStatus.REVISITING,
    label: "Revisiting",
    description: "Playing again after a break",
    badgeVariant: "revisiting",
  },
] as const;

export const LIBRARY_STATUS_LABELS: Record<LibraryItemStatus, string> = {
  [LibraryItemStatus.CURIOUS_ABOUT]: "Curious About",
  [LibraryItemStatus.CURRENTLY_EXPLORING]: "Currently Exploring",
  [LibraryItemStatus.TOOK_A_BREAK]: "Taking a Break",
  [LibraryItemStatus.EXPERIENCED]: "Experienced",
  [LibraryItemStatus.WISHLIST]: "Wishlist",
  [LibraryItemStatus.REVISITING]: "Revisiting",
};

export const LIBRARY_STATUS_VARIANTS: Record<
  LibraryItemStatus,
  StatusBadgeVariant
> = {
  [LibraryItemStatus.CURIOUS_ABOUT]: "curious",
  [LibraryItemStatus.CURRENTLY_EXPLORING]: "playing",
  [LibraryItemStatus.TOOK_A_BREAK]: "break",
  [LibraryItemStatus.EXPERIENCED]: "experienced",
  [LibraryItemStatus.WISHLIST]: "wishlist",
  [LibraryItemStatus.REVISITING]: "revisiting",
};

export function getStatusLabel(status: LibraryItemStatus): string {
  return LIBRARY_STATUS_LABELS[status];
}

export function getStatusVariant(
  status: LibraryItemStatus
): StatusBadgeVariant {
  return LIBRARY_STATUS_VARIANTS[status];
}
