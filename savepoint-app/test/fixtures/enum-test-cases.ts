import { LibraryItemStatus } from "@/shared/types";

export const STATUS_BADGE_TEST_CASES = [
  { status: LibraryItemStatus.CURIOUS_ABOUT, label: "Curious About" },
  {
    status: LibraryItemStatus.CURRENTLY_EXPLORING,
    label: "Currently Exploring",
  },
  { status: LibraryItemStatus.TOOK_A_BREAK, label: "Taking a Break" },
  { status: LibraryItemStatus.EXPERIENCED, label: "Experienced" },
  { status: LibraryItemStatus.WISHLIST, label: "Wishlist" },
  { status: LibraryItemStatus.REVISITING, label: "Revisiting" },
] as const;

export const STATUS_SELECT_OPTIONS = [
  { label: "Curious About", description: "Interested in trying this game" },
  { label: "Currently Exploring", description: "Actively playing this game" },
  { label: "Taking a Break", description: "Paused but plan to return" },
  { label: "Experienced", description: "Finished or completed this game" },
  { label: "Wishlist", description: "Want to play in the future" },
  { label: "Revisiting", description: "Playing again after a break" },
] as const;

export const STATUS_FILTER_TEST_CASES = [
  { status: LibraryItemStatus.CURIOUS_ABOUT, label: "Curious About" },
  {
    status: LibraryItemStatus.CURRENTLY_EXPLORING,
    label: "Currently Exploring",
  },
  { status: LibraryItemStatus.TOOK_A_BREAK, label: "Taking a Break" },
  { status: LibraryItemStatus.EXPERIENCED, label: "Experienced" },
  { status: LibraryItemStatus.WISHLIST, label: "Wishlist" },
  { status: LibraryItemStatus.REVISITING, label: "Revisiting" },
] as const;

export const ACTION_BAR_STATUS_LABELS: Record<LibraryItemStatus, string> = {
  [LibraryItemStatus.CURIOUS_ABOUT]: "Curious About",
  [LibraryItemStatus.CURRENTLY_EXPLORING]: "Currently Exploring",
  [LibraryItemStatus.TOOK_A_BREAK]: "Took a Break",
  [LibraryItemStatus.EXPERIENCED]: "Experienced",
  [LibraryItemStatus.WISHLIST]: "Wishlist",
  [LibraryItemStatus.REVISITING]: "Revisiting",
};

export const VALID_IMAGE_TYPES = [
  { name: "photo.jpg", type: "image/jpeg", description: "JPEG" },
  { name: "photo.png", type: "image/png", description: "PNG" },
  { name: "animation.gif", type: "image/gif", description: "GIF" },
  { name: "photo.webp", type: "image/webp", description: "WebP" },
] as const;
