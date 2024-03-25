import { GameStatus, PurchaseType } from "@prisma/client";
import { HowLongToBeatEntry } from "howlongtobeat";

export type AddGamePayload = Pick<HowLongToBeatEntry, "imageUrl"> & {
  id: string;
  status: GameStatus;
  howLongToBeatId: string;
  title: string;
  gameplayTime: number;
  createdAt?: Date;
  updatedAt?: Date;
  platform?: string;
  purchaseType?: PurchaseType;
  isWishlist?: boolean;
  rating?: number | null;
  review?: string | null;
  deletedAt?: Date | null;
  listId?: string | null;
};
