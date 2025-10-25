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
  "DIGITAL",
  "PHYSICAL",
  "SUBSCRIPTION",
] as const;

export type AcquisitionType = (typeof ACQUISITION_TYPES)[number];

export const STOREFRONTS = ["STEAM", "PLAYSTATION", "XBOX"] as const;
export type Storefront = (typeof STOREFRONTS)[number];
