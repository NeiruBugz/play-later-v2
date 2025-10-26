import {
  type AcquisitionType,
  type Game,
  type LibraryItem,
  type LibraryItemStatus,
  type Prisma,
  type User,
} from "@prisma/client";

export type RecentGame = {
  gameId: string;
  title: string;
  coverImage: string | null;
  lastPlayed: Date;
};

export type CreateLibraryItemInput = {
  userId: string;
  gameId: string;
  libraryItem: {
    status: LibraryItemStatus;
    acquisitionType: AcquisitionType;
    platform?: string;
    startedAt?: Date;
    completedAt?: Date;
  };
};

export type DeleteLibraryItemInput = {
  libraryItemId: number;
  userId: string;
};

export type UpdateLibraryItemInput = {
  userId: string;
  libraryItem: {
    id: number;
    status: LibraryItemStatus;
    platform?: string;
    startedAt?: Date;
    completedAt?: Date;
  };
};

export type GetLibraryItemsForUserByIgdbIdInput = {
  userId: string;
  igdbId: number;
};

export type GetManyLibraryItemsInput = {
  userId: string;
  gameId: string;
};

export type GetLibraryCountInput = {
  userId: string;
  status?: LibraryItemStatus;
  gteClause?: Prisma.LibraryItemWhereInput;
};

export type UserWithLibraryItemsResponse = {
  user: User;
  libraryItems: Array<LibraryItem & { game: Game }>;
};

export type AddGameToUserLibraryInput = {
  userId: string;
  igdbId: number;
  libraryItem: {
    status: LibraryItemStatus;
    platform?: string;
    acquisitionType: AcquisitionType;
  };
};

export type LibraryStatsResult =
  | {
      ok: true;
      data: {
        statusCounts: Record<string, number>;
        recentGames: Array<RecentGame>;
      };
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
      };
    };
