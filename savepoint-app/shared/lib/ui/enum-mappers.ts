import type {
  AcquisitionType,
  LibraryItemStatus,
} from "@/data-access-layer/domain/library";

export const LibraryStatusMapper: Record<LibraryItemStatus, string> = {
  CURIOUS_ABOUT: "Curious About",
  CURRENTLY_EXPLORING: "Currently Exploring",
  TOOK_A_BREAK: "Took a Break",
  EXPERIENCED: "Experienced",
  WISHLIST: "Wishlist",
  REVISITING: "Revisiting",
};
export const AcquisitionStatusMapper: Record<AcquisitionType, string> = {
  DIGITAL: "Digital",
  PHYSICAL: "Physical",
  SUBSCRIPTION: "Subscription service",
  GIFT: "Gift",
  FREE: "Free to Play",
};
