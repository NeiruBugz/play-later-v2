import type {
  LibraryItem,
  LibraryItemStatus,
} from "../../../../shared/lib/prisma/client.ts";

export type GetLibraryFilters = {
  status?: LibraryItemStatus;
  platform?: string;
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
  recentGames: RecentGame[];
  journalCount: number;
};
