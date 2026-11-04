import type { ReactNode } from "react";

import type { LibraryItemWithGame } from "@/entities/library-item/model";
import type { UseSetOwnershipResult } from "@/features/manage-library-entry";

export type LibraryItemCardProps = {
  item: LibraryItemWithGame;
  /**
   * Optional action-menu slot rendered absolutely-positioned on the cover
   * (top-right). Owned by the host (e.g. a feature-layer DropdownMenu).
   * The card body is a TanStack Link to /games/$slug — the host MUST stop
   * event propagation on menu interactions so they don't trigger that
   * outer navigation (preventDefault on the trigger button is the standard
   * shape; see LibraryCardMenu). A function receives the Up Next menu
   * items (hidden for Playing) to pass on as the menu's `extraItems`, and the
   * card's ownership state so the menu and the "Not owned" tag agree.
   */
  menu?:
    | ReactNode
    | ((
        upNextActions: ReactNode,
        ownership: UseSetOwnershipResult
      ) => ReactNode);
  /**
   * "responsive" (default) is a row on phones and a vertical tile from md up;
   * "row" stays a row at every width (library list view).
   */
  layout?: "responsive" | "row";
};
