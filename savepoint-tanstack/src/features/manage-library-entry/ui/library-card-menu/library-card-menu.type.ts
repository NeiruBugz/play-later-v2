import type { LibraryItemWithGame } from "@/entities/library-item/api";

export type LibraryCardMenuProps = {
  item: LibraryItemWithGame;
  /**
   * Called when the user picks "Edit Library Details" — host opens the
   * `LibraryModal` for this entry. The card menu does NOT mount its own
   * modal (the LibraryPage already mounts a single shared modal).
   */
  onEdit: () => void;
};
