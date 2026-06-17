import type { PlaythroughWithEntries } from "@/entities/playthrough";

export type LogSessionContentProps = {
  playthroughs?: PlaythroughWithEntries[];
  preselectedPlaythroughId?: string;
  gameId?: string;
  /** Game slug forwarded from the global-action search param (Spec 025 Slice 2). */
  game?: string;
  onClose: () => void;
};
