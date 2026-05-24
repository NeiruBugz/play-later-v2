import type {
  AcquisitionType,
  LibraryItem,
  LibraryItemStatus,
} from "../../../../shared/lib/prisma/client.ts";

export type GetLibraryFilters = {
  status?: LibraryItemStatus;
  platform?: string;
  acquisition?: AcquisitionType;
  /** When true, narrows to games the user has played at least once. */
  startedOnly?: boolean;
  minRating?: number;
  sortBy?: "title" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
};

export type LibraryItemWithGame = LibraryItem & {
  game: {
    id: string;
    igdbId: number;
    title: string;
    slug: string;
    coverImage: string | null;
    releaseDate: Date | null;
  };
};

export type GetLibraryResult = {
  items: LibraryItemWithGame[];
  total: number;
};

export type RecentGame = {
  gameId: string;
  title: string;
  coverImage: string | null;
  lastPlayed: Date;
};

export type LibraryStats = {
  statusCounts: Record<string, number>;
  /**
   * Real completion count: `LibraryItem.completedAt IS NOT NULL`. Distinct
   * from `statusCounts.PLAYED` — PLAYED means "started, then set aside or
   * finished" (it includes dropped games), whereas `completedCount` only
   * counts games the user explicitly marked complete. There is no `COMPLETED`
   * status enum; completion is a timestamp, not a status.
   */
  completedCount: number;
  recentGames: RecentGame[];
  journalCount: number;
};
