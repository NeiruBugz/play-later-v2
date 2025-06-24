import { AcquisitionType, BacklogItemStatus, type Game } from "@prisma/client";

export type GameFormValues =
  | Partial<Omit<Game, "releaseDate"> & { releaseDate: number }>
  | undefined;

export type BacklogItemFormValues = {
  backlogStatus: BacklogItemStatus;
  acquisitionType: AcquisitionType;
  platform?: string;
};

export type AddGameToBacklogInput = {
  game: Pick<Game, "igdbId">;
  backlogItem: {
    backlogStatus: BacklogItemStatus;
    acquisitionType: AcquisitionType;
    platform?: string;
  };
};
