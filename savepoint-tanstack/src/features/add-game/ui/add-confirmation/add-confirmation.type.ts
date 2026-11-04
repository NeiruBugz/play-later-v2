import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";

export type AddConfirmationProps = {
  gameTitle: string;
  status: LibraryItemStatus;
  upNextPosition: number | null;
  /** Resolves true when the follow-up saved, which dismisses the confirmation. */
  onStartPlaying?: () => Promise<boolean>;
  onPutInUpNext?: () => Promise<boolean>;
  /** Passed only when the game was just created, so Undo can never remove an existing item. */
  onUndo?: () => Promise<boolean>;
  onDismiss: () => void;
  durationMs?: number;
};
