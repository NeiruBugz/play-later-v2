/**
 * Props for the Quick actions group rendered inside the command palette.
 */
export type PaletteQuickActionsGroupProps = {
  /** Live search query; filters items by substring on the label. */
  query: string;
  /** Refocuses the palette input when "Add game to library" is activated. */
  onFocusSearch: () => void;
  /** Navigates to the journal index when "New journal entry" is activated. */
  onNewJournalEntry: () => void;
};
