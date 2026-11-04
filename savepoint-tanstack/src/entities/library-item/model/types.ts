import type {
  AcquisitionType,
  LibraryItem,
  LibraryItemStatus,
} from "../../../../shared/lib/prisma/client.ts";

export type GetLibraryFilters = {
  status?: LibraryItemStatus;
  /**
   * Status-agnostic queue view: every item with a non-null `upNextPosition`
   * (WANT or DONE), ordered by position ascending. Takes precedence over
   * `status` and the sort params.
   */
  upNext?: boolean;
  platform?: string;
  acquisition?: AcquisitionType;
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
  slug: string;
  title: string;
  coverImage: string | null;
  lastPlayed: Date;
};

export type LibraryStats = {
  want: number;
  playing: number;
  done: number;
  recentGames: RecentGame[];
  journalCount: number;
};
