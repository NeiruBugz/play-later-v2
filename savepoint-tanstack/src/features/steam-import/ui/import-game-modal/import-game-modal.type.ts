import type { ImportedGame } from "@/entities/imported-game/model/types";

export type ImportGameModalProps = {
  isOpen: boolean;
  onClose: () => void;
  game: ImportedGame;
  /**
   * Start the modal directly on the manual-search step (skipping the
   * status picker). Used when the per-row "Search IGDB" CTA opens the
   * modal — the user has already declared they want manual.
   */
  startOnSearch?: boolean;
  /**
   * Fired after a successful import. Parent typically calls
   * `router.invalidate()` and may show a toast.
   */
  onImported?: () => void;
};
