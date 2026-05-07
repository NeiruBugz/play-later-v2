import type { ReactNode } from "react";

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
  /**
   * Optional action-menu slot rendered absolutely-positioned on the cover
   * (top-right). Owned by the host (e.g. a feature-layer DropdownMenu). The
   * card stays display-only — the host stops event propagation so menu
   * clicks don't trigger the card's onClick.
   */
  menu?: ReactNode;
};
