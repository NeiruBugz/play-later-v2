import {
  type AcquisitionType,
  type Game,
  type LibraryItemStatus,
} from "@prisma/client";

export type GameFormValues =
  | Partial<Omit<Game, "releaseDate"> & { releaseDate: number }>
  | undefined;

export type LibraryItemFormValues = {
  libraryItemStatus: LibraryItemStatus;
  acquisitionType: AcquisitionType;
  platform?: string;
};

export type AddGameToLibraryInput = {
  game: Pick<Game, "igdbId">;
  libraryItem: {
    libraryItemStatus: LibraryItemStatus;
    acquisitionType: AcquisitionType;
    platform?: string;
  };
};
