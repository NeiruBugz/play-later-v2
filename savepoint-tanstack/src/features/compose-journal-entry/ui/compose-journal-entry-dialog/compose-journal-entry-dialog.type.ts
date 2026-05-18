export type ComposeJournalEntryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select a game (used when opened from game-detail). */
  defaultGameId?: string;
};
