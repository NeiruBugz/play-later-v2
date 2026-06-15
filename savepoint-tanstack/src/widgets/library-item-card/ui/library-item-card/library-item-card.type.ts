import type { ReactNode } from "react";

import type { LibraryItemWithGame } from "@/entities/library-item/model";

export type LibraryItemCardProps = {
  item: LibraryItemWithGame;
  /**
   * Optional action-menu slot rendered absolutely-positioned on the cover
   * (top-right). Owned by the host (e.g. a feature-layer DropdownMenu).
   * The card body is a TanStack Link to /games/$slug — the host MUST stop
   * event propagation on menu interactions so they don't trigger that
   * outer navigation (preventDefault on the trigger button is the standard
   * shape; see LibraryCardMenu).
   */
  menu?: ReactNode;
  /**
   * When provided, an "Add playthrough" icon button is rendered below the
   * primary CTA. Omitting it hides the action entirely — use this to keep
   * the card action-free in read-only contexts (e.g. public-profile grid).
   */
  onAddPlaythrough?: (libraryItemId: number) => void;
};
