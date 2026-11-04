export type PaletteQuickActionsGroupProps = {
  /** Live search query; filters items by substring on the label. */
  query: string;
  /** Opens the note composer when "New note" is activated. */
  onNewNote: () => void;
};
