import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";
import type { UseUpNextMembershipResult } from "../../model/use-up-next-membership";

export type UpNextMenuActionsProps = {
  status: LibraryItemStatus;
  membership: UseUpNextMembershipResult;
  /** "menu" renders dropdown items; "button" renders a standalone button. */
  variant?: "menu" | "button";
};
