import type {
  AcquisitionType,
  LibraryItemStatus,
} from "@/data-access-layer/domain/library";

export const LibraryStatusMapper: Record<LibraryItemStatus, string> = {
  WANT_TO_PLAY: "Want to Play",
  OWNED: "Owned",
  PLAYING: "Playing",
  PLAYED: "Played",
};
export const AcquisitionStatusMapper: Record<AcquisitionType, string> = {
  DIGITAL: "Digital",
  PHYSICAL: "Physical",
  SUBSCRIPTION: "Subscription service",
  GIFT: "Gift",
  FREE: "Free to Play",
};
