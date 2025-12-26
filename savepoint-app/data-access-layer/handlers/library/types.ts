import type { LibraryItemWithGameDomain } from "@/shared/types";

export type { LibraryItemWithGameDomain };

export interface GetLibraryHandlerInput {
  userId: string;

  status?: string;

  platform?: string;

  search?: string;

  sortBy?: "createdAt" | "releaseDate" | "startedAt" | "completedAt";

  sortOrder?: "asc" | "desc";

  offset?: number;

  limit?: number;
}

export interface GetLibraryHandlerOutput {
  items: LibraryItemWithGameDomain[];
  total: number;
  hasMore: boolean;
}
