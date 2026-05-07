/**
 * Single-source-of-truth for status metadata shared by the desktop sidebar
 * (`library-filters`) and the mobile filter sheet (`mobile-filter-bar`).
 *
 * Mirrors canonical's `LIBRARY_STATUS_CONFIG` shape (label, icon, badgeVariant)
 * but typed against the tanstack search-param `LibraryStatus` union rather than
 * the Prisma enum.
 *
 * FSD: lives at `features/filter-library/lib/` because both surfaces inside the
 * same feature consume it. Lift to `entities/library-item/` only if a third
 * caller appears outside this feature.
 */

import {
  Archive,
  Bookmark,
  CheckCircle,
  Gamepad2,
  Star,
  type LucideIcon,
} from "lucide-react";

import type {
  LibrarySortBy,
  LibrarySortOrder,
  LibraryStatus,
} from "./types";

export type StatusBadgeVariant =
  | "wishlist"
  | "shelf"
  | "upNext"
  | "playing"
  | "played";

export type StatusEntry = {
  value: LibraryStatus;
  label: string;
  badgeVariant: StatusBadgeVariant;
  icon: LucideIcon;
};

export const STATUS_ENTRIES: ReadonlyArray<StatusEntry> = [
  { value: "UP_NEXT", label: "Up Next", badgeVariant: "upNext", icon: Star },
  {
    value: "PLAYING",
    label: "Playing",
    badgeVariant: "playing",
    icon: Gamepad2,
  },
  { value: "SHELF", label: "Shelf", badgeVariant: "shelf", icon: Archive },
  {
    value: "PLAYED",
    label: "Played",
    badgeVariant: "played",
    icon: CheckCircle,
  },
  {
    value: "WISHLIST",
    label: "Wishlist",
    badgeVariant: "wishlist",
    icon: Bookmark,
  },
];

export const STATUS_FILTER_STYLES: Record<
  StatusBadgeVariant,
  { active: string; inactive: string }
> = {
  playing: {
    active:
      "bg-[var(--status-playing)] text-[var(--status-playing-foreground)] hover:bg-[var(--status-playing)]/90 border-transparent",
    inactive:
      "border-[var(--status-playing)]/30 text-[var(--status-playing)] hover:bg-[var(--status-playing)]/10",
  },
  played: {
    active:
      "bg-[var(--status-played)] text-[var(--status-played-foreground)] hover:bg-[var(--status-played)]/90 border-transparent",
    inactive:
      "border-[var(--status-played)]/30 text-[var(--status-played)] hover:bg-[var(--status-played)]/10",
  },
  shelf: {
    active:
      "bg-[var(--status-shelf)] text-[var(--status-shelf-foreground)] hover:bg-[var(--status-shelf)]/90 border-transparent",
    inactive:
      "border-[var(--status-shelf)]/30 text-[var(--status-shelf)] hover:bg-[var(--status-shelf)]/10",
  },
  upNext: {
    active:
      "bg-[var(--status-upNext)] text-[var(--status-upNext-foreground)] hover:bg-[var(--status-upNext)]/90 border-transparent",
    inactive:
      "border-[var(--status-upNext)]/30 text-[var(--status-upNext)] hover:bg-[var(--status-upNext)]/10",
  },
  wishlist: {
    active:
      "bg-[var(--status-wishlist)] text-[var(--status-wishlist-foreground)] hover:bg-[var(--status-wishlist)]/90 border-transparent",
    inactive:
      "border-[var(--status-wishlist)]/30 text-[var(--status-wishlist)] hover:bg-[var(--status-wishlist)]/10",
  },
};

// ---------------------------------------------------------------------------
// Sort config
// ---------------------------------------------------------------------------

export type SortOption = {
  value: string;
  label: string;
  sortBy: LibrarySortBy;
  sortOrder: LibrarySortOrder;
};

export const SORT_OPTIONS: ReadonlyArray<SortOption> = [
  {
    value: "updatedAt-desc",
    label: "Recently Updated",
    sortBy: "updatedAt",
    sortOrder: "desc",
  },
  {
    value: "createdAt-desc",
    label: "Recently Added",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  {
    value: "title-asc",
    label: "Title A–Z",
    sortBy: "title",
    sortOrder: "asc",
  },
  {
    value: "title-desc",
    label: "Title Z–A",
    sortBy: "title",
    sortOrder: "desc",
  },
];

export const SORT_VALUE_MAP = new Map(
  SORT_OPTIONS.map((opt) => [opt.value, opt])
);

export function getSortValue(
  sortBy: LibrarySortBy,
  sortOrder: LibrarySortOrder
): string {
  return `${sortBy}-${sortOrder}`;
}

export const DEFAULT_PLATFORMS: ReadonlyArray<string> = [
  "PC",
  "PlayStation 5",
  "PlayStation 4",
  "Xbox Series X|S",
  "Xbox One",
  "Nintendo Switch",
];
