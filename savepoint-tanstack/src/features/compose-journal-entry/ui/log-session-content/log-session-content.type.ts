import type { PlaythroughWithEntries } from "@/entities/playthrough";

export type LogSessionContentProps = {
  playthroughs?: PlaythroughWithEntries[];
  preselectedPlaythroughId?: string;
  gameId?: string;
  onClose: () => void;
};
