/**
 * Props for the Navigation group rendered inside the command palette.
 */
export type PaletteNavigationGroupProps = {
  /** Live search query; the group filters its items by substring on the label. */
  query: string;
  /** Called after the user activates an item, so the palette can close + reset. */
  onAfterSelect: () => void;
};
