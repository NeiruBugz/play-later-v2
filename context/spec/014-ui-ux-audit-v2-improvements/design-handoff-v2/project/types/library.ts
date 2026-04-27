export const LibraryItemStatus = {
  WISHLIST: "WISHLIST",
  SHELF: "SHELF",
  UP_NEXT: "UP_NEXT",
  PLAYING: "PLAYING",
  PLAYED: "PLAYED",
} as const;

export type LibraryItemStatus =
  (typeof LibraryItemStatus)[keyof typeof LibraryItemStatus];

export const AcquisitionType = {
  PHYSICAL: "PHYSICAL",
  DIGITAL: "DIGITAL",
  SUBSCRIPTION: "SUBSCRIPTION",
} as const;

export type AcquisitionType =
  (typeof AcquisitionType)[keyof typeof AcquisitionType];

export type { LibraryItem } from "@prisma/client";
