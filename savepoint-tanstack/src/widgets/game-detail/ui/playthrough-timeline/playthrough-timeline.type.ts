import type { PlaythroughWithEntries } from "@/entities/playthrough";

export type PlaythroughTimelineProps = {
  playthroughs: PlaythroughWithEntries[];
  onAddPlaythrough: () => void;
  onEditPlaythrough: (pt: PlaythroughWithEntries) => void;
  onLogSession: (pt: PlaythroughWithEntries) => void;
};
