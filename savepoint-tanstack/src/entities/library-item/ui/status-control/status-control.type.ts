import type {
  DoneOutcome,
  LibraryItemStatus,
} from "../../../../../shared/lib/prisma/client.ts";

export type StatusControlProps = {
  status: LibraryItemStatus;
  /** Read only when the status is Done: a "Let go" ending shows the "Let go" chip. */
  outcome?: DoneOutcome | null;
  /** Opt-in: a Done item with an outcome reads "Done · Let go" / "Done · Finished". */
  showDoneOutcome?: boolean;
  onChange: (to: LibraryItemStatus) => void;
  disabled?: boolean;
};
