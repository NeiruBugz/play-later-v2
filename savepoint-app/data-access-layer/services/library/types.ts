import { ServiceResult } from "@/data-access-layer/services";
import type {
  AcquisitionType,
  Game,
  LibraryItem,
  LibraryItemStatus,
} from "@prisma/client";

export type GetLibraryItemsInput = {
  userId: string;
  gameId: string;
  status?: LibraryItemStatus;
  platform?: string;
};

export type CreateLibraryItemInput = {
  userId: string;
  gameId: string;
  status?: LibraryItemStatus;
  platform?: string;
  acquisitionType?: AcquisitionType;
  startedAt?: Date;
  completedAt?: Date;
};

export type UpdateLibraryItemInput = {
  userId: string;
  id: number;
  status: LibraryItemStatus;
  platform?: string;
  startedAt?: Date;
  completedAt?: Date;
};
export type DeleteLibraryItemInput = {
  userId: string;
  libraryItemId: number;
};

export type GetLibraryCountInput = {
  userId: string;
  status?: LibraryItemStatus;
  createdAfter?: Date;
};

export type LibraryItemWithGame = LibraryItem & {
  game: Game;
};

export type GetLibraryItemsResult = ServiceResult<{
  items: LibraryItem[];
  total: number;
}>;

export type CreateLibraryItemResult = ServiceResult<{
  item: LibraryItem;
}>;

export type UpdateLibraryItemResult = ServiceResult<{
  item: LibraryItem;
}>;

export type DeleteLibraryItemResult = ServiceResult<{
  message: string;
}>;

export type GetLibraryCountResult = ServiceResult<{
  count: number;
}>;

export type AddGameToLibraryInput = {
  userId: string;
  igdbId: number;
  status: LibraryItemStatus;
  platform: string;
  acquisitionType?: AcquisitionType;
  startedAt?: Date;
  completedAt?: Date;
};

export type AddGameToLibraryResult = ServiceResult<{
  game: Game;
}>;
