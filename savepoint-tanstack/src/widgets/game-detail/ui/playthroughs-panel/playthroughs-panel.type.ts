import type { PlaythroughWithEntries } from "@/entities/playthrough";

export type PlaythroughsPanelProps = {
  libraryItemId: string;
  playthroughs: PlaythroughWithEntries[];
  framing: "journey";
  onAddPlaythrough: () => void;
  onEditPlaythrough: (pt: PlaythroughWithEntries) => void;
  onLogSession: (pt: PlaythroughWithEntries) => void;
};
