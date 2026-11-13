import type {
  LibraryItem,
  LibraryItemStatus,
  ReleaseDatePrecision,
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
  /** Only meaningful with `status: WANT`; ignored for every other view. */
  notOwnedOnly?: boolean;
  minRating?: number;
  /** Only games without a rating; takes precedence over `minRating`. */
  unratedOnly?: boolean;
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
    releaseDatePrecision: ReleaseDatePrecision | null;
    releaseDateMovedFrom: Date | null;
    releaseDateMovedAt: Date | null;
    timeToCreditsSeconds: number | null;
    coverHue: number | null;
    coverChroma: number | null;
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
