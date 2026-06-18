import type { PlaythroughWithEntries } from "@/entities/playthrough";

export type LogSessionContentProps = {
  playthroughs?: PlaythroughWithEntries[];
  preselectedPlaythroughId?: string;
  gameId?: string;
  /** Display name of the selected game shown in the header card. When omitted the header is not rendered. */
  gameTitle?: string;
  /** Playthrough display name for the header sub-line (e.g. "Main playthrough"). */
  playthroughName?: string;
  /** IGDB cover image ID used to render the thumbnail in the header card. */
  coverImage?: string | null;
  onClose: () => void;
};
