// Domain enums exposed for UI/server-actions without importing Prisma directly.
// Keep in sync with prisma/schema.prisma.

export const LIBRARY_ITEM_STATUS = [
  "CURIOUS_ABOUT",
  "CURRENTLY_EXPLORING",
  "TOOK_A_BREAK",
  "EXPERIENCED",
  "WISHLIST",
  "REVISITING",
] as const;

export type LibraryItemStatus = (typeof LIBRARY_ITEM_STATUS)[number];

export const ACQUISITION_TYPES = [
  "PHYSICAL",
  "DIGITAL",
  "SUBSCRIPTION",
] as const;

export type AcquisitionType = (typeof ACQUISITION_TYPES)[number];

export const STOREFRONTS = ["STEAM", "PLAYSTATION", "XBOX"] as const;
export type Storefront = (typeof STOREFRONTS)[number];
