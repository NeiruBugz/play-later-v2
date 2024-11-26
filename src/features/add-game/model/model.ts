import { AcquisitionType, BacklogItemStatus, type Game } from "@prisma/client";

export type GameFormValues =
  | Partial<Omit<Game, "releaseDate"> & { releaseDate: number }>
  | undefined;

export type BacklogItemFormValues = {
  backlogStatus: BacklogItemStatus;
  acquisitionType: AcquisitionType;
  platform?: string;
};

export const initialFormValues: BacklogItemFormValues = {
  backlogStatus: BacklogItemStatus.TO_PLAY,
  acquisitionType: AcquisitionType.DIGITAL,
  platform: "",
};
