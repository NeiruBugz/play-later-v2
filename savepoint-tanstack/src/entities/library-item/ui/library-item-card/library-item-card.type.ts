import type { LibraryItemWithGame } from "../../model/types";

export type LibraryItemCardProps = {
  item: LibraryItemWithGame;
  /**
   * Optional click handler. When provided, the card becomes keyboard-
   * activatable (Enter / Space) and exposes `role="button"` so that
   * assistive tech announces it as an actionable element. The host owns
   * the modal state — the card stays display-only.
   */
  onClick?: () => void;
};
