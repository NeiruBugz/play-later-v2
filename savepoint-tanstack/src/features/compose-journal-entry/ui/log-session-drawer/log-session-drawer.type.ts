import type { PlaythroughWithEntries } from "@/entities/playthrough";

export type LogSessionDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playthroughs: PlaythroughWithEntries[];
  preselectedPlaythroughId: string;
  gameId: string;
};
