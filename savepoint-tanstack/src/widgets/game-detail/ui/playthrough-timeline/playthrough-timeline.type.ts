import type { PlaythroughWithEntries } from "@/entities/playthrough";

export type PlaythroughTimelineProps = {
  playthroughs: PlaythroughWithEntries[];
  framing: "journey";
  onAddPlaythrough: () => void;
  onEditPlaythrough: (pt: PlaythroughWithEntries) => void;
  onLogSession: (pt: PlaythroughWithEntries) => void;
};
