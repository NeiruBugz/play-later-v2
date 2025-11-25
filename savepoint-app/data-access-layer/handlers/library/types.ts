import type { LibraryItemWithGameDomain } from "@/shared/types";

export type { LibraryItemWithGameDomain };

export interface GetLibraryHandlerInput {
  userId: string;

  status?: string;

  platform?: string;

  search?: string;

  sortBy?: "createdAt" | "releaseDate" | "startedAt" | "completedAt";

  sortOrder?: "asc" | "desc";
}

export type GetLibraryHandlerOutput = LibraryItemWithGameDomain[];
