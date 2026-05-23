import type { LibraryItemWithGame } from "@/entities/library-item/model";

import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";

export type DashboardGameSectionVariant = "default" | "hero";

/**
 * Typed "View All" target for the library route. Only the fields the section
 * actually uses (`status` and the sort pair) are surfaced — keeps the call
 * site minimal and forwards to the library route's `validateSearch` schema
 * without needing the full search type here.
 */
export type DashboardGameSectionViewAll = {
  /** Library status filter to apply. Omit for "all statuses". */
  status?: LibraryItemStatus;
  sortBy?: "title" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
};

export type DashboardGameSectionProps = {
  title: string;
  items: LibraryItemWithGame[];
  /** Typed library route search params for the "View All" / empty-state CTA. */
  viewAll: DashboardGameSectionViewAll;
  viewAllLabel?: string;
  emptyMessage?: string;
  /**
   * Total available count. When `undefined` or equal to `items.length`, the
   * "View All" link is hidden — there's nothing more to show.
   */
  totalCount?: number;
  /** `"hero"` uses a sparser 4-up grid for primary surfaces (Continue Playing). */
  variant?: DashboardGameSectionVariant;
};
