import { LibraryItemStatus } from "@prisma/client";

export const STATUS_OPTIONS: Array<{
  value: LibraryItemStatus;
  label: string;
  description: string;
}> = [
  {
    value: LibraryItemStatus.CURIOUS_ABOUT,
    label: "Curious About",
    description: "Interested in trying this game",
  },
  {
    value: LibraryItemStatus.CURRENTLY_EXPLORING,
    label: "Currently Exploring",
    description: "Actively playing this game",
  },
  {
    value: LibraryItemStatus.TOOK_A_BREAK,
    label: "Taking a Break",
    description: "Paused but plan to return",
  },
  {
    value: LibraryItemStatus.EXPERIENCED,
    label: "Experienced",
    description: "Finished or completed this game",
  },
  {
    value: LibraryItemStatus.WISHLIST,
    label: "Wishlist",
    description: "Want to play in the future",
  },
  {
    value: LibraryItemStatus.REVISITING,
    label: "Revisiting",
    description: "Playing again after a break",
  },
];

export function getStatusLabel(status: LibraryItemStatus): string {
  return STATUS_OPTIONS.find((opt) => opt.value === status)?.label ?? "Unknown";
}
