import { type AcquisitionType, type LibraryItemStatus } from "@prisma/client";
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
};
