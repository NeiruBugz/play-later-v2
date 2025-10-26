import type {
  AcquisitionType,
  LibraryItemStatus,
} from "@/data-access-layer/domain/enums";

export const LibraryStatusMapper: Record<LibraryItemStatus, string> = {
  CURIOUS_ABOUT: "Curious About",
  CURRENTLY_EXPLORING: "Currently Exploring",
  TOOK_A_BREAK: "Took a Break",
  EXPERIENCED: "Experienced",
  WISHLIST: "Wishlist",
  REVISITING: "Revisiting",
};

export const AcquisitionTypeMapper: Record<AcquisitionType, string> = {
  DIGITAL: "Digital",
  PHYSICAL: "Physical",
  SUBSCRIPTION: "Subscription service",
};

export const LibraryStatusColorMapper: Record<LibraryItemStatus, string> = {
  CURIOUS_ABOUT:
    "bg-blue-600 text-white border-blue-700 dark:bg-blue-500 dark:text-white dark:border-blue-400",
  CURRENTLY_EXPLORING:
    "bg-green-600 text-white border-green-700 dark:bg-green-500 dark:text-white dark:border-green-400",
  TOOK_A_BREAK:
    "bg-amber-600 text-white border-amber-700 dark:bg-amber-500 dark:text-white dark:border-amber-400",
  EXPERIENCED:
    "bg-purple-600 text-white border-purple-700 dark:bg-purple-500 dark:text-white dark:border-purple-400",
  WISHLIST:
    "bg-pink-600 text-white border-pink-700 dark:bg-pink-500 dark:text-white dark:border-pink-400",
  REVISITING:
    "bg-orange-600 text-white border-orange-700 dark:bg-orange-500 dark:text-white dark:border-orange-400",
};
