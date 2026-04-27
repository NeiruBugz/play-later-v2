import { JournalMood } from "@/shared/types";

export const MOOD_LABELS: Record<JournalMood, string> = {
  [JournalMood.EXCITED]: "Hyped",
  [JournalMood.RELAXED]: "Chill",
  [JournalMood.FRUSTRATED]: "Fried",
  [JournalMood.ACCOMPLISHED]: "Proud",
  [JournalMood.CURIOUS]: "Curious",
  [JournalMood.NOSTALGIC]: "Nostalgic",
};
