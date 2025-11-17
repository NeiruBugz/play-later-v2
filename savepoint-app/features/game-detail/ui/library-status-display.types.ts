import type { LibraryItem, LibraryItemStatus } from "@prisma/client";

export interface LibraryStatusDisplayProps {
  gameId?: string;
  userLibraryStatus?: {
    mostRecent: {
      status: LibraryItemStatus;
    };
    updatedAt: Date;
    allItems: LibraryItem[];
  };
  igdbId: number;
  gameTitle: string;
}
