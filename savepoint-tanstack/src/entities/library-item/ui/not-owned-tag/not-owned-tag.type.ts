import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";

export type NotOwnedTagProps = {
  status: LibraryItemStatus;
  isOwned: boolean;
  className?: string;
};
