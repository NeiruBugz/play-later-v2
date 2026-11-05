import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";

export type InLibraryIndicatorProps = {
  status: LibraryItemStatus;
  upNextPosition: number | null;
};
