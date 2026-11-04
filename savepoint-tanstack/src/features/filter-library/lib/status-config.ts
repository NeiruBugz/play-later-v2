/**
 * Filter-specific status decoration. The entity layer
 * (`@/entities/library-item`) owns the canonical status metadata
 * (label / icon / badge variant); this module composes on top with the
 * filter-button active/inactive styles and the sort options used by
 * `library-filters` + `mobile-filter-bar`.
 *
 * FSD: feature → entity is allowed; the inverse is not. If a non-filter
 * surface needs `STATUS_ENTRIES`, it imports from `@/entities/library-item`,
 * not from here.
 */

import { ListOrdered, type LucideIcon } from "lucide-react";

import {
  ACQUISITION_FILTER_ENTRIES,
  getStatusEntry,
  STATUS_ENTRIES,
  type AcquisitionFilterEntry,
  type StatusBadgeVariant,
  type StatusEntry,
} from "@/entities/library-item";

import type {
  LibrarySortBy,
  LibrarySortOrder,
  LibraryStatus,
  LibraryStatusCounts,
} from "./types";

export { STATUS_ENTRIES, getStatusEntry, ACQUISITION_FILTER_ENTRIES };
export type { StatusBadgeVariant, StatusEntry, AcquisitionFilterEntry };

/**
 * Two-tone filter styling — Slice 18A visual-parity push (Phase 3).
 *
 * The previous palette gave each status its own saturated brand color
 * across both states, which diverged from canonical's quieter, single-
 * accent rail. We collapse to:
 *  - idle: muted foreground, transparent background, no border accent
 *  - active: primary token (brand red on light, theme-aware in dark)
 *
 * The 3 per-status entries are kept (vs. a single shared shape) so a
 * future spec can re-introduce dot-glyphs or per-status decoration
 * without rewriting the consumer call sites.
 */
const IDLE = "border-transparent text-muted-foreground hover:bg-muted/50";
const ACTIVE =
  "bg-primary text-primary-foreground border-transparent hover:bg-primary/90";

/**
 * Shared two-tone toggle styling for any single-select filter button (status,
 * acquisition). Active = primary token; idle = muted. Keeps the rail visually
 * uniform across sections.
 */
export const FILTER_TOGGLE_STYLE: { active: string; inactive: string } = {
  active: ACTIVE,
  inactive: IDLE,
};

export const STATUS_FILTER_STYLES: Record<
  StatusBadgeVariant,
  { active: string; inactive: string }
> = {
  want: { active: ACTIVE, inactive: IDLE },
  playing: { active: ACTIVE, inactive: IDLE },
  done: { active: ACTIVE, inactive: IDLE },
};

export type StatusFilterEntry = {
  value: LibraryStatus;
  label: string;
  icon: LucideIcon;
  badgeVariant?: StatusBadgeVariant;
};

export const STATUS_FILTER_ENTRIES: ReadonlyArray<StatusFilterEntry> = [
  { value: "UP_NEXT", label: "Up Next", icon: ListOrdered },
  ...STATUS_ENTRIES,
];

/** Up Next marks games already counted under Want or Done, so it is not summed. */
export function getTotalCount(
  counts: LibraryStatusCounts | undefined
): number | undefined {
  if (!counts) return undefined;
  return STATUS_ENTRIES.reduce(
    (sum, entry) => sum + (counts[entry.value] ?? 0),
    0
  );
}

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
