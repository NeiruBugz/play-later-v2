import type {
  LastPlayed,
  Platform,
  PlaytimeRange,
  PlaytimeStatus,
  SortBy,
} from "@/data-access-layer/repository/imported-game/types";
import type { ImportedGame } from "@prisma/client";

export type FindImportedGamesByUserIdInput = {
  userId: string;
  search?: string;
  page?: number;
  limit?: number;
  playtimeStatus?: PlaytimeStatus;
  playtimeRange?: PlaytimeRange;
  platform?: Platform;
  lastPlayed?: LastPlayed;
  sortBy?: SortBy;
};

export type FindImportedGamesByUserIdResult = {
  items: ImportedGame[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
