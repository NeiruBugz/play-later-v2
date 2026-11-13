import type { ReleaseGame } from "../../model";

export interface ReleaseLinesProps {
  game: ReleaseGame & {
    releaseDateMovedFrom: Date | null;
    releaseDateMovedAt: Date | null;
  };
}
