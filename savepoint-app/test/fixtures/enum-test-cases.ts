import { LibraryItemStatus } from "@/data-access-layer/domain/library";

export const STATUS_BADGE_TEST_CASES = [
  { status: LibraryItemStatus.WANT_TO_PLAY, label: "Want to Play" },
  { status: LibraryItemStatus.OWNED, label: "Owned" },
  { status: LibraryItemStatus.PLAYING, label: "Playing" },
  { status: LibraryItemStatus.PLAYED, label: "Played" },
] as const;

export const STATUS_SELECT_OPTIONS = [
  { label: "Want to Play", description: "On your radar, haven't started" },
  { label: "Owned", description: "In your library, haven't started" },
  { label: "Playing", description: "Currently engaged" },
  { label: "Played", description: "Have experienced it" },
] as const;

export const STATUS_FILTER_TEST_CASES = [
  { status: LibraryItemStatus.WANT_TO_PLAY, label: "Want to Play" },
  { status: LibraryItemStatus.OWNED, label: "Owned" },
  { status: LibraryItemStatus.PLAYING, label: "Playing" },
  { status: LibraryItemStatus.PLAYED, label: "Played" },
] as const;

export const ACTION_BAR_STATUS_LABELS: Record<LibraryItemStatus, string> = {
  [LibraryItemStatus.WANT_TO_PLAY]: "Want to Play",
  [LibraryItemStatus.OWNED]: "Owned",
  [LibraryItemStatus.PLAYING]: "Playing",
  [LibraryItemStatus.PLAYED]: "Played",
};

export const VALID_IMAGE_TYPES = [
  { name: "photo.jpg", type: "image/jpeg", description: "JPEG" },
  { name: "photo.png", type: "image/png", description: "PNG" },
  { name: "animation.gif", type: "image/gif", description: "GIF" },
  { name: "photo.webp", type: "image/webp", description: "WebP" },
] as const;
