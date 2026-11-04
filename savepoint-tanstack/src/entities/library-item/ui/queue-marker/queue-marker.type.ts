import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";

export type QueueMarkerProps = {
  status: LibraryItemStatus;
  upNextPosition: number | null;
  className?: string;
};
