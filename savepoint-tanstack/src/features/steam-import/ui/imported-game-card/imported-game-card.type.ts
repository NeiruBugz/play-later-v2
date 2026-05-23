import type { ImportedGame } from "@/entities/imported-game/model/types";

export type ImportedGameCardProps = {
  game: ImportedGame;
  /**
   * Per-row "Import to library" handler. Widget owns the implementation
   * (typically opens the `ImportGameModal`).
   */
  onAddToLibrary?: () => void;
  /** Per-row dismiss handler. Sets `igdbMatchStatus: IGNORED`. */
  onDismiss?: () => void;
  /** Disables interactive elements while a parent mutation is in flight. */
  isPending?: boolean;
};
