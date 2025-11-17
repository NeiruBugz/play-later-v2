import type { LibraryItemWithGameAndCount } from "@/shared/types";

export type { LibraryItemWithGameAndCount };

export interface GetLibraryHandlerInput {
  userId: string;

  status?: string;

  platform?: string;

  search?: string;

  sortBy?: "createdAt" | "releaseDate" | "startedAt" | "completedAt";

  sortOrder?: "asc" | "desc";
}

export type GetLibraryHandlerOutput = LibraryItemWithGameAndCount[];
