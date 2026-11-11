import type { DoneOutcome } from "../../../../../shared/lib/prisma/client.ts";

export type DoneFollowUpProps = {
  itemId: number;
  gameTitle: string;
  currentRating: number | null;
  initialOutcome?: DoneOutcome;
  onClose: () => void;
  onUndo: () => Promise<void>;
  onSaved: () => void;
};
