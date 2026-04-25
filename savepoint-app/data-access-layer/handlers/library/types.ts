import type { LibraryItemWithGameDomain } from "@/features/library/types";
import type { LibraryItemStatus } from "@/shared/types";

export type { LibraryItemWithGameDomain };

export interface GetStatusCountsHandlerInput {
  userId: string;
  platform?: string;
  search?: string;
}

export type GetStatusCountsHandlerOutput = Record<LibraryItemStatus, number>;

export interface GetLibraryHandlerInput {
  userId: string;

  status?: string;

  platform?: string;

  search?: string;

  sortBy?:
    | "updatedAt"
    | "createdAt"
    | "releaseDate"
    | "startedAt"
    | "completedAt"
    | "title"
    | "rating-desc"
    | "rating-asc";

  sortOrder?: "asc" | "desc";

  minRating?: number;

  unratedOnly?: boolean;

  offset?: number;

  limit?: number;
}

export interface GetLibraryHandlerOutput {
  items: LibraryItemWithGameDomain[];
  total: number;
  hasMore: boolean;
}
