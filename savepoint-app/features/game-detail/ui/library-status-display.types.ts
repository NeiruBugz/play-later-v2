import type { LibraryItemDomain } from "@/features/library/types";
import type { LibraryItemStatus } from "@/shared/types";

export interface LibraryStatusDisplayProps {
  gameId?: string;
  userLibraryStatus?: {
    mostRecent: {
      status: LibraryItemStatus;
    };
    updatedAt: Date;
    allItems: LibraryItemDomain[];
  };
  igdbId: number;
  gameTitle: string;
}
