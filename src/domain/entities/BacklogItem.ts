export type BacklogItemStatus =
  | "TO_PLAY"
  | "PLAYED"
  | "PLAYING"
  | "COMPLETED"
  | "WISHLIST";
export type AcquisitionType = "PHYSICAL" | "DIGITAL" | "SUBSCRIPTION";

export interface BacklogItem {
  id?: number;
  status: BacklogItemStatus;
  platform?: string | null;
  userId: string;
  acquisitionType: AcquisitionType;
  gameId: string;
  createdAt?: Date;
  updatedAt?: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
}
