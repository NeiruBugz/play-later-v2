import { LibraryItemStatus } from "@prisma/client";

export const STATUS_BADGE_TEST_CASES = [
  { status: LibraryItemStatus.WISHLIST, label: "Wishlist" },
  { status: LibraryItemStatus.SHELF, label: "Shelf" },
  { status: LibraryItemStatus.UP_NEXT, label: "Up Next" },
  { status: LibraryItemStatus.PLAYING, label: "Playing" },
  { status: LibraryItemStatus.PLAYED, label: "Played" },
] as const;

export const STATUS_SELECT_OPTIONS = [
  { label: "Up Next", description: "Want to play or replay" },
  { label: "Playing", description: "Actively engaged" },
  { label: "Shelf", description: "Own it, sitting there" },
  { label: "Played", description: "Have experienced" },
  { label: "Wishlist", description: "Want it someday" },
] as const;

export const STATUS_FILTER_TEST_CASES = [
  { status: LibraryItemStatus.WISHLIST, label: "Wishlist" },
  { status: LibraryItemStatus.SHELF, label: "Shelf" },
  { status: LibraryItemStatus.UP_NEXT, label: "Up Next" },
  { status: LibraryItemStatus.PLAYING, label: "Playing" },
  { status: LibraryItemStatus.PLAYED, label: "Played" },
] as const;

export const ACTION_BAR_STATUS_LABELS: Record<LibraryItemStatus, string> = {
  [LibraryItemStatus.WISHLIST]: "Wishlist",
  [LibraryItemStatus.SHELF]: "Shelf",
  [LibraryItemStatus.UP_NEXT]: "Up Next",
  [LibraryItemStatus.PLAYING]: "Playing",
  [LibraryItemStatus.PLAYED]: "Played",
};

export const VALID_IMAGE_TYPES = [
  { name: "photo.jpg", type: "image/jpeg", description: "JPEG" },
  { name: "photo.png", type: "image/png", description: "PNG" },
  { name: "animation.gif", type: "image/gif", description: "GIF" },
  { name: "photo.webp", type: "image/webp", description: "WebP" },
] as const;
