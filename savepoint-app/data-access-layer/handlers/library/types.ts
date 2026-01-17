import type { LibraryItemWithGameDomain } from "@/shared/types";

export type { LibraryItemWithGameDomain };

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
    | "title";

  sortOrder?: "asc" | "desc";

  offset?: number;

  limit?: number;
}

export interface GetLibraryHandlerOutput {
  items: LibraryItemWithGameDomain[];
  total: number;
  hasMore: boolean;
}
