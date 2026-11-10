import type {
  DoneOutcome,
  LibraryItemStatus,
} from "../../../../../shared/lib/prisma/client.ts";

export type StatusControlProps = {
  status: LibraryItemStatus;
  /** Read only when the status is Done: a "Let go" ending shows the "Let go" chip. */
  outcome?: DoneOutcome | null;
  onChange: (to: LibraryItemStatus) => void;
  disabled?: boolean;
};
