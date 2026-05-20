import type { ImportedGame } from "@/entities/imported-game/model/types";

export type ImportedGameCardProps = {
  game: ImportedGame;
  /** Whether the per-row bulk-select checkbox is checked. */
  selected: boolean;
  /** Called when the user toggles the bulk-select checkbox. */
  onSelectionChange: (importedGameId: string, selected: boolean) => void;
  /**
   * Per-row "Add to library" handler. Only invoked for MATCHED rows. Widget
   * owns the implementation (wraps `addGameToLibraryFn`).
   */
  onAddToLibrary?: () => void;
  /** Per-row dismiss handler. Sets `igdbMatchStatus: IGNORED`. */
  onDismiss?: () => void;
  /** Per-row IGDB-search handler for unmatched rows. Opens the manual-search popover. */
  onManualSearch?: () => void;
  /** Disables interactive elements while a parent mutation is in flight. */
  isPending?: boolean;
};
