import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";

export type LibraryStatusStripProps = {
  status: LibraryItemStatus;
  rating: number | null;
  platform: string | null;
};
