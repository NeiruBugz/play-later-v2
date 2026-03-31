export const JournalMood = {
  EXCITED: "EXCITED",
  RELAXED: "RELAXED",
  FRUSTRATED: "FRUSTRATED",
  ACCOMPLISHED: "ACCOMPLISHED",
  CURIOUS: "CURIOUS",
  NOSTALGIC: "NOSTALGIC",
} as const;

export type JournalMood = (typeof JournalMood)[keyof typeof JournalMood];

export const JournalVisibility = {
  PRIVATE: "PRIVATE",
  FRIENDS_ONLY: "FRIENDS_ONLY",
  PUBLIC: "PUBLIC",
} as const;

export type JournalVisibility =
  (typeof JournalVisibility)[keyof typeof JournalVisibility];

export type { JournalEntry } from "@prisma/client";
