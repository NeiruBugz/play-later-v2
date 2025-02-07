import {
  AcquisitionType,
  BacklogItemStatus,
} from "@/domain/entities/BacklogItem";

export const BacklogStatusMapper: Record<BacklogItemStatus, string> = {
  COMPLETED: "Completed",
  PLAYED: "Played",
  PLAYING: "Playing",
  TO_PLAY: "Backlog",
  WISHLIST: "Wishlist",
};

export const AcquisitionStatusMapper: Record<AcquisitionType, string> = {
  DIGITAL: "Digital",
  PHYSICAL: "Physical",
  SUBSCRIPTION: "Subscription service",
};
