import type { PlaythroughWithEntries } from "@/entities/playthrough";

export type LogSessionDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playthroughs: PlaythroughWithEntries[];
  preselectedPlaythroughId: string;
  gameId: string;
  /** Display name of the selected game shown in the header card. */
  gameTitle?: string;
  /** IGDB cover image ID for the header thumbnail. */
  coverImage?: string | null;
};
