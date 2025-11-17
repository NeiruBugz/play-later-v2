
import type { LibraryItemWithGameAndCount } from "@/shared/types";
// Re-export for handler use
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
