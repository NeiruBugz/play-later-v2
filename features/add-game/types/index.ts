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
  game: Omit<Game, "id" | "createdAt" | "updatedAt" | "userId">;
  backlogItem: {
    backlogStatus: string;
    acquisitionType: string;
    platform?: string;
  };
};
